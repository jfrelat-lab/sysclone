// src/runtime/evaluator.js
import { QBasicEnvironment as Environment } from './qbasic/qbasic_environment.js';
import { QArray } from './qarray.js';
import { QFixedString } from './qfixedstring.js';
import { BuiltIns, bankersRound } from './qbasic/builtins.js';
import { BuiltInTokens } from '../parser/qbasic/tokens.js';
import { QBasicISA as ISA } from './qbasic/instructions/index.js';

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
                
                // 1. Hardware interception (I/O) via ISA !
                if (varName === BuiltInTokens.INKEY$) return this.isa.io.readINKEY();
                if (varName === BuiltInTokens.TIMER)  return this.isa.io.readTIMER();
                
                // 2. Pure STDLIB interception (e.g., RND without parentheses)
                if (BuiltIns[varName]) {
                    return BuiltIns[varName]();
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
            case 'DIM': {
                for (let decl of node.declarations) {
                    const typeName = decl.varType || decl.type || 'SINGLE'; 
                    
                    // --- PURIST VM: Pass the length node to allocate QFixedString if needed ---
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
   
                    // ALIASING: Register the explicit declaration to its suffixed name within the target vault.
                    // Route to Tier 1 if SHARED, otherwise stay in local scope.
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

            case 'STATIC':
                for (let decl of node.declarations) {
                    if (this.env.staticScope) {
                        const typeName = decl.varType || decl.type || 'SINGLE'; 
                        
                        // ALIASING: Register the alias in the persistent vault before checking for existence!
                        this.env.staticScope.registerAlias(decl.name, typeName);

                        // Initialize ONLY ONCE: if the vault already has the resolved name, we skip!
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

            case 'SHARED_IMPORT':
                for (let decl of node.declarations) {
                    const typeName = decl.varType || decl.type || 'SINGLE'; 
                    
                    // ALIASING: Register the import alias in the global vault before checking for existence!
                    this.env.sharedEnv.variables.registerAlias(decl.name, typeName);
                    
                    // 3-TIER ARCHITECTURE:
                    // We MUST NOT use this.env.define() here, otherwise JS creates a local pass-by-value copy (Shadowing).
                    // We simply ensure the variable exists in Tier 1 (sharedEnv).
                    // The Environment's assign() and lookup() methods will handle the reference resolution dynamically.
                    
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

            case 'FOR': {
                // 1. BOUND IMMUTABILITY: Evaluate TO and STEP exactly ONCE before starting
                const endVal = yield* this.evaluate(node.end);
                const stepVal = node.step ? yield* this.evaluate(node.step) : 1;
                
                // 2. Initialize the iterator directly into MS-DOS memory
                const startVal = yield* this.evaluate(node.start);
                this.env.assign(node.variable, startVal);

                while (true) {
                    // --- Virtual CPU Tick ---
                    // Breathes life into the browser event loop, preventing UI freezes
                    yield;

                    // 3. Read CURRENT value from memory (crucial if mutated by the body)
                    let currentVal = this.env.lookup(node.variable);

                    // 4. Bounds Check
                    if (stepVal >= 0 ? currentVal > endVal : currentVal < endVal) {
                        break; // Exit loop, leaving the Overshoot value safely in memory
                    }

                    // 5. Execute Body
                    yield* this.evaluate(node.body);

                    // 6. The NEXT statement: Re-read memory (in case the body mutated it!), apply STEP, and write back
                    currentVal = this.env.lookup(node.variable);
                    this.env.assign(node.variable, currentVal + stepVal);
                }
                return null;
            }

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
                const values = [];
                if (node.values && node.values.length > 0) {
                    for (let expr of node.values) {
                        values.push(yield* this.evaluate(expr));
                    }
                }
                
                const usingFormat = node.usingFormat ? yield* this.evaluate(node.usingFormat) : null;
                
                // Pure delegation to the ISA
                this.isa.io.executePRINT(values, usingFormat, node.newline);
                return null; 
            }

            case 'INPUT': {
                // Language Semantics: QBasic automatically appends "? " for INPUT.
                let finalPrompt = undefined;
                if (node.prompt !== undefined) {
                    finalPrompt = node.prompt + "? ";
                }
                
                // Hardware initialization via ISA
                this.isa.io.openInputBuffer(finalPrompt);
                
                // Hardware polling loop
                let inputResult;
                while (true) {
                    yield; // CPU ticks
                    inputResult = this.isa.io.pumpInputBuffer();
                    if (inputResult.done) break;
                }

                // Hardware closure
                const rawString = this.isa.io.closeInputBuffer();

                // Semantic Parsing (Multiple targets split by comma)
                const splitValues = rawString.split(',');
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
            }

            case 'LINE_INPUT': {
                // Language Semantics: LINE INPUT prints the prompt exactly as-is.
                this.isa.io.openInputBuffer(node.prompt);
                
                // Hardware polling loop
                let inputResult;
                while (true) {
                    yield; 
                    inputResult = this.isa.io.pumpInputBuffer();
                    if (inputResult.done) break;
                }

                // Hardware closure
                const rawString = this.isa.io.closeInputBuffer();

                // Semantic Assignment (Entire raw string to a single target)
                const targetRef = yield* this.evaluateLValue(node.target);
                if (targetRef.type === 'ENV') this.env.assign(targetRef.name, rawString);
                else if (targetRef.type === 'ARRAY') targetRef.array.set(targetRef.indices, rawString);
                else if (targetRef.type === 'OBJECT') targetRef.object[targetRef.property] = rawString;
                
                return null;
            }
            
            case 'CLS': 
                this.isa.graphics.executeCLS(); 
                return null;

            case 'LOCATE':
                const row = yield* this.evaluate(node.row);
                const col = yield* this.evaluate(node.col);
                const cur = yield* this.evaluate(node.cursor);
                yield* this.evaluate(node.start);
                yield* this.evaluate(node.stop);
                
                this.isa.io.executeLOCATE(row, col, cur);
                return null;

            case 'COLOR':
                const fg = node.fg !== null ? yield* this.evaluate(node.fg) : null;
                const bg = node.bg !== null ? yield* this.evaluate(node.bg) : null;
                this.isa.graphics.executeCOLOR(fg, bg);
                return null;
            
            case 'DEF_SEG':
                const segAddr = node.address ? yield* this.evaluate(node.address) : null;
                this.isa.memory.executeDEF_SEG(segAddr);
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
                this.isa.memory.executePOKE(pAddr, pVal);
                return null;

            case 'OUT':
                const port = yield* this.evaluate(node.port);
                const val = yield* this.evaluate(node.value);
                this.isa.io.executeOUT(port, val);
                return null;

            case 'ASSIGN': {
                const tRef = yield* this.evaluateLValue(node.target);
                
                // Use the new central cloner to evaluate and copy the right-hand side
                let aVal = this.cloneValue(yield* this.evaluate(node.value));
                
                if (tRef.type === 'ENV') {
                    this.env.assign(tRef.name, aVal);
                } else if (tRef.type === 'ARRAY') {
                    tRef.array.set(tRef.indices, aVal);
                } else if (tRef.type === 'OBJECT') {
                    const currentValue = tRef.object[tRef.property];
                    if (currentValue && currentValue.isFixedString) {
                        currentValue.update(aVal); // In-place update
                    } else {
                        tRef.object[tRef.property] = aVal;
                    }
                }
                return null;
            }

            case 'SWAP': {
                // 1. Resolve L-Values strictly using your parser's AST keys (target1, target2)
                const t1Ref = yield* this.evaluateLValue(node.target1);
                const t2Ref = yield* this.evaluateLValue(node.target2);
                
                // 2. Extract current raw values from the memory references
                let val1 = t1Ref.type === 'ENV' ? this.env.lookup(t1Ref.name) :
                           t1Ref.type === 'ARRAY' ? t1Ref.array.get(t1Ref.indices) :
                           t1Ref.object[t1Ref.property];
                              
                let val2 = t2Ref.type === 'ENV' ? this.env.lookup(t2Ref.name) :
                           t2Ref.type === 'ARRAY' ? t2Ref.array.get(t2Ref.indices) :
                           t2Ref.object[t2Ref.property];
                
                // 3. Clone them using the purist deep cloner to prevent reference entanglement
                // (This is what prevents the prototype destruction of QFixedString in Bubble Sort)
                const newT1 = this.cloneValue(val2);
                const newT2 = this.cloneValue(val1);
                
                // 4. Inject swapped value into target 1
                if (t1Ref.type === 'ENV') {
                    this.env.assign(t1Ref.name, newT1);
                } else if (t1Ref.type === 'ARRAY') {
                    t1Ref.array.set(t1Ref.indices, newT1);
                } else {
                    const curr1 = t1Ref.object[t1Ref.property];
                    if (curr1 && curr1.isFixedString) curr1.update(newT1);
                    else t1Ref.object[t1Ref.property] = newT1;
                }
                
                // 5. Inject swapped value into target 2
                if (t2Ref.type === 'ENV') {
                    this.env.assign(t2Ref.name, newT2);
                } else if (t2Ref.type === 'ARRAY') {
                    t2Ref.array.set(t2Ref.indices, newT2);
                } else {
                    const curr2 = t2Ref.object[t2Ref.property];
                    if (curr2 && curr2.isFixedString) curr2.update(newT2);
                    else t2Ref.object[t2Ref.property] = newT2;
                }
                
                return null;
            }

            case 'ERASE':
                for (let target of node.targets) {
                    const upperTarget = target.toUpperCase();
                    // Flat search: Local -> Static -> Shared
                    let arr = this.env.variables.get(upperTarget) || 
                              (this.env.staticScope && this.env.staticScope.get(upperTarget)) || 
                              this.env.sharedEnv.variables.get(upperTarget);
                    
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
                this.isa.graphics.executeSCREEN(mode);
                return null;

            case 'PALETTE':
                // QBasic allows PALETTE without args to reset colors.
                // If args are present, we map the specific attribute.
                if (node.attribute !== null && node.color !== null) {
                    const attr = yield* this.evaluate(node.attribute);
                    const color = yield* this.evaluate(node.color);
                    this.isa.graphics.executePALETTE(attr, color);
                }
                return null;

            case 'WINDOW':
                const wX1 = yield* this.evaluate(node.x1);
                const wY1 = yield* this.evaluate(node.y1);
                const wX2 = yield* this.evaluate(node.x2);
                const wY2 = yield* this.evaluate(node.y2);
                this.isa.graphics.executeWINDOW(node.invertY, wX1, wY1, wX2, wY2);
                return null;

            case 'PSET':
                const pX = yield* this.evaluate(node.x);
                const pY = yield* this.evaluate(node.y);
                const pCol = node.color !== null ? yield* this.evaluate(node.color) : null;
                this.isa.graphics.executePSET(pX, pY, pCol, node.isStep);
                return null;

            case 'PRESET':
                const prX = yield* this.evaluate(node.x);
                const prY = yield* this.evaluate(node.y);
                const prCol = node.color !== null ? yield* this.evaluate(node.color) : null;
                this.isa.graphics.executePRESET(prX, prY, prCol, node.isStep);
                return null;

            case 'LINE':
                const lX1 = node.startX !== null ? yield* this.evaluate(node.startX) : null;
                const lY1 = node.startY !== null ? yield* this.evaluate(node.startY) : null;
                const lX2 = yield* this.evaluate(node.endX);
                const lY2 = yield* this.evaluate(node.endY);
                const lCol = node.color !== null ? yield* this.evaluate(node.color) : null;
                this.isa.graphics.executeLINE(lX1, lY1, lX2, lY2, lCol, node.box, node.startIsStep, node.endIsStep);
                return null;

            case 'CIRCLE':
                const cX = yield* this.evaluate(node.x);
                const cY = yield* this.evaluate(node.y);
                const cR = yield* this.evaluate(node.radius);
                const cCol = node.color !== null ? yield* this.evaluate(node.color) : null;
                const cSt = node.start !== null ? yield* this.evaluate(node.start) : null;
                const cEnd = node.end !== null ? yield* this.evaluate(node.end) : null;
                const cAsp = node.aspect !== null ? yield* this.evaluate(node.aspect) : null;
                this.isa.graphics.executeCIRCLE(cX, cY, cR, cCol, cSt, cEnd, cAsp, node.isStep);
                return null;

            case 'PAINT':
                const ptX = yield* this.evaluate(node.x);
                const ptY = yield* this.evaluate(node.y);
                const ptC = node.paintColor !== null ? yield* this.evaluate(node.paintColor) : null;
                const pbC = node.borderColor !== null ? yield* this.evaluate(node.borderColor) : null;
                this.isa.graphics.executePAINT(ptX, ptY, ptC, pbC, node.isStep);
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
                
                this.isa.graphics.executeGET_GRAPHICS(gx1, gy1, gx2, gy2, getArr, getIdx, node.startIsStep, node.endIsStep);
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

                this.isa.graphics.executePUT_GRAPHICS(px, py, putArr, putIdx, node.action, node.isStep);
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
            case 'DEFINT':
                this.env.setDefaultType(node.range, 'INTEGER');
                return null;
            
            case 'DEFSNG':
                this.env.setDefaultType(node.range, 'SINGLE');
                return null;

            case 'DATA': case 'DECLARE':
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
            
            // PROTECT R-VALUES: Prevent assignment to STDLIB or User functions!
            // A function returns an R-Value (a temporary computed result), which cannot act as a memory target.
            if (BuiltIns[callee] || this.env.getSub(callee)) {
                throw new Error(`Cannot assign to function: ${callee}`);
            }
            
            // Flat search replacing the old while(curr) traversal
            let val = this.env.variables.get(callee) || 
                      (this.env.staticScope && this.env.staticScope.get(callee)) || 
                      this.env.sharedEnv.variables.get(callee);

            if (!val || val.constructor.name !== 'QArray') {
                console.log(node);
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
                
                // Pass-by-reference memory capture
                if (arg.type === 'IDENTIFIER' || arg.type === 'MEMBER_ACCESS') {
                    argRefs.push(yield* this.evaluateLValue(arg));
                } else if (arg.type === 'CALL' && arg.args.length > 0) {
                    const calleeName = arg.callee.value.toUpperCase();
                    
                    // R-VALUE CHECK: If the CALL is a function, it yields a temporary value.
                    // Pass it by value (null reference) to prevent the Copy-Out phase from overwriting it.
                    if (BuiltIns[calleeName] || this.env.getSub(calleeName)) {
                        argRefs.push(null);
                    } else {
                        // Otherwise, it represents an array access. Capture its memory address (L-Value) for pass-by-reference!
                        argRefs.push(yield* this.evaluateLValue(arg));
                    }
                } else {
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
            
            // The function assigns its return value to its declared name (which includes the suffix!)
            let returnValue = (subDef.type === 'FUNCTION_DEF') ? childEnv.lookup(subDef.name) : null;

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