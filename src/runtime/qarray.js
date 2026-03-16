// src/runtime/qarray.js

/**
 * Flattens multi-dimensional QBasic arrays with custom bounds into a 1D context.
 * Effectively emulates linear memory layout for structures like DIM array(10 TO 50).
 */
export class QArray {
    constructor(boundsDefinition, defaultValueCreator = () => 0) {
        this.bounds = boundsDefinition;
        const size = this.bounds.reduce((acc, b) => acc * (b.max - b.min + 1), 1);
        
        // The factory callback (defaultValueCreator) is injected by the Environment.
        // QArray is completely decoupled from the actual types it stores.
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

    get(indices) { 
        return this.data[this._getFlatIndex(indices)]; 
    }
    
    set(indices, value) { 
        const flatIndex = this._getFlatIndex(indices);
        const current = this.data[flatIndex];
        
        // --- PURIST VM ASSIGNMENT ---
        // Duck typing: If the target is a fixed memory block (like QFixedString),
        // we update it in-place to preserve memory references.
        if (current && current.isFixedString) {
            current.update(value);
        } else {
            // Standard dynamic overwrite
            this.data[flatIndex] = value; 
        }
    }
}