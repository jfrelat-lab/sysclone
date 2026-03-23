// src/runtime/base_environment.js

/**
 * Abstract Base Environment.
 * Manages universal features like the Data Bank and provides the contract
 * for language-specific memory scoping (e.g., Flat vs Lexical).
 * @abstract
 */
export class BaseEnvironment {
    constructor(parent = null) {
        if (new.target === BaseEnvironment) {
            throw new TypeError("Cannot construct Abstract instances of BaseEnvironment directly.");
        }
        this.parent = parent;
        this.sharedEnv = parent ? parent.sharedEnv : this;

        // Universal Data Bank (Global to the runtime)
        this.dataBank = [];
        this.dataPointer = 0;
    }

    // --- UNIVERSAL DATA BANK MANAGEMENT ---
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

    // --- MANDATORY MEMORY CONTRACT ---
    define(name, value) { throw new Error("Method 'define()' must be implemented."); }
    assign(name, value) { throw new Error("Method 'assign()' must be implemented."); }
    lookup(name) { throw new Error("Method 'lookup()' must be implemented."); }
}