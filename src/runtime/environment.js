// src/runtime/environment.js

/**
 * Manages variables, types, subroutines, and scoping for the Sysclone engine.
 * Handles the hierarchical relationship between local and global execution contexts.
 */
export class Environment {
    constructor(parent = null) {
        this.parent = parent;
        this.variables = new Map();
        this.types = new Map(); 
        this.subs = new Map();
        this.defIntRanges = []; // Stores character ranges for implicit typing (e.g., "A-Z")
    }

    // --- IMPLICIT TYPING MANAGEMENT (DEFINT) ---

    /**
     * Registers a range of letters to be treated as Integers by default.
     * Equivalent to QBasic: DEFINT A-Z
     */
    defineDefInt(range) {
        this.defIntRanges.push(range.toUpperCase());
    }

    /**
     * Determines if a variable should be treated as an Integer based on 
     * explicit suffixes (%, &) or registered DEFINT ranges.
     */
    isImplicitInteger(name) {
        if (name.endsWith('%') || name.endsWith('&')) return true;
        if (name.endsWith('$') || name.endsWith('!') || name.endsWith('#')) return false;

        const first = name.charAt(0).toUpperCase();
        for (let range of this.defIntRanges) {
            if (first >= range.charAt(0) && first <= range.charAt(2)) return true;
        }
        if (this.parent) return this.parent.isImplicitInteger(name);
        return false;
    }

    // --- SUBROUTINE MANAGEMENT (SUB / FUNCTION) ---

    /**
     * Registers a subroutine or function definition in the current scope.
     */
    defineSub(name, params, body, type = 'SUB_DEF') {
        this.subs.set(name.toUpperCase(), { params, body, type });
    }

    getSub(name) {
        const upperName = name.toUpperCase();
        if (this.subs.has(upperName)) return this.subs.get(upperName);
        if (this.parent) return this.parent.getSub(name);
        return null;
    }

    // --- STRUCTURE MANAGEMENT (TYPE) ---

    /**
     * Registers a User-Defined Type (UDT) structure.
     */
    defineType(name, fields) {
        this.types.set(name.toUpperCase(), fields);
    }

    getType(name) {
        const upperName = name.toUpperCase();
        if (this.types.has(upperName)) return this.types.get(upperName);
        if (this.parent) return this.parent.getType(name);
        return null;
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

        // Enforce rounding if the variable is an implicit Integer (DEFINT logic)
        if (this.isImplicitInteger(name) && typeof value === 'number') {
            value = Math.round(value); 
        }

        // 1. Update if it exists locally
        if (this.variables.has(upperName)) {
            this.variables.set(upperName, value);
            return true;
        }
        
        // 2. Search through parents to update existing global/outer variables
        let curr = this.parent;
        while (curr) {
            if (curr.variables.has(upperName)) {
                curr.variables.set(upperName, value);
                return true;
            }
            curr = curr.parent;
        }
        
        // 3. If not found anywhere, define it strictly in the local scope
        this.define(name, value);
        return true;
    }

    /**
     * Retrieves a variable value. If undefined, initializes it with 
     * a type-appropriate default value (QBasic behavior).
     */
    lookup(name) {
        const upperName = name.toUpperCase();
        if (this.variables.has(upperName)) return this.variables.get(upperName);
        if (this.parent) return this.parent.lookup(name);
        
        const defaultValue = name.endsWith('$') ? "" : 0;
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