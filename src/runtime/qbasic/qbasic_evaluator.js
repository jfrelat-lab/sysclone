// src/runtime/evaluator.js
import { QBasicEnvironment as Environment } from './qbasic_environment.js';
import { QArray } from './qarray.js';
import { QFixedString } from './qfixedstring.js';
import { BuiltIns, bankersRound } from './builtins.js';
import { BuiltInTokens } from '../../parser/qbasic/tokens.js';
import { QBasicISA as ISA } from './instructions/index.js';

/**
 * The core execution engine of Sysclone.
 * Acts as a virtual CPU that traverses the AST and interacts with the Hardware Abstraction Layer.
 * Uses Generator functions (*evaluate) to allow non-blocking execution in the browser.
 */
export class QBasicEvaluator {
    constructor(env = null, hardware = { vga: null, io: null, memory: null }) {
        // Setup the 3-Tier Architecture natively if no custom env is provided
        if (!env) {
            const rootEnv = new Environment();     // Tier 1: Global/Shared
            this.env = new Environment(rootEnv);   // Tier 2: Main Module
        } else {
            this.env = env;
        }
        this.hw = hardware;
        this.isa = new ISA(this.hw); // Inject the ISA Facade

        this.labels = new Map();
        this.hasScannedLabels = false;
        this.topLevelBlock = undefined;
    }

    /**
     * Purist Deep Clone for the Virtual Machine.
     * Safely copies UDTs while preserving VM memory classes like QFixedString.
     */
    cloneValue(val) {
        if (val === null || typeof val !== 'object') return val;
        
        // Duck Typing: If the object implements a custom clone method, trust it!
        if (typeof val.clone === 'function') return val.clone();
        
        if (Array.isArray(val)) return val.map(v => this.cloneValue(v));
        
        // Clone plain UDT objects
        if (val.constructor.name === 'Object') {
            const copy = {};
            for (let key in val) {
                copy[key] = this.cloneValue(val[key]);
            }
            return copy;
        }
        
        return val;
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
                    } else if (node[i].type === 'TYPE_DECL') {
                        if (!insideSub) this.env.defineType(node[i].name, node[i].fields);
                    } else if (node[i].type === 'DATA') {
                        if (!this.env.staticScope) {
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

        // --- 2. DYNAMIC DISPATCH ENGINE ---
        const methodName = 'visit' + node.type;
        if (typeof this[methodName] === 'function') {
            return yield* this[methodName](node);
        }
        
        throw new Error(`Unknown node type or missing visitor method: ${node.type}`);
    }

    // ========================================================================
    // VISITOR METHODS (Flattened switch cases)
    // ========================================================================

    *visitLABEL(node) { return null; }
    *visitGOTO(node) { return { _control: 'GOTO', label: node.label.toUpperCase() }; }
    *visitRETURN(node) { return { _control: 'RETURN' }; }
    *visitEXIT(node) { return { _control: 'EXIT', target: node.target }; }
    *visitEND(node) { return { _control: 'END' }; }

    *visitGOSUB(node) {
        // 1. LABEL RESOLUTION: Find the exact AST block array and index of the target label.
        // The label MUST exist in the current execution scope.
        const target = this.labels.get(node.label.toUpperCase());
        if (!target) throw new Error("Label not found for GOSUB: " + node.label);

        // 2. MINI CALL-STACK: Initialize a local execution pointer.
        // A GOSUB operates within the exact same variable scope as its caller, 
        // it only shifts the instruction pointer to a new physical location.
        let subBlock = target.block;
        let subIndex = target.index;

        // 3. ISOLATED EXECUTION LOOP: Run sequentially from the label onwards.
        while (subIndex < subBlock.length) {
            yield; // Virtual CPU Tick: Prevents the main thread from freezing.

            const res = yield* this.evaluate(subBlock[subIndex]);
            
            // 4. THE RETURN SIGNAL: The natural and required exit point of a GOSUB.
            // It shatters this isolated loop and returns control to the statement immediately following the GOSUB.
            if (res && res._control === 'RETURN') {
                break; 
            }
            
            // 5. INTERNAL GOTO HANDLING: Subroutines often contain their own jumps!
            // Instead of bubbling this GOTO up to the main Evaluator loop (which would hijack 
            // the main program flow), we catch it locally and redirect our internal pointer.
            if (res && res._control === 'GOTO') {
                const gt = this.labels.get(res.label);
                if (!gt) throw new Error("Label not found for internal GOTO: " + res.label);
                
                subBlock = gt.block;
                subIndex = gt.index;
                continue;
            }
            
            // Note: If an 'EXIT FOR' or 'EXIT DO' occurs inside the GOSUB, and the loop itself
            // is not contained within the GOSUB, the signal will bubble right through this 
            // loop because we only catch RETURN and GOTO! (This matches MS-DOS behavior).

            // 6. Proceed to the next statement in the block.
            subIndex++;
        }
        
        // 7. GOSUB completed. Control naturally resumes in the parent block.
        return null;
    }

    *visitNUMBER(node) { return node.value; }
    *visitSTRING(node) { return node.value; }
    
    *visitIDENTIFIER(node) {
        const varName = node.value.toUpperCase();
        if (varName === BuiltInTokens.INKEY$) return this.isa.io.readINKEY();
        if (varName === BuiltInTokens.TIMER)  return this.isa.io.readTIMER();
        if (BuiltIns[varName]) return BuiltIns[varName]();

        const routine = this.env.getSub(varName);
        if (routine && routine.type === 'FUNCTION_DEF') {
            return yield* this.evaluateCall({ type: 'CALL', callee: node, args: [] });
        }
        return this.env.lookup(node.value);
    }

    *visitBINARY_OP(node) { return yield* this.evaluateBinaryOp(node); }
    *visitUNARY_OP(node) { return yield* this.evaluateUnaryOp(node); }
    
    *visitMEMBER_ACCESS(node) {
        const obj = yield* this.evaluate(node.object);
        return obj[node.property.toUpperCase()];
    }

    *visitCONST(node) {
        for (let decl of node.declarations) {
            const constVal = yield* this.evaluate(decl.value);
            this.env.define(decl.name, constVal);
        }
        return null;
    }

    *visitSUB_DEF(node) { return null; }
    *visitFUNCTION_DEF(node) { return null; }
    *visitDEF_FN(node) { return null; }

    *visitTYPE_DECL(node) {
        this.env.defineType(node.name, node.fields);
        return null;
    }

    *visitREDIM(node) { return yield* this.visitDIM(node); }
    
    *visitDIM(node) {
        for (let decl of node.declarations) {
            const typeName = decl.varType || decl.type || 'SINGLE'; 
            const creator = () => this.env.createDefaultValue(typeName, decl.length);
            
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

            if (node.shared) {
                this.env.sharedEnv.variables.registerAlias(decl.name, typeName);
                this.env.sharedEnv.define(decl.name, initValue);
            } else {
                this.env.variables.registerAlias(decl.name, typeName);
                this.env.define(decl.name, initValue);
            }
        }
        return null;
    }

    *visitSTATIC(node) {
        for (let decl of node.declarations) {
            if (this.env.staticScope) {
                const typeName = decl.varType || decl.type || 'SINGLE'; 
                this.env.staticScope.registerAlias(decl.name, typeName);

                if (!this.env.staticScope.has(decl.name)) {
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
                    this.env.staticScope.set(decl.name, initValue);
                }
            }
        }
        return null;
    }

    *visitSHARED_IMPORT(node) {
        for (let decl of node.declarations) {
            const typeName = decl.varType || decl.type || 'SINGLE'; 
            this.env.sharedEnv.variables.registerAlias(decl.name, typeName);
            
            if (!this.env.sharedEnv.variables.has(decl.name)) {
                const creator = () => this.env.createDefaultValue(typeName, decl.length);
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
                this.env.sharedEnv.define(decl.name, initValue);
            }
        }
        return null;
    }

    *visitIF(node) {
        // 1. Evaluate the main condition. 
        // TRUTHINESS QUIRK: In MS-DOS BASIC, 0 is strictly False. Any non-zero number is True (typically -1).
        const condition = yield* this.evaluate(node.condition);
        if (condition !== 0 && condition !== false) {
            const res = yield* this.evaluate(node.thenBlock);
            // CONTROL FLOW BUBBLING: If the block triggers a jump (GOTO, EXIT, RETURN), propagate it upwards immediately.
            if (res && res._control) return res; 
            return null; // Short-circuit: The IF was satisfied, skip all subsequent ELSE blocks.
        } 
        
        // 2. Fallback to ELSEIF blocks sequentially
        if (node.elseIfBlocks && node.elseIfBlocks.length > 0) {
            for (let elseIf of node.elseIfBlocks) {
                const elseIfCond = yield* this.evaluate(elseIf.condition);
                if (elseIfCond !== 0 && elseIfCond !== false) {
                    const res = yield* this.evaluate(elseIf.block);
                    if (res && res._control) return res;
                    return null; // Short-circuit upon first match
                }
            }
        }

        // 3. Fallback to the final ELSE block if no conditions were met
        if (node.elseBlock && node.elseBlock.length > 0) {
            const res = yield* this.evaluate(node.elseBlock);
            if (res && res._control) return res;
        }
        return null;
    }

    *visitFOR(node) {
        // 1. BOUND IMMUTABILITY: Evaluate TO and STEP exactly ONCE before starting the loop.
        // Modifying the limit variables inside the loop in QBasic does not affect the bounds.
        const endVal = yield* this.evaluate(node.end);
        const stepVal = node.step ? yield* this.evaluate(node.step) : 1;
        
        // 2. Initialize the iterator directly into MS-DOS memory.
        const startVal = yield* this.evaluate(node.start);
        this.env.assign(node.variable, startVal);

        while (true) {
            // --- Virtual CPU Tick ---
            // Breathes life into the browser event loop, preventing UI freezes.
            yield;

            // 3. Read CURRENT value from memory.
            // This is crucial because QBasic allows the loop body to explicitly mutate the iterator!
            let currentVal = this.env.lookup(node.variable);

            // 4. Bounds Check.
            if (stepVal >= 0 ? currentVal > endVal : currentVal < endVal) {
                break; // Exit loop naturally, leaving the "Overshoot" value safely in memory.
            }

            // 5. Execute Body and capture the control flow result.
            const res = yield* this.evaluate(node.body);

            // 6. CONTROL FLOW INTERCEPTION (The crucial fix for EXIT FOR, GOTO, and RETURN)
            if (res && res._control) {
                // If the signal is specifically an 'EXIT FOR', we break the loop cleanly.
                // The iterator retains its exact current value without applying the step.
                if (res._control === 'EXIT' && res.target === 'FOR') {
                    break;
                }
                
                // Bubbling: If it's a GOTO, a RETURN, or an EXIT meant for an outer DO/SUB,
                // we propagate the signal up the call stack immediately.
                return res; 
            }

            // 7. The NEXT statement: 
            // Re-read memory (in case the body mutated it!), apply the STEP increment, and write back.
            currentVal = this.env.lookup(node.variable);
            this.env.assign(node.variable, currentVal + stepVal);
        }
        return null;
    }

    *visitSELECT_CASE(node) {
        // 1. Evaluate the base test expression EXACTLY ONCE
        const testVal = yield* this.evaluate(node.testExpr);
        let matched = false;
        
        for (const c of node.cases) {
            let caseMatch = false;
            
            // 2. Evaluate all comma-separated expressions
            for (const expr of c.exprs) {
                if (expr.type === 'CASE_RANGE') {
                    // Handle "CASE low TO high"
                    const lowVal = yield* this.evaluate(expr.low);
                    const highVal = yield* this.evaluate(expr.high);
                    if (testVal >= lowVal && testVal <= highVal) {
                        caseMatch = true; break;
                    }
                } else if (expr.type === 'CASE_IS') {
                    // Handle "CASE IS > val" dynamically
                    const val = yield* this.evaluate(expr.value);
                    switch (expr.operator) {
                        case '=':  if (testVal === val) caseMatch = true; break;
                        case '<>': if (testVal !== val) caseMatch = true; break;
                        case '>':  if (testVal > val) caseMatch = true; break;
                        case '<':  if (testVal < val) caseMatch = true; break;
                        case '>=': if (testVal >= val) caseMatch = true; break;
                        case '<=': if (testVal <= val) caseMatch = true; break;
                    }
                    if (caseMatch) break;
                } else {
                    // Handle exact match
                    const val = yield* this.evaluate(expr);
                    if (testVal === val) {
                        caseMatch = true; break;
                    }
                }
            }
            
            // 3. Match execution & Bubbling
            if (caseMatch) {
                const res = yield* this.evaluate(c.body);
                if (res && res._control) return res;
                matched = true;
                break; 
            }
        }
        
        // 4. Fallback to CASE ELSE
        if (!matched && node.caseElse && node.caseElse.length > 0) {
            const res = yield* this.evaluate(node.caseElse);
            if (res && res._control) return res;
        }
        return null;
    }

    *visitDO_PRE_COND(node) {
        // DO WHILE / DO UNTIL (Condition evaluated BEFORE entering the block)
        while (true) {
            yield; // Virtual CPU Tick: Prevents infinite loop freezing

            const cond = yield* this.evaluate(node.condition);
            
            // BREAK CONDITIONS based on loop type
            if (node.loopType === 'UNTIL' && cond !== 0 && cond !== false) break; // Break if True
            if (node.loopType === 'WHILE' && (cond === 0 || cond === false)) break; // Break if False

            const res = yield* this.evaluate(node.body);

            // CONTROL FLOW INTERCEPTION
            if (res && res._control) {
                // If it's specifically an 'EXIT DO', shatter this specific loop cleanly
                if (res._control === 'EXIT' && res.target === 'DO') break;
                // Otherwise (GOTO, RETURN, EXIT SUB), bubble it up the call stack
                return res;
            }
        }
        return null;
    }

    *visitDO_POST_COND(node) {
        // DO ... LOOP WHILE / UNTIL (Condition evaluated AFTER executing the block at least once)
        while (true) {
            yield; // Virtual CPU Tick

            // 1. Guaranteed execution of the body
            const res = yield* this.evaluate(node.body);

            // 2. Control flow interception
            if (res && res._control) {
                if (res._control === 'EXIT' && res.target === 'DO') break;
                return res;
            }
            
            // 3. Post-execution condition check
            if (node.condition) {
                const cond = yield* this.evaluate(node.condition);
                if (node.loopType === 'UNTIL' && cond !== 0 && cond !== false) break;
                if (node.loopType === 'WHILE' && (cond === 0 || cond === false)) break;
            }
        }
        return null;
    }

    *visitWHILE_WEND(node) {
        // Legacy WHILE...WEND loop. 
        // Note: Standard QBasic does NOT support an "EXIT WHILE" statement. 
        // The only way to escape early is via a GOTO or RETURN.
        while (true) {
            yield; // Virtual CPU Tick

            const cond = yield* this.evaluate(node.condition);
            if (cond === 0 || cond === false) break;

            const res = yield* this.evaluate(node.body);

            // BUBBLING: Propagate GOTO, RETURN, or END commands
            if (res && res._control) return res;
        }
        return null;
    }

    *visitPRINT(node) {
        const values = [];
        if (node.values && node.values.length > 0) {
            for (let expr of node.values) values.push(yield* this.evaluate(expr));
        }
        const usingFormat = node.usingFormat ? yield* this.evaluate(node.usingFormat) : null;
        this.isa.io.executePRINT(values, usingFormat, node.newline);
        return null; 
    }

    *visitINPUT(node) {
        let finalPrompt = undefined;
        if (node.prompt !== undefined) finalPrompt = node.prompt + "? ";
        
        this.isa.io.openInputBuffer(finalPrompt);
        let inputResult;
        while (true) {
            yield; 
            inputResult = this.isa.io.pumpInputBuffer();
            if (inputResult.done) break;
        }
        const rawString = this.isa.io.closeInputBuffer();
        const splitValues = rawString.split(',');
        for (let i = 0; i < node.targets.length; i++) {
            const target = node.targets[i];
            let valStr = (splitValues[i] !== undefined) ? splitValues[i].trim() : "";
            const targetRef = yield* this.evaluateLValue(target);
            const varName = targetRef.name || targetRef.property || "";
            let finalVal = varName.endsWith('$') ? valStr : (parseFloat(valStr) || 0);
            this.writeMemoryRef(targetRef, finalVal);
        }
        return null;
    }

    *visitLINE_INPUT(node) {
        this.isa.io.openInputBuffer(node.prompt);
        let inputResult;
        while (true) {
            yield; 
            inputResult = this.isa.io.pumpInputBuffer();
            if (inputResult.done) break;
        }
        const rawString = this.isa.io.closeInputBuffer();
        const targetRef = yield* this.evaluateLValue(node.target);
        this.writeMemoryRef(targetRef, rawString);
        return null;
    }

    *visitCLS(node) { this.isa.graphics.executeCLS(); return null; }

    *visitLOCATE(node) {
        const row = yield* this.evaluate(node.row);
        const col = yield* this.evaluate(node.col);
        const cur = yield* this.evaluate(node.cursor);
        yield* this.evaluate(node.start);
        yield* this.evaluate(node.stop);
        this.isa.io.executeLOCATE(row, col, cur);
        return null;
    }

    *visitCOLOR(node) {
        const fg = node.fg !== null ? yield* this.evaluate(node.fg) : null;
        const bg = node.bg !== null ? yield* this.evaluate(node.bg) : null;
        this.isa.graphics.executeCOLOR(fg, bg);
        return null;
    }

    *visitDEF_SEG(node) {
        const segAddr = node.address ? yield* this.evaluate(node.address) : null;
        this.isa.memory.executeDEF_SEG(segAddr);
        return null;
    }

    *visitRESTORE(node) {
        if (node.label) {
            const target = this.labels.get(node.label.toUpperCase());
            if (!target) throw new Error("Label not found for RESTORE: " + node.label);
            this.env.restoreData(target.dataIndex || 0);
        } else {
            this.env.restoreData(0);
        }
        return null;
    }

    *visitREAD(node) {
        for (let target of node.targets) {
            const val = yield* this.evaluate(this.env.readData());
            const targetRef = yield* this.evaluateLValue(target);
            this.writeMemoryRef(targetRef, val);
        }
        return null;
    }

    *visitPOKE(node) {
        const pAddr = yield* this.evaluate(node.address);
        const pVal = yield* this.evaluate(node.value);
        this.isa.memory.executePOKE(pAddr, pVal);
        return null;
    }

    *visitOUT(node) {
        const port = yield* this.evaluate(node.port);
        const val = yield* this.evaluate(node.value);
        this.isa.io.executeOUT(port, val);
        return null;
    }

    *visitASSIGN(node) {
        const tRef = yield* this.evaluateLValue(node.target);
        const aVal = this.cloneValue(yield* this.evaluate(node.value));
        this.writeMemoryRef(tRef, aVal);
        return null;
    }

    *visitSWAP(node) {
        const t1Ref = yield* this.evaluateLValue(node.target1);
        const t2Ref = yield* this.evaluateLValue(node.target2);
        
        // 1. Read
        const val1 = this.readMemoryRef(t1Ref);
        const val2 = this.readMemoryRef(t2Ref);
        
        // 2. Clone to prevent reference leakage
        const newT1 = this.cloneValue(val2);
        const newT2 = this.cloneValue(val1);
        
        // 3. Write
        this.writeMemoryRef(t1Ref, newT1);
        this.writeMemoryRef(t2Ref, newT2);        
        return null;
    }

    *visitERASE(node) {
        // MS-DOS ERASE Statement: 
        // For static arrays, it resets all elements to their default values (0 for numbers, "" for strings).

        for (let target of node.targets) {
            const upperTarget = target.toUpperCase();
            
            // 1. ARRAY SCOPE RESOLUTION
            // Leverage the central Environment lookup to traverse the 3-Tier architecture natively.
            // If the variable doesn't exist, it implicitly resolves to 0 (Scalar), which safely fails the QArray check.
            const arr = this.env.lookup(upperTarget);
            
            // Ensure we are strictly manipulating an instantiated QArray
            if (arr && arr.constructor.name === 'QArray') {
                
                // 2. MEMORY WIPING
                // Iterate through the flattened 1D data buffer to clear elements in place.
                for (let i = 0; i < arr.data.length; i++) {
                    const val = arr.data[i];
                    
                    if (typeof val === 'string') {
                        // Standard variable-length strings
                        arr.data[i] = "";
                        
                    } else if (val && val.isFixedString) {
                        // VM MEMORY PROTECTION: Fixed-Length Strings
                        // We MUST use in-place mutation (.update) to prevent garbage collecting 
                        // the QFixedString object and breaking the predefined memory size.
                        val.update("");
                        
                    } else if (typeof val === 'object' && val !== null) {
                        // User-Defined Types (UDT)
                        // Shallow iteration through the structure's properties to reset them.
                        for (let key in val) {
                            if (val[key] && val[key].isFixedString) {
                                val[key].update(""); // Protect nested Fixed Strings!
                            } else {
                                val[key] = (typeof val[key] === 'string') ? "" : 0;
                            }
                        }
                        
                    } else {
                        // Standard primitive numerics (INTEGER, SINGLE, DOUBLE, etc.)
                        arr.data[i] = 0;
                    }
                }
            }
        }
        return null;
    }

    *visitCALL(node) { return yield* this.evaluateCall(node); }

    *visitSCREEN_STMT(node) {
        const mode = yield* this.evaluate(node.mode);
        this.isa.graphics.executeSCREEN(mode);
        return null;
    }

    *visitPALETTE(node) {
        if (node.attribute !== null && node.color !== null) {
            const attr = yield* this.evaluate(node.attribute);
            const color = yield* this.evaluate(node.color);
            this.isa.graphics.executePALETTE(attr, color);
        }
        return null;
    }

    *visitWINDOW(node) {
        const wX1 = yield* this.evaluate(node.x1);
        const wY1 = yield* this.evaluate(node.y1);
        const wX2 = yield* this.evaluate(node.x2);
        const wY2 = yield* this.evaluate(node.y2);
        this.isa.graphics.executeWINDOW(node.invertY, wX1, wY1, wX2, wY2);
        return null;
    }

    *visitPSET(node) {
        const pX = yield* this.evaluate(node.x);
        const pY = yield* this.evaluate(node.y);
        const pCol = node.color !== null ? yield* this.evaluate(node.color) : null;
        this.isa.graphics.executePSET(pX, pY, pCol, node.isStep);
        return null;
    }

    *visitPRESET(node) {
        const prX = yield* this.evaluate(node.x);
        const prY = yield* this.evaluate(node.y);
        const prCol = node.color !== null ? yield* this.evaluate(node.color) : null;
        this.isa.graphics.executePRESET(prX, prY, prCol, node.isStep);
        return null;
    }

    *visitLINE(node) {
        const lX1 = node.startX !== null ? yield* this.evaluate(node.startX) : null;
        const lY1 = node.startY !== null ? yield* this.evaluate(node.startY) : null;
        const lX2 = yield* this.evaluate(node.endX);
        const lY2 = yield* this.evaluate(node.endY);
        const lCol = node.color !== null ? yield* this.evaluate(node.color) : null;
        this.isa.graphics.executeLINE(lX1, lY1, lX2, lY2, lCol, node.box, node.startIsStep, node.endIsStep);
        return null;
    }

    *visitCIRCLE(node) {
        const cX = yield* this.evaluate(node.x);
        const cY = yield* this.evaluate(node.y);
        const cR = yield* this.evaluate(node.radius);
        const cCol = node.color !== null ? yield* this.evaluate(node.color) : null;
        const cSt = node.start !== null ? yield* this.evaluate(node.start) : null;
        const cEnd = node.end !== null ? yield* this.evaluate(node.end) : null;
        const cAsp = node.aspect !== null ? yield* this.evaluate(node.aspect) : null;
        this.isa.graphics.executeCIRCLE(cX, cY, cR, cCol, cSt, cEnd, cAsp, node.isStep);
        return null;
    }

    *visitPAINT(node) {
        const ptX = yield* this.evaluate(node.x);
        const ptY = yield* this.evaluate(node.y);
        const ptC = node.paintColor !== null ? yield* this.evaluate(node.paintColor) : null;
        const pbC = node.borderColor !== null ? yield* this.evaluate(node.borderColor) : null;
        this.isa.graphics.executePAINT(ptX, ptY, ptC, pbC, node.isStep);
        return null;
    }

    *visitGET_GRAPHICS(node) {
        // MS-DOS GET (Graphics) Statement: GET (x1, y1)-(x2, y2), ArrayName[(index)]
        // Captures a rectangular region of the VRAM and packs it into a standard user array.
        
        // 1. Evaluate the Cartesian bounding box
        const gx1 = yield* this.evaluate(node.startX);
        const gy1 = yield* this.evaluate(node.startY);
        const gx2 = yield* this.evaluate(node.endX);
        const gy2 = yield* this.evaluate(node.endY);
        
        let getArr = null;
        let getIdx = 0;
        
        // 2. BUFFER REFERENCE EXTRACTION
        // GET does not assign a single scalar value. It streams hardware bytes into a memory buffer.
        // Therefore, we do not evaluate the target as an R-Value; we extract its physical QArray reference.
        if (node.target.type === 'IDENTIFIER') {
            // Target is a raw array name without parentheses (e.g., GET (0,0)-(10,10), Buffer)
            // Implicitly points to the first element (index 0).
            getArr = this.env.lookup(node.target.value);
        } else if (node.target.type === 'CALL') {
            // Target includes an explicit starting offset (e.g., GET (0,0)-(10,10), Buffer(5))
            // Note: The AST parses array access as a 'CALL' node due to syntactic ambiguity with functions.
            // We use evaluateLValue to resolve it strictly as a writable memory address.
            const ref = yield* this.evaluateLValue(node.target);
            getArr = ref.array;
            getIdx = ref.indices[0] !== undefined ? ref.indices[0] : 0;
        }
        
        // 3. Delegate the raw memory blitting to the Hardware Abstraction Layer (VGA Engine)
        this.isa.graphics.executeGET_GRAPHICS(gx1, gy1, gx2, gy2, getArr, getIdx, node.startIsStep, node.endIsStep);
        return null;
    }

    *visitPUT_GRAPHICS(node) {
        // MS-DOS PUT (Graphics) Statement: PUT (x, y), ArrayName[(index)], [action]
        // Streams packed sprite data from a user array back onto the VRAM, applying bitwise logic (XOR, OR, PSET).
        
        // 1. Evaluate target VRAM coordinates
        const px = yield* this.evaluate(node.x);
        const py = yield* this.evaluate(node.y);
        
        let putArr = null;
        let putIdx = 0;
        
        // 2. BUFFER REFERENCE EXTRACTION
        // We extract the QArray reference and the specific reading offset.
        if (node.target.type === 'IDENTIFIER') {
            putArr = this.env.lookup(node.target.value);
        } else if (node.target.type === 'CALL') {
            // Resolve the pseudo-CALL into a strict L-Value memory reference to locate the array and index
            const ref = yield* this.evaluateLValue(node.target);
            putArr = ref.array;
            putIdx = ref.indices[0] !== undefined ? ref.indices[0] : 0;
        }

        // 3. Delegate the rendering and bitwise blending (XOR/PSET) to the VGA Engine
        this.isa.graphics.executePUT_GRAPHICS(px, py, putArr, putIdx, node.action, node.isStep);
        return null;
    }

    *visitSOUND(node) {
        const freq = yield* this.evaluate(node.freq);
        const durationTicks = yield* this.evaluate(node.duration);
        const ms = (durationTicks / 18.2) * 1000;
        if (ms > 0) yield { type: 'SYS_DELAY', ms: ms };
        return null;
    }

    *visitSLEEP(node) {
        let ms = 0;
        if (node.duration) {
            const seconds = yield* this.evaluate(node.duration);
            ms = seconds * 1000;
        } else {
            ms = -1;
        }
        yield { type: 'SYS_DELAY', ms: ms };
        return null;
    }

    *visitDEFINT(node) { this.env.setDefaultType(node.range, 'INTEGER'); return null; }
    *visitDEFSNG(node) { this.env.setDefaultType(node.range, 'SINGLE'); return null; }
    
    *visitDATA(node) { return null; }
    *visitDECLARE(node) { return null; }
    *visitRANDOMIZE(node) { return null; }
    *visitWIDTH(node) { return null; }
    *visitON_ERROR(node) { return null; }
    *visitRESUME(node) { return null; }
    *visitBEEP(node) { return null; }
    *visitVIEW(node) { return null; }
    *visitVIEW_PRINT(node) { return null; }
    *visitPLAY(node) { return null; }

    // ========================================================================
    // COMPLEX EVALUATORS
    // ========================================================================

    *evaluateLValue(node) {
        if (node.type === 'IDENTIFIER') return { type: 'ENV', name: node.value };
        else if (node.type === 'CALL') {
            const callee = node.callee.value.toUpperCase();
            
            if (BuiltIns[callee] || this.env.getSub(callee)) {
                throw new Error(`Cannot assign to function: ${callee}`);
            }
            
            let val = this.env.variables.get(callee) || 
                      (this.env.staticScope && this.env.staticScope.get(callee)) || 
                      this.env.sharedEnv.variables.get(callee);

            if (!val || val.constructor.name !== 'QArray') {
                throw new Error(`${callee} is not an array.`);
            }
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
     * Centralized memory reader.
     * Extracts the current raw value from a resolved L-Value reference.
     */
    readMemoryRef(tRef) {
        if (tRef.type === 'ENV') return this.env.lookup(tRef.name);
        if (tRef.type === 'ARRAY') return tRef.array.get(tRef.indices);
        if (tRef.type === 'OBJECT') return tRef.object[tRef.property];
        throw new Error(`Unknown memory reference type: ${tRef.type}`);
    }

    /**
     * Centralized memory writer.
     * Routes the value to the correct Environment, Array, or UDT Object slot,
     * while preserving specific memory class rules (like QFixedString in-place mutation).
     */
    writeMemoryRef(tRef, value) {
        if (tRef.type === 'ENV') {
            this.env.assign(tRef.name, value);
        } else if (tRef.type === 'ARRAY') {
            tRef.array.set(tRef.indices, value);
        } else if (tRef.type === 'OBJECT') {
            const currentValue = tRef.object[tRef.property];
            if (currentValue && currentValue.isFixedString) {
                currentValue.update(value); // In-place mutation for Fixed Strings
            } else {
                tRef.object[tRef.property] = value;
            }
        }
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
                // 1. Evaluate the mathematical/string value of the argument
                argValues.push(yield* this.evaluate(arg));
                
                // 2. PASS-BY-REFERENCE (L-Value Capture) vs PASS-BY-VALUE (R-Value Fallback)
                if (arg._isRValue) {
                    // FORCED PASS-BY-VALUE: 
                    // The argument was wrapped in extra parentheses (e.g., CALL Sub((X)) ).
                    // We push 'null' so the Copy-Out phase ignores this argument completely.
                    argRefs.push(null);
                    
                } else if (arg.type === 'IDENTIFIER' || arg.type === 'MEMBER_ACCESS') {
                    // Raw variables and UDT properties are passed by reference
                    argRefs.push(yield* this.evaluateLValue(arg));
                    
                } else if (arg.type === 'CALL' && arg.args.length > 0) {
                    const calleeName = arg.callee.value.toUpperCase();
                    
                    // R-VALUE CHECK: Native functions (LEN, CHR$) and User Functions yield temporary results
                    if (BuiltIns[calleeName] || this.env.getSub(calleeName)) {
                        argRefs.push(null);
                    } else {
                        // Otherwise, it's a raw Array Access. Capture its memory address!
                        argRefs.push(yield* this.evaluateLValue(arg));
                    }
                    
                } else {
                    // Primitives (Numbers, Strings, Binary Operations) are inherently Pass-by-Value
                    argRefs.push(null);
                }
            }
            
            for (let i = 0; i < subDef.params.length; i++) {
                const paramDecl = subDef.params[i];
                const pName = paramDecl.name || paramDecl; 
                
                // ALIASING: Register parameter aliases in the local child environment.
                if (paramDecl.varType) {
                    childEnv.variables.registerAlias(pName, paramDecl.varType);
                }
                
                childEnv.define(pName, argValues[i] !== undefined ? argValues[i] : 0);
            }
            
            // Re-instantiate properly to isolate execution state
            const subEvaluator = new QBasicEvaluator(childEnv, this.hw);

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
            
            // The function assigns its return value to its declared name (which includes the suffix!)
            let returnValue = (subDef.type === 'FUNCTION_DEF') ? childEnv.lookup(subDef.name) : null;

            // COPY-OUT: Update original variables if they were passed as refs
            for (let i = 0; i < subDef.params.length; i++) {
                if (argRefs[i]) {
                    const pName = subDef.params[i].name || subDef.params[i];
                    const finalVal = childEnv.lookup(pName);
                    this.writeMemoryRef(argRefs[i], finalVal);
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
            return BuiltIns[callee](...args);
        }

        // --- 3. HARDWARE-DEPENDENT BUILT-INS ---
        if (callee === BuiltInTokens.PEEK) {
            return this.isa.memory.readPEEK(args[0]);
        }
        if (callee === BuiltInTokens.POINT) {
            return this.isa.graphics.readPOINT(args[0], args[1]);
        }
        if (callee === BuiltInTokens.TAB) {
            // Return a special token for the PRINT statement hardware interceptor
            return { _special: 'TAB', col: args[0] || 1 };
        }
        if (callee === BuiltInTokens.INPUT$) {
            const charCount = Math.max(1, args[0] || 1);
            let resultStr = "";
            
            // Loop and yield control to the browser until we collect exactly n characters
            while (resultStr.length < charCount) {
                yield; 
                const key = this.isa.io.readINKEY();
                if (key) {
                    // INPUT$ intercepts keystrokes silently (no hardware echo to VGA)
                    resultStr += key;
                }
            }
            return resultStr;
        }

        // --- 4. RESOLVE ARRAYS IN ENVIRONMENT ---
        let val = this.env.variables.get(callee) || 
                  (this.env.staticScope && this.env.staticScope.get(callee)) || 
                  this.env.sharedEnv.variables.get(callee);

        if (val && val.constructor.name === 'QArray') {
            if (args.length === 0) return val;
            return val.get(args);
        }

        throw new Error(`Routine, Function, or Array not found: ${callee}`);
    }

    *evaluateBinaryOp(node) {
        let left = yield* this.evaluate(node.left);
        let right = yield* this.evaluate(node.right);

        // Strict primitive extraction for VM Memory Classes
        // Ensures operators like '=' compare primitive values, not object references.
        if (left instanceof QFixedString) left = left.value;
        if (right instanceof QFixedString) right = right.value;

        switch (node.operator) {
            case '^': return left ** right;
            case '+': return left + right; case '-': return left - right;
            case '*': return left * right; case '/': return left / right;
            case '\\': return Math.trunc(bankersRound(left) / bankersRound(right));
            case 'MOD': return bankersRound(left) % bankersRound(right);
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
