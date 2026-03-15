// src/runtime/environment.js

/**
 * Manages variables, types, subroutines, and scoping for the Sysclone engine.
 * Handles the hierarchical relationship between local and global execution contexts.
 */
export class Environment {
    // Add staticScope parameter to the constructor
    constructor(parent = null, staticScope = null) {
        this.parent = parent;
        this.sharedEnv = parent ? parent.sharedEnv : this;
        
        // The vault for persistent local variables across calls
        this.staticScope = staticScope; 
        this.variables = new Map();
        
        this.types = new Map(); 
        this.subs = new Map();
        this.defIntRanges = []; 
        this.dataBank = [];
        this.dataPointer = 0;
    }

    // --- DATA BANK MANAGEMENT ---
    addData(values) {
        for (let v of values) this.sharedEnv.dataBank.push(v);
    }
    readData() {
        if (this.sharedEnv.dataPointer >= this.sharedEnv.dataBank.length) throw new Error("Out of DATA");
        return this.sharedEnv.dataBank[this.sharedEnv.dataPointer++];
    }
    restoreData(index = 0) {
        this.sharedEnv.dataPointer = index;
    }
    getDataCount() {
        return this.sharedEnv.dataBank.length;
    }

    // --- IMPLICIT TYPING MANAGEMENT (DEFINT) ---
    defineDefInt(range) {
        this.sharedEnv.defIntRanges.push(range.toUpperCase());
    }
    isImplicitInteger(name) {
        if (name.endsWith('%') || name.endsWith('&')) return true;
        if (name.endsWith('$') || name.endsWith('!') || name.endsWith('#')) return false;

        const first = name.charAt(0).toUpperCase();
        for (let range of this.sharedEnv.defIntRanges) {
            if (first >= range.charAt(0) && first <= range.charAt(2)) return true;
        }
        return false;
    }

    // --- SUBROUTINE MANAGEMENT (SUB / FUNCTION) ---
    defineSub(name, params, body, type = 'SUB_DEF', isStatic = false) {
        this.sharedEnv.subs.set(name.toUpperCase(), { 
            params, body, type, isStatic,
            persistentVars: new Map() // Creates the persistent vault
        });
    }
    getSub(name) {
        return this.sharedEnv.subs.get(name.toUpperCase()) || null;
    }

    // --- STRUCTURE MANAGEMENT (TYPE) ---
    defineType(name, fields) {
        this.sharedEnv.types.set(name.toUpperCase(), fields);
    }
    getType(name) {
        return this.sharedEnv.types.get(name.toUpperCase()) || null;
    }

    /**
     * Recursively creates default values for variables or complex structures.
     * Ensures compatibility with QBasic's automatic zero/empty-string initialization.
     */
    createDefaultValue(typeName) {
        if (!typeName) return 0;
        const upper = typeName.toUpperCase();
        if (['INTEGER', 'SINGLE', 'DOUBLE', 'LONG'].includes(upper)) return 0;
        if (upper === 'STRING') return "";

        const typeDef = this.getType(typeName);
        if (typeDef) {
            const instance = {};
            for (let field of typeDef) {
                instance[field.name.toUpperCase()] = this.createDefaultValue(field.type);
            }
            return instance;
        }
        return 0; 
    }

    // --- VARIABLE MANAGEMENT ---

    define(name, value) {
        this.variables.set(name.toUpperCase(), value);
    }

    /**
     * Assigns a value to a variable, searching through the scope chain.
     * Includes automatic rounding for variables identified as Integers.
     */
    assign(name, value) {
        const upperName = name.toUpperCase();
        if (this.isImplicitInteger(name) && typeof value === 'number') {
            value = Math.round(value); 
        }

        // 1. Check persistent static scope FIRST
        if (this.staticScope && this.staticScope.has(upperName)) {
            this.staticScope.set(upperName, value);
            return true;
        }

        // 2. Local variables
        if (this.variables.has(upperName)) {
            this.variables.set(upperName, value);
            return true;
        }
        
        // 3. Parent traversal (Tier 2 and Tier 1)
        let curr = this.parent;
        while (curr) {
            if (curr.variables.has(upperName)) {
                curr.variables.set(upperName, value);
                return true;
            }
            curr = curr.parent;
        }
        
        this.define(name, value);
        return true;
    }

    /**
     * Retrieves a variable value. If undefined, initializes it with 
     * a type-appropriate default value (QBasic behavior).
     */
    lookup(name) {
        const upperName = name.toUpperCase();
        
        // 1. Search in local and parent scopes strictly in READ-ONLY mode
        let curr = this;
        while (curr) {
            if (curr.staticScope && curr.staticScope.has(upperName)) {
                return curr.staticScope.get(upperName);
            }
            if (curr.variables.has(upperName)) {
                return curr.variables.get(upperName);
            }
            curr = curr.parent;
        }
        
        // 2. If completely unknown anywhere, initialize it strictly in the LOCAL scope!
        const defaultValue = name.endsWith('$') ? "" : 0;
        
        // Because childEnv.variables is linked to persistentVars in a SUB STATIC,
        // this locally defines it straight into the vault.
        this.define(name, defaultValue);
        
        return defaultValue;
    }
}

/**
 * Flattens multi-dimensional QBasic arrays with custom bounds into a 1D context.
 * Effectively emulates memory layout for structures like DIM array(10 TO 50).
 */
export class QArray {
    constructor(boundsDefinition, defaultValueCreator = () => 0) {
        this.bounds = boundsDefinition;
        const size = this.bounds.reduce((acc, b) => acc * (b.max - b.min + 1), 1);
        
        this.data = new Array(size).fill(null).map(() => defaultValueCreator());
    }

    /**
     * Maps multi-dimensional indices to a flat 1D array index.
     */
    _getFlatIndex(indices) {
        if (indices.length !== this.bounds.length) {
            throw new Error("Incorrect number of dimensions");
        }
        let index = 0;
        let multiplier = 1;
        for (let i = this.bounds.length - 1; i >= 0; i--) {
            const bound = this.bounds[i];
            const val = indices[i];
            if (val < bound.min || val > bound.max) {
                throw new Error(`Index ${val} out of bounds (${bound.min} TO ${bound.max})`);
            }
            index += (val - bound.min) * multiplier;
            multiplier *= (bound.max - bound.min + 1);
        }
        return index;
    }

    get(indices) { return this.data[this._getFlatIndex(indices)]; }
    set(indices, value) { this.data[this._getFlatIndex(indices)] = value; }
}