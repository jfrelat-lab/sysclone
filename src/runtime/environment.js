// src/runtime/environment.js

import { QFixedString } from './qfixedstring.js';

/**
 * Manages variables, types, subroutines, and scoping for the Sysclone engine.
 * Handles the hierarchical relationship between local and global execution contexts.
 */
export class Environment {
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
     * Now strictly allocates Fixed-Length Strings if a length node is provided.
     */
    createDefaultValue(typeName, lengthNode = null) {
        if (!typeName) return 0;
        const upper = typeName.toUpperCase();
        
        if (['INTEGER', 'SINGLE', 'DOUBLE', 'LONG'].includes(upper)) return 0;
        
        if (upper === 'STRING') {
            // Purist Memory Allocation: Lock the memory block if a length is specified!
            if (lengthNode) {
                const fixedLen = typeof lengthNode === 'object' ? (lengthNode.value || 0) : lengthNode;
                return new QFixedString(fixedLen);
            }
            return ""; // Dynamic string (default)
        }

        const typeDef = this.getType(typeName);
        if (typeDef) {
            const instance = {};
            for (let field of typeDef) {
                // Recursively pass the length node for fixed strings declared inside UDTs
                instance[field.name.toUpperCase()] = this.createDefaultValue(field.type, field.length);
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
     * Assigns a value to a variable using strict QBasic Flat Scoping.
     * KILLS JS Lexical traversal to prevent Subroutines from bleeding into Main.
     */
    assign(name, value) {
        const upperName = name.toUpperCase();
        if (this.isImplicitInteger(name) && typeof value === 'number') {
            value = Math.round(value); 
        }

        const writeToMem = (map) => {
            const current = map.get(upperName);
            if (current && current.isFixedString) current.update(value); 
            else map.set(upperName, value); 
        };

        // 1. Tier 3: Persistent static scope
        if (this.staticScope && this.staticScope.has(upperName)) {
            writeToMem(this.staticScope);
            return true;
        }

        // 2. Tier 2 (or Main): Strict Local variables
        if (this.variables.has(upperName)) {
            writeToMem(this.variables);
            return true;
        }
        
        // --- PURIST FLAT SCOPING ---
        // 3. Tier 1: Explicit SHARED Only! (Bypass intermediate parents)
        if (this !== this.sharedEnv && this.sharedEnv.variables.has(upperName)) {
            writeToMem(this.sharedEnv.variables);
            return true;
        }
        
        // 4. Unknown -> Define Locally (Prevents Main Module bleeding)
        this.define(name, value);
        return true;
    }

    /**
     * Retrieves a variable strictly from Local or Shared Vault.
     */
    lookup(name) {
        const upperName = name.toUpperCase();
        
        // 1. Tier 3 & Tier 2: Strict Local / Static Search
        if (this.staticScope && this.staticScope.has(upperName)) return this.staticScope.get(upperName);
        if (this.variables.has(upperName)) return this.variables.get(upperName);
        
        // 2. Tier 1: Explicit SHARED Search
        if (this !== this.sharedEnv && this.sharedEnv.variables.has(upperName)) {
            return this.sharedEnv.variables.get(upperName);
        }
        
        // 3. If unknown, initialize strictly in LOCAL scope
        const defaultValue = name.endsWith('$') ? "" : 0;
        this.define(name, defaultValue);
        return defaultValue;
    }
}