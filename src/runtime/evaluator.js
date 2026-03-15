// src/runtime/evaluator.js
import { Environment, QArray } from './environment.js';
import { BuiltIns } from './builtins.js';
import { getCharFromCP437, getCP437FromChar, toCP437Array } from '../hardware/encoding.js';

/**
 * The core execution engine of Sysclone.
 * Acts as a virtual CPU that traverses the AST and interacts with the Hardware Abstraction Layer.
 * Uses Generator functions (*evaluate) to allow non-blocking execution in the browser.
 */
export class Evaluator {
    constructor(env = null, hardware = { vga: null, io: null, memory: null }) {
        // Setup the 3-Tier Architecture natively if no custom env is provided
        if (!env) {
            const rootEnv = new Environment();     // Tier 1: Global/Shared
            this.env = new Environment(rootEnv);   // Tier 2: Main Module
        } else {
            this.env = env;
        }
        this.hw = hardware;
        this.labels = new Map();
        this.hasScannedLabels = false;
        this.topLevelBlock = undefined;
    }

    /**
     * Pre-calculates (hoists) labels, subroutines, types, and data entries.
     * Maps the program structure before execution starts.
     * @param {Object|Array} node - The AST node to scan.
     * @param {boolean} insideSub - Flag to prevent global label pollution from local subroutines.
     */
    scanLabels(node, insideSub = false) {
        if (!node) return;
        
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                if (node[i]) {
                    if (node[i].type === 'LABEL' && !insideSub) {
                        // Only register labels in the current execution scope
                        this.labels.set(node[i].name.toUpperCase(), { 
                            block: node, 
                            index: i,
                            dataIndex: this.env.getDataCount() 
                        });
                    } else if (node[i].type === 'SUB_DEF' || node[i].type === 'FUNCTION_DEF' || node[i].type === 'DEF_FN') {
                        if (!insideSub) {
                            const params = node[i].params || [];
                            const body = node[i].type === 'DEF_FN' ? node[i].expression : node[i].body;                        
                            this.env.defineSub(node[i].name, params, body, node[i].type, node[i].isStatic || false);
                            
                            // Recurse to hoist DATA, but lock the scope so local labels don't leak globally!
                            this.scanLabels(node[i].body, true);
                        }
                    } else if (node[i].type === 'DEFINT') {
                        if (!insideSub) this.env.defineDefInt(node[i].range);
                    } else if (node[i].type === 'TYPE_DECL') {
                        if (!insideSub) this.env.defineType(node[i].name, node[i].fields);
                    } else if (node[i].type === 'DATA') {
                        // DATA is universally global, BUT only hoisted by the top-level Evaluator (no parent)
                        if (!this.env.parent) {
                            this.env.addData(node[i].values);
                        }
                    }
                    
                    // Recurse into standard blocks (IF, FOR, DO, etc.)
                    if (node[i].type !== 'LABEL' && node[i].type !== 'SUB_DEF' && node[i].type !== 'FUNCTION_DEF' && node[i].type !== 'DEF_FN') {
                        this.scanLabels(node[i], insideSub);
                    }
                }
            }
        } else if (typeof node === 'object') {
            for (let key in node) {
                if (key !== 'parent' && key !== 'env' && typeof node[key] === 'object') {
                    this.scanLabels(node[key], insideSub);
                }
            }
        }
    }

    /**
     * Main execution generator.
     * Implements "Control Flow Bubbling" to handle jumps across nested scopes.
     */
    *evaluate(node) {
        if (!node) return null;

        // --- BLOCK MANAGEMENT (The heart of jumps) ---
        if (Array.isArray(node)) {
            if (!this.hasScannedLabels) {
                this.scanLabels(node); 
                this.hasScannedLabels = true;
            }

            let currentBlock = node;
            let i = 0;
            let isTopLevel = (this.topLevelBlock === undefined);
            if (isTopLevel) this.topLevelBlock = node;

            while (i < currentBlock.length) {
                yield; // Virtual CPU TICK

                const stmt = currentBlock[i];
                const result = yield* this.evaluate(stmt);

                // Control flow signal interception
                if (result && result._control) {
                    if (result._control === 'END') return result; // Immediate halt

                    if (result._control === 'GOTO') {
                        const target = this.labels.get(result.label);
                        if (!target) throw new Error("Label not found: " + result.label);

                        if (target.block === currentBlock) {
                            i = target.index; // Local jump
                            continue;
                        } else if (isTopLevel) {
                            currentBlock = target.block; // Global jump (e.g., exiting an IF block)
                            i = target.index;
                            continue;
                        } else {
                            return result; // Bubbling: propagate jump up to parent scope
                        }
                    }
                    if (result._control === 'RETURN') {
                        if (isTopLevel) throw new Error("RETURN without GOSUB detected");
                        return result; 
                    }
                    // BUBBLING: Propagate the EXIT instruction up until a loop or block catches it
                    if (result._control === 'EXIT') {
                        return result;
                    }
                }
                i++;
            }
            if (isTopLevel) this.topLevelBlock = undefined;
            return null;
        }

        switch (node.type) {
            case 'LABEL': return null;
                
            case 'GOTO': 
                return { _control: 'GOTO', label: node.label.toUpperCase() };

            case 'RETURN': 
                return { _control: 'RETURN' };

            case 'EXIT':
                return { _control: 'EXIT', target: node.target };

            case 'GOSUB':
                const target = this.labels.get(node.label.toUpperCase());
                if (!target) throw new Error("Label not found for GOSUB: " + node.label);

                let subBlock = target.block;
                let subIndex = target.index;

                // Isolated execution loop (Mini-CallStack)
                while (subIndex < subBlock.length) {
                    yield; // Virtual CPU TICK

                    const res = yield* this.evaluate(subBlock[subIndex]);
                    if (res && res._control === 'RETURN') break; 
                    
                    if (res && res._control === 'GOTO') {
                        const gt = this.labels.get(res.label);
                        subBlock = gt.block;
                        subIndex = gt.index;
                        continue;
                    }
                    subIndex++;
                }
                return null;

            // --- VARIABLES AND VALUES ---
            case 'NUMBER': case 'STRING': return node.value;
            case 'IDENTIFIER': 
                const varName = node.value.toUpperCase();
                
                // 1. Hardware interception (I/O)
                if (varName === 'INKEY$') return this.hw.io ? this.hw.io.inkey() : "";
                if (varName === 'TIMER')  return this.hw.io ? this.hw.io.timer() : 0;
                
                // 2. Pure STDLIB interception (e.g., RND without parentheses)
                if (BuiltIns[varName]) {
                    return BuiltIns[varName]([]);
                }

                // 3. Implicit user function call (no parentheses)
                const routine = this.env.getSub(varName);
                if (routine && routine.type === 'FUNCTION_DEF') {
                    return yield* this.evaluateCall({ type: 'CALL', callee: node, args: [] });
                }
                
                // 4. Standard variable lookup
                return this.env.lookup(node.value);

            case 'BINARY_OP': return yield* this.evaluateBinaryOp(node);
            case 'UNARY_OP': return yield* this.evaluateUnaryOp(node);
            case 'MEMBER_ACCESS':
                const obj = yield* this.evaluate(node.object);
                return obj[node.property.toUpperCase()];

            // --- DATA STRUCTURES ---
            case 'CONST':
                for (let decl of node.declarations) {
                    const constVal = yield* this.evaluate(decl.value);
                    this.env.define(decl.name, constVal);
                }
                return null;

            case 'SUB_DEF':
            case 'FUNCTION_DEF':
            case 'DEF_FN':
                // The definitions are hoisted during scanLabels(). 
                // When the CPU actually reaches them in the code flow, it should just step over them.
                return null;

            case 'TYPE_DECL':
                this.env.defineType(node.name, node.fields);
                return null;

            case 'REDIM': // REDIM is treated exactly like DIM for now (reallocation)
            case 'DIM':
                for (let decl of node.declarations) {
                    const typeName = decl.varType || decl.type || 'SINGLE'; 
                    const creator = () => this.env.createDefaultValue(typeName);
                    
                    let initValue;
                    if (decl.isArray) {
                        const bounds = [];
                        for (let b of decl.bounds) {
                            bounds.push({ min: yield* this.evaluate(b.min), max: yield* this.evaluate(b.max) });
                        }
                        initValue = new QArray(bounds, creator);
                    } else {
                        initValue = creator();
                    }
                    
                    // Route to Tier 1 if SHARED (using node.shared from dimDecl), otherwise stay in local scope
                    if (node.shared) {
                        this.env.sharedEnv.define(decl.name, initValue);
                    } else {
                        this.env.define(decl.name, initValue);
                    }
                }
                return null;

            case 'STATIC':
                for (let decl of node.declarations) {
                    const upperName = decl.name.toUpperCase();
                    // Initialize ONLY ONCE: if it's already in the vault, we skip!
                    if (this.env.staticScope && !this.env.staticScope.has(upperName)) {
                        const typeName = decl.varType || decl.type || 'SINGLE'; 
                        const creator = () => this.env.createDefaultValue(typeName);
                        let initValue;
                        if (decl.isArray) {
                            const bounds = [];
                            for (let b of decl.bounds) {
                                bounds.push({ min: yield* this.evaluate(b.min), max: yield* this.evaluate(b.max) });
                            }
                            initValue = new QArray(bounds, creator);
                        } else {
                            initValue = creator();
                        }
                        this.env.staticScope.set(upperName, initValue);
                    }
                }
                return null;

            // --- CONTROL FLOW ---
            case 'IF': {
                // 1. Check primary IF condition
                const condition = yield* this.evaluate(node.condition);
                if (condition !== 0 && condition !== false) {
                    const res = yield* this.evaluate(node.thenBlock);
                    if (res && res._control) return res; 
                    return null; // Exit early if branch matched
                } 
                
                // 2. Check all ELSEIF conditions sequentially
                if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
                    for (let elseIf of node.elseIfBlocks) {
                        const elseIfCond = yield* this.evaluate(elseIf.condition);
                        if (elseIfCond !== 0 && elseIfCond !== false) {
                            const res = yield* this.evaluate(elseIf.block);
                            if (res && res._control) return res;
                            return null; // Exit early if branch matched
                        }
                    }
                }

                // 3. Fallback to ELSE block
                if (node.elseBlock && node.elseBlock.length > 0) {
                    const res = yield* this.evaluate(node.elseBlock);
                    if (res && res._control) return res;
                }
                return null;
            }

            case 'FOR':
                const startVal = yield* this.evaluate(node.start);
                const endVal = yield* this.evaluate(node.end);
                const stepVal = node.step ? yield* this.evaluate(node.step) : 1;
                
                this.env.assign(node.variable, startVal);
                
                while (true) {
                    yield; 
                    const currentVal = this.env.lookup(node.variable);
                    if (stepVal > 0 && currentVal > endVal) break;
                    if (stepVal < 0 && currentVal < endVal) break;
                    
                    const res = yield* this.evaluate(node.body);
                    if (res && res._control) {
                        // Catch the EXIT specifically targeted for the FOR loop
                        if (res._control === 'EXIT' && res.target === 'FOR') break;
                        // Bubble up other control signals (GOTO, END, EXIT SUB)
                        return res; 
                    }

                    this.env.assign(node.variable, currentVal + stepVal);
                }
                return null;

            case 'SELECT_CASE':
                const testVal = yield* this.evaluate(node.testExpr);
                let matched = false;
                
                for (const c of node.cases) {
                    let caseMatch = false;
                    for (const expr of c.exprs) {
                        // Handle RANGE evaluations (CASE X TO Y)
                        if (expr.type === 'CASE_RANGE') {
                            const lowVal = yield* this.evaluate(expr.low);
                            const highVal = yield* this.evaluate(expr.high);
                            // Inclusive boundary check
                            if (testVal >= lowVal && testVal <= highVal) {
                                caseMatch = true;
                                break;
                            }
                        } else {
                            // Handle standard VALUE evaluations (CASE X)
                            const val = yield* this.evaluate(expr);
                            if (testVal === val) {
                                caseMatch = true;
                                break;
                            }
                        }
                    }
                    // Execute block if a match was found in the current CASE line
                    if (caseMatch) {
                        const res = yield* this.evaluate(c.body);
                        if (res && res._control) return res;
                        matched = true;
                        break; 
                    }
                }
                
                // Fallback to CASE ELSE if no matches were found
                if (!matched && node.caseElse && node.caseElse.length > 0) {
                    const res = yield* this.evaluate(node.caseElse);
                    if (res && res._control) return res;
                }
                return null;

            case 'DO_PRE_COND':
                while (true) {
                    yield; 
                    const cond = yield* this.evaluate(node.condition);
                    
                    if (node.loopType === 'UNTIL' && cond !== 0 && cond !== false) break;
                    if (node.loopType === 'WHILE' && (cond === 0 || cond === false)) break;

                    const res = yield* this.evaluate(node.body);
                    if (res && res._control) {
                        if (res._control === 'EXIT' && res.target === 'DO') break;
                        return res;
                    }
                }
                return null;

            case 'DO_POST_COND':
                while (true) {
                    yield; 
                    const res = yield* this.evaluate(node.body);
                    if (res && res._control) {
                        if (res._control === 'EXIT' && res.target === 'DO') break;
                        return res;
                    }
                    
                    if (node.condition) {
                        const cond = yield* this.evaluate(node.condition);
                        if (node.loopType === 'UNTIL' && cond !== 0 && cond !== false) break;
                        if (node.loopType === 'WHILE' && (cond === 0 || cond === false)) break;
                    }
                }
                return null;

            case 'WHILE_WEND':
                while (true) {
                    yield; 
                    const cond = yield* this.evaluate(node.condition);
                    if (cond === 0 || cond === false) break;
                    const res = yield* this.evaluate(node.body);
                    if (res && res._control) return res;
                }
                return null;

            // --- I/O STATEMENTS ---
            case 'PRINT': {
                let output = "";
                const values = [];
                
                // 1. Evaluate all expressions in the PRINT statement and store their resolved values.
                if (node.values && node.values.length > 0) {
                    for (let expr of node.values) {
                        values.push(yield* this.evaluate(expr));
                    }
                }
                
                // 2. Handle the PRINT USING statement for specific string/number formatting (e.g., currency).
                if (node.usingFormat) {
                    const formatStr = yield* this.evaluate(node.usingFormat);
                    let valIndex = 0;
                    output = formatStr.replace(/[#,\.]+/g, (match) => {
                        if (valIndex >= values.length) return match;
                        let val = values[valIndex++];
                        let numStr = Math.round(val).toString(); 
                        if (match.includes(',')) numStr = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        
                        if (numStr.length > match.length) return "%" + numStr;
                        return numStr.padStart(match.length, ' ');
                    });
                } else {
                    // 3. Handle standard PRINT statements.
                    for (let val of values) {
                        // Surgical hardware interception for the TAB() function.
                        if (val && val._special === 'TAB') {
                            if (this.hw.vga) {
                                // Flush any pending text in the output buffer to the VRAM before moving the cursor.
                                if (output.length > 0) {
                                    this.hw.vga.print(Array.from(toCP437Array(output)));
                                    output = "";
                                }
                                
                                const targetX = Math.max(1, Math.round(val.col)) - 1;
                                
                                // If the cursor is already past the target column, QBasic wraps it to the next line.
                                if (this.hw.vga.cursorX > targetX) {
                                    this.hw.vga.print([13, 10]); // CR LF
                                }
                                
                                // Pad the screen with spaces until the cursor reaches the target column.
                                const spaces = targetX - this.hw.vga.cursorX;
                                if (spaces > 0) {
                                    this.hw.vga.print(Array.from(toCP437Array(" ".repeat(spaces))));
                                }
                            }
                        } else {
                            // Apply strict MS-DOS formatting rules for standard values.
                            if (typeof val === 'number') {
                                // Numbers always get a trailing space.
                                // Positive numbers and zero get a leading space (acting as an implicit '+' sign).
                                // Negative numbers keep their '-' sign instead of the leading space.
                                output += (val >= 0 ? " " + val.toString() + " " : val.toString() + " ");
                            } else {
                                // Strings are concatenated exactly as they are, without any automatic spacing.
                                output += (val !== null && val !== undefined) ? val.toString() : "";
                            }
                        }
                    }
                }
                
                if (this.hw.vga) {
                    // CPU Phase: Translate the final Unicode string into a CP437 byte array for the MS-DOS hardware.
                    const byteStream = Array.from(toCP437Array(output));
                    
                    // Hardware Phase: Inject Carriage Return (13) and Line Feed (10) if a newline is required.
                    // (i.e., the PRINT statement did not end with a semicolon or comma).
                    if (node.newline) {
                        byteStream.push(13, 10);
                    }
                    this.hw.vga.print(byteStream);
                }
                return null; 
            }

            case 'INPUT':
                if (node.prompt !== undefined && this.hw.vga) {
                    this.hw.vga.print(toCP437Array(node.prompt + "? "));
                }

                let inputBuffer = "";
                
                // Hardware Signal: Turn on the blinking cursor!
                if (this.hw.vga) this.hw.vga.showCursor();
                
                while (true) {
                    yield; 

                    if (!this.hw.io) break; 
                    const key = this.hw.io.inkey();
                    if (!key) continue; 

                    if (key === String.fromCharCode(13)) { // Enter
                        if (this.hw.vga) this.hw.vga.print([13, 10]); // CR LF
                        break; 
                    }
                    
                    if (key === String.fromCharCode(8)) { // Backspace
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            // Standard destructive backspace sequence for Terminals: BS, Space, BS
                            if (this.hw.vga) this.hw.vga.print([8, 32, 8]); 
                        }
                        continue;
                    }
                    
                    if (key.length === 1) {
                        inputBuffer += key;
                        // Echo the typed character natively
                        if (this.hw.vga) this.hw.vga.print(toCP437Array(key));
                    }
                }

                // Hardware Signal: Turn off the cursor
                if (this.hw.vga) this.hw.vga.hideCursor();

                const splitValues = inputBuffer.split(',');
                for (let i = 0; i < node.targets.length; i++) {
                    const target = node.targets[i];
                    let valStr = (splitValues[i] !== undefined) ? splitValues[i].trim() : "";
                    const targetRef = yield* this.evaluateLValue(target);
                    const varName = targetRef.name || targetRef.property || "";
                    let finalVal = varName.endsWith('$') ? valStr : (parseFloat(valStr) || 0);

                    if (targetRef.type === 'ENV') this.env.assign(targetRef.name, finalVal);
                    else if (targetRef.type === 'ARRAY') targetRef.array.set(targetRef.indices, finalVal);
                    else if (targetRef.type === 'OBJECT') targetRef.object[targetRef.property] = finalVal;
                }
                return null;

            case 'LINE_INPUT': {
                // LINE INPUT does not automatically append "? " like standard INPUT does.
                if (node.prompt && this.hw.vga) {
                    this.hw.vga.print(toCP437Array(node.prompt));
                }

                let lineBuffer = "";
                
                // Hardware Signal: Turn on the blinking cursor!
                if (this.hw.vga) this.hw.vga.showCursor();
                
                while (true) {
                    yield; // Non-blocking wait for user input

                    if (!this.hw.io) break; 
                    const key = this.hw.io.inkey();
                    if (!key) continue; 

                    if (key === String.fromCharCode(13)) { // Enter
                        if (this.hw.vga) this.hw.vga.print([13, 10]); // CR LF
                        break; 
                    }
                    
                    if (key === String.fromCharCode(8)) { // Backspace
                        if (lineBuffer.length > 0) {
                            lineBuffer = lineBuffer.slice(0, -1);
                            if (this.hw.vga) this.hw.vga.print([8, 32, 8]); 
                        }
                        continue;
                    }
                    
                    if (key.length === 1) {
                        lineBuffer += key;
                        if (this.hw.vga) this.hw.vga.print(toCP437Array(key));
                    }
                }

                // Hardware Signal: Turn off the cursor
                if (this.hw.vga) this.hw.vga.hideCursor();

                // LINE INPUT assigns the entire raw string to a single target
                const targetRef = yield* this.evaluateLValue(node.target);
                if (targetRef.type === 'ENV') this.env.assign(targetRef.name, lineBuffer);
                else if (targetRef.type === 'ARRAY') targetRef.array.set(targetRef.indices, lineBuffer);
                else if (targetRef.type === 'OBJECT') targetRef.object[targetRef.property] = lineBuffer;
                
                return null;
            }
            
            case 'CLS': if (this.hw.vga) this.hw.vga.cls(); return null;

            case 'LOCATE':
                // evaluate(null) elegantly returns null in our engine
                const row = yield* this.evaluate(node.row);
                const col = yield* this.evaluate(node.col);
                const cur = yield* this.evaluate(node.cursor);
                
                if (this.hw.vga) {
                    this.hw.vga.locate(row, col);
                    // Hardware Cursor Control
                    if (cur !== null) {
                        if (cur === 0) this.hw.vga.hideCursor();
                        else this.hw.vga.showCursor();
                    }
                }
                return null;

            case 'COLOR':
                const fg = node.fg !== null ? yield* this.evaluate(node.fg) : (this.hw.vga ? this.hw.vga.currentFg : 15);
                const bg = node.bg !== null ? yield* this.evaluate(node.bg) : (this.hw.vga ? this.hw.vga.currentBg : 0);
                if (this.hw.vga) this.hw.vga.color(fg, bg);
                return null;
            
            case 'DEF_SEG':
                const segAddr = node.address ? yield* this.evaluate(node.address) : null;
                if (this.hw.memory) this.hw.memory.defSeg(segAddr);
                return null;

            case 'RESTORE':
                if (node.label) {
                    const target = this.labels.get(node.label.toUpperCase());
                    if (!target) throw new Error("Label not found for RESTORE: " + node.label);
                    this.env.restoreData(target.dataIndex || 0);
                } else {
                    this.env.restoreData(0);
                }
                return null;

            case 'READ':
                for (let target of node.targets) {
                    const val = yield* this.evaluate(this.env.readData());
                    const targetRef = yield* this.evaluateLValue(target);
                    if (targetRef.type === 'ENV') this.env.assign(targetRef.name, val);
                    else if (targetRef.type === 'ARRAY') targetRef.array.set(targetRef.indices, val);
                    else if (targetRef.type === 'OBJECT') targetRef.object[targetRef.property] = val;
                }
                return null;

            case 'POKE':
                const pAddr = yield* this.evaluate(node.address);
                const pVal = yield* this.evaluate(node.value);
                if (this.hw.memory) this.hw.memory.poke(pAddr, pVal);
                return null;

            case 'OUT':
                const port = yield* this.evaluate(node.port);
                const val = yield* this.evaluate(node.value);
                if (this.hw.vga) {
                    this.hw.vga.out(port, val);
                }
                return null;

            case 'ASSIGN':
                const tRef = yield* this.evaluateLValue(node.target);
                let aVal = yield* this.evaluate(node.value);
                // Deep clone UDTs (User-Defined Types) to prevent JavaScript reference mutation!
                if (aVal !== null && typeof aVal === 'object' && !Array.isArray(aVal) && aVal.constructor.name === 'Object') {
                    aVal = JSON.parse(JSON.stringify(aVal));
                }
                if (tRef.type === 'ENV') this.env.assign(tRef.name, aVal);
                else if (tRef.type === 'ARRAY') tRef.array.set(tRef.indices, aVal);
                else if (tRef.type === 'OBJECT') tRef.object[tRef.property] = aVal;
                return null;

            case 'SWAP':
                const ref1 = yield* this.evaluateLValue(node.target1);
                const ref2 = yield* this.evaluateLValue(node.target2);
                
                let val1, val2;
                if (ref1.type === 'ENV') val1 = this.env.lookup(ref1.name);
                else if (ref1.type === 'ARRAY') val1 = ref1.array.get(ref1.indices);
                else if (ref1.type === 'OBJECT') val1 = ref1.object[ref1.property];
                
                if (ref2.type === 'ENV') val2 = this.env.lookup(ref2.name);
                else if (ref2.type === 'ARRAY') val2 = ref2.array.get(ref2.indices);
                else if (ref2.type === 'OBJECT') val2 = ref2.object[ref2.property];
                
                // Deep clone to guarantee pure memory value swapping
                if (val1 !== null && typeof val1 === 'object' && val1.constructor.name === 'Object') val1 = JSON.parse(JSON.stringify(val1));
                if (val2 !== null && typeof val2 === 'object' && val2.constructor.name === 'Object') val2 = JSON.parse(JSON.stringify(val2));
                
                if (ref1.type === 'ENV') this.env.assign(ref1.name, val2);
                else if (ref1.type === 'ARRAY') ref1.array.set(ref1.indices, val2);
                else if (ref1.type === 'OBJECT') ref1.object[ref1.property] = val2;

                if (ref2.type === 'ENV') this.env.assign(ref2.name, val1);
                else if (ref2.type === 'ARRAY') ref2.array.set(ref2.indices, val1);
                else if (ref2.type === 'OBJECT') ref2.object[ref2.property] = val1;
                return null;

            case 'ERASE':
                for (let target of node.targets) {
                    let currEnv = this.env;
                    let arr = null;
                    
                    // Traverse scope chain to find the array
                    while (currEnv) {
                        if (currEnv.variables.has(target)) {
                            arr = currEnv.variables.get(target);
                            break;
                        }
                        currEnv = currEnv.parent;
                    }
                    
                    if (arr && arr.constructor.name === 'QArray') {
                        // Soft reset array elements to simulate memory clear (Static Array behavior)
                        // This prevents JS reference crashes while satisfying MS-DOS logic.
                        for (let i = 0; i < arr.data.length; i++) {
                            const val = arr.data[i];
                            if (typeof val === 'string') {
                                arr.data[i] = "";
                            } else if (typeof val === 'object' && val !== null) {
                                // Shallow reset of UDT properties
                                for (let key in val) {
                                    val[key] = (typeof val[key] === 'string') ? "" : 0;
                                }
                            } else {
                                arr.data[i] = 0;
                            }
                        }
                    }
                }
                return null;

            case 'CALL': return yield* this.evaluateCall(node);

            case 'END': return { _control: 'END' };

            // --- GRAPHICS STATEMENTS ---
            case 'SCREEN_STMT':
                const mode = yield* this.evaluate(node.mode);
                if (this.hw.vga) this.hw.vga.setMode(mode);
                return null;

            case 'PALETTE':
                // QBasic allows PALETTE without args to reset colors.
                // If args are present, we map the specific attribute.
                if (node.attribute !== null && node.color !== null) {
                    const attr = yield* this.evaluate(node.attribute);
                    const color = yield* this.evaluate(node.color);
                    if (this.hw.vga && typeof this.hw.vga.setPalette === 'function') {
                        this.hw.vga.setPalette(attr, color);
                    }
                } else {
                    // TODO: Handle parameterless PALETTE (hardware reset)
                }
                return null;

            case 'WINDOW':
                const wX1 = yield* this.evaluate(node.x1);
                const wY1 = yield* this.evaluate(node.y1);
                const wX2 = yield* this.evaluate(node.x2);
                const wY2 = yield* this.evaluate(node.y2);
                if (this.hw.vga) this.hw.vga.setWindow(node.invertY, wX1, wY1, wX2, wY2);
                return null;

            case 'PSET':
                const pX = yield* this.evaluate(node.x);
                const pY = yield* this.evaluate(node.y);
                const pCol = node.color !== null ? yield* this.evaluate(node.color) : null;
                if (this.hw.vga) this.hw.vga.pset(pX, pY, pCol, node.isStep);
                return null;

            case 'LINE':
                const lX1 = yield* this.evaluate(node.startX);
                const lY1 = yield* this.evaluate(node.startY);
                const lX2 = yield* this.evaluate(node.endX);
                const lY2 = yield* this.evaluate(node.endY);
                const lCol = node.color !== null ? yield* this.evaluate(node.color) : null;
                if (this.hw.vga) this.hw.vga.line(lX1, lY1, lX2, lY2, lCol, node.box, node.startIsStep, node.endIsStep);
                return null;

            case 'CIRCLE':
                const cX = yield* this.evaluate(node.x);
                const cY = yield* this.evaluate(node.y);
                const cR = yield* this.evaluate(node.radius);
                const cCol = node.color !== null ? yield* this.evaluate(node.color) : null;
                const cSt = node.start !== null ? yield* this.evaluate(node.start) : null;
                const cEnd = node.end !== null ? yield* this.evaluate(node.end) : null;
                const cAsp = node.aspect !== null ? yield* this.evaluate(node.aspect) : null;
                if (this.hw.vga) this.hw.vga.circle(cX, cY, cR, cCol, cSt, cEnd, cAsp, node.isStep);
                return null;

            case 'PAINT':
                const ptX = yield* this.evaluate(node.x);
                const ptY = yield* this.evaluate(node.y);
                const ptC = node.paintColor !== null ? yield* this.evaluate(node.paintColor) : null;
                const pbC = node.borderColor !== null ? yield* this.evaluate(node.borderColor) : null;
                if (this.hw.vga) this.hw.vga.paint(ptX, ptY, ptC, pbC, node.isStep);
                return null;

            case 'GET_GRAPHICS': {
                const gx1 = yield* this.evaluate(node.startX);
                const gy1 = yield* this.evaluate(node.startY);
                const gx2 = yield* this.evaluate(node.endX);
                const gy2 = yield* this.evaluate(node.endY);
                
                let getArr = null;
                let getIdx = 0;
                
                // Safely extract the target array reference without overwriting it
                if (node.target.type === 'IDENTIFIER') {
                    getArr = this.env.lookup(node.target.value);
                } else if (node.target.type === 'CALL') {
                    const ref = yield* this.evaluateLValue(node.target);
                    getArr = ref.array;
                    getIdx = ref.indices[0] !== undefined ? ref.indices[0] : 0;
                }
                
                if (this.hw.vga) {
                    this.hw.vga.getGraphics(gx1, gy1, gx2, gy2, getArr, getIdx, node.startIsStep, node.endIsStep);
                }
                return null;
            }

            case 'PUT_GRAPHICS': {
                const px = yield* this.evaluate(node.x);
                const py = yield* this.evaluate(node.y);
                
                let putArr = null;
                let putIdx = 0;
                
                if (node.target.type === 'IDENTIFIER') {
                    putArr = this.env.lookup(node.target.value);
                } else if (node.target.type === 'CALL') {
                    const ref = yield* this.evaluateLValue(node.target);
                    putArr = ref.array;
                    putIdx = ref.indices[0] !== undefined ? ref.indices[0] : 0;
                }

                if (this.hw.vga) {
                    this.hw.vga.putGraphics(px, py, putArr, putIdx, node.action, node.isStep);
                }
                return null;
            }

            // --- System & Hardware Delays ---

            case 'SOUND': {
                const freq = yield* this.evaluate(node.freq);
                const durationTicks = yield* this.evaluate(node.duration);
                
                // DOS Clock ticks run at ~18.2 Hz.
                // Convert ticks to milliseconds for the WebVM Orchestrator.
                const ms = (durationTicks / 18.2) * 1000;
                
                // TODO: Wire 'freq' to the AudioContext when the sound engine is ready.
                // For now, we MUST yield the delay to allow visual sorting animations.
                if (ms > 0) {
                    yield { type: 'SYS_DELAY', ms: ms };
                }
                return null;
            }

            case 'SLEEP': {
                let ms = 0;
                
                if (node.duration) {
                    // SLEEP n: Pause execution for n seconds
                    // Evaluate the argument dynamically (e.g., SLEEP delay / 2)
                    const seconds = yield* this.evaluate(node.duration);
                    ms = seconds * 1000;
                } else {
                    // SLEEP without arguments: Wait indefinitely for a keystroke.
                    // We send -1 as a special signal to the orchestrator (webvm.js)
                    // to attach a keyboard event listener instead of a setTimeout.
                    ms = -1;
                }

                // Yield control back to the orchestrator with the delay token.
                // The CPU loop will freeze until the orchestrator resumes it.
                yield { type: 'SYS_DELAY', ms: ms };
                return null;
            }

            // --- DOS / HARDWARE STUBS ---
            case 'DATA': case 'DECLARE': case 'DEFINT':
            case 'RANDOMIZE': case 'WIDTH':
                // Gracefully ignore these specific DOS hardware commands
                return null;
            case 'ON_ERROR':
            case 'RESUME':
                // Legacy hardware error handling is stubbed. 
                // We ignore the error registration and the return jump.
                return null;

            case 'BEEP':
            case 'VIEW':
            case 'VIEW_PRINT':
            case 'PLAY':
                // VIEW, PLAY, and BEEP are natively ignored to avoid crashing
                return null;

            default: throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    /**
     * Resolves an L-Value (Assignation target).
     */
    *evaluateLValue(node) {
        if (node.type === 'IDENTIFIER') return { type: 'ENV', name: node.value };
        else if (node.type === 'CALL') {
            const callee = node.callee.value.toUpperCase();
            let val = this.env.variables.get(callee);
            let currEnv = this.env.parent;
            while (!val && currEnv) { val = currEnv.variables.get(callee); currEnv = currEnv.parent; }
            if (!val || val.constructor.name !== 'QArray') throw new Error(`${callee} is not an array.`);
            const indices = [];
            for (let arg of node.args) indices.push(yield* this.evaluate(arg));
            return { type: 'ARRAY', array: val, indices: indices };
        } 
        else if (node.type === 'MEMBER_ACCESS') {
            const parentObject = yield* this.evaluate(node.object);
            return { type: 'OBJECT', object: parentObject, property: node.property.toUpperCase() };
        }
        throw new Error(`Invalid assignment target: ${node.type}`);
    }

    /**
     * Handles function and subroutine calls, including "Copy-In/Copy-Out" for 
     * pass-by-reference emulation.
     */
    *evaluateCall(node) {
        const callee = node.callee.value.toUpperCase();
        const subDef = this.env.getSub(callee);
        
        if (subDef) {
            // Pass the persistent vault to the new environment
            const childEnv = new Environment(this.env.sharedEnv, subDef.persistentVars);
            
            // MAGIC: If the whole routine was declared "SUB Foo STATIC", 
            // all local variables ARE persistent variables natively!
            if (subDef.isStatic) {
                childEnv.variables = subDef.persistentVars;
            }

            const argRefs = [];
            const argValues = [];
            
            for (let arg of node.args) {
                argValues.push(yield* this.evaluate(arg));
                // Pass-by-reference capture
                if (arg.type === 'IDENTIFIER' || arg.type === 'MEMBER_ACCESS' || (arg.type === 'CALL' && arg.args.length > 0)) {
                    argRefs.push(yield* this.evaluateLValue(arg));
                } else {
                    argRefs.push(null);
                }
            }
            
            for (let i = 0; i < subDef.params.length; i++) {
                const pName = subDef.params[i].name || subDef.params[i]; 
                childEnv.define(pName, argValues[i] !== undefined ? argValues[i] : 0);
            }
            
            const subEvaluator = new Evaluator(childEnv, this.hw);

            // --- Immediate return for single-line macros ---
            if (subDef.type === 'DEF_FN') {
                // The body of a DEF_FN is just an expression.
                // Evaluating it directly yields the final mathematical result.
                return yield* subEvaluator.evaluate(subDef.body);
            }
            // -----------------------------------------------------------

            const res = yield* subEvaluator.evaluate(subDef.body);
            if (res && res._control === 'END') return res; // Propagate total crash
            
            // 'EXIT SUB' and 'EXIT FUNCTION' signals are implicitly caught here.
            // The subroutine aborts early and proceeds to the COPY-OUT phase.
            
            let returnValue = (subDef.type === 'FUNCTION_DEF') ? childEnv.lookup(callee) : null;

            // COPY-OUT: Update original variables if they were passed as refs
            for (let i = 0; i < subDef.params.length; i++) {
                if (argRefs[i]) {
                    const pName = subDef.params[i].name || subDef.params[i];
                    const finalVal = childEnv.lookup(pName);
                    const ref = argRefs[i];
                    if (ref.type === 'ENV') this.env.assign(ref.name, finalVal);
                    else if (ref.type === 'ARRAY') ref.array.set(ref.indices, finalVal);
                    else if (ref.type === 'OBJECT') ref.object[ref.property] = finalVal;
                }
            }
            return returnValue; 
        }

        // --- FACTORIZED ARGUMENT EVALUATION ---
        const args = [];
        if (node.args) {
            for (let arg of node.args) args.push(yield* this.evaluate(arg));
        }

        // --- 2. NATIVE BUILT-INS (STDLIB) ---
        if (BuiltIns[callee]) {
            return BuiltIns[callee](args);
        }

        // --- 3. HARDWARE-DEPENDENT BUILT-INS ---
        if (callee === 'PEEK') {
            return this.hw.memory ? this.hw.memory.peek(args[0]) : 0;
        }
        if (callee === 'POINT') {
            // QBasic POINT(x, y) needs to read directly from the VRAM
            if (this.hw.vga && typeof this.hw.vga.point === 'function') {
                return this.hw.vga.point(args[0], args[1]);
            }
            return 0; // Fallback to background color (0) if no VGA hardware is attached
        }
        if (callee === 'TAB') {
            // Return a special token for the PRINT statement hardware interceptor
            return { _special: 'TAB', col: args[0] || 1 };
        }
        if (callee === 'INPUT$') {
            const charCount = Math.max(1, args[0] || 1);
            let resultStr = "";
            
            // Loop and yield control to the browser until we collect exactly n characters
            while (resultStr.length < charCount) {
                yield; 
                if (!this.hw.io) break; 
                
                const key = this.hw.io.inkey();
                if (key) {
                    // INPUT$ intercepts keystrokes silently (no hardware echo to VGA)
                    resultStr += key;
                }
            }
            return resultStr;
        }

        // --- 4. RESOLVE ARRAYS IN ENVIRONMENT ---
        let val = this.env.variables.get(callee);
        let currEnv = this.env.parent;
        while (!val && currEnv) { val = currEnv.variables.get(callee); currEnv = currEnv.parent; }
        
        if (val && val.constructor.name === 'QArray') {
            if (args.length === 0) return val;
            return val.get(args); // Uses the factorized 'args' directly!
        }

        throw new Error(`Routine, Function, or Array not found: ${callee}`);
    }

    *evaluateBinaryOp(node) {
        const left = yield* this.evaluate(node.left);
        const right = yield* this.evaluate(node.right);
        switch (node.operator) {
            case '^': return left ** right;
            case '+': return left + right; case '-': return left - right;
            case '*': return left * right; case '/': return left / right;
            case '\\': return Math.trunc(Math.round(left) / Math.round(right)); // Pure QBasic Integer Division
            case 'MOD': return left % right;
            case '=': return left === right ? -1 : 0; case '<>': return left !== right ? -1 : 0;
            case '>': return left > right ? -1 : 0; case '<': return left < right ? -1 : 0;
            case '>=': return left >= right ? -1 : 0; case '<=': return left <= right ? -1 : 0;
            case 'AND': return (left && right) ? -1 : 0; case 'OR': return (left || right) ? -1 : 0;
            default: throw new Error(`Unknown operator: ${node.operator}`);
        }
    }

    *evaluateUnaryOp(node) {
        const arg = yield* this.evaluate(node.argument);
        switch (node.operator) {
            case '-': return -arg; 
            case 'NOT': return (arg === 0 || arg === false || arg === null || arg === undefined) ? -1 : 0;
            default: throw new Error(`Unknown unary operator: ${node.operator}`);
        }
    }
}