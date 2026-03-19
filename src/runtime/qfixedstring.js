// src/runtime/qfixedstring.js

/**
 * Emulates a MS-DOS Fixed-Length String (STRING * N).
 * Acts as a locked memory block that auto-pads with spaces and truncates overflow.
 * Designed for O(1) in-place mutation to satisfy JIT/V8 performance constraints.
 */
export class QFixedString {
    constructor(length) {
        this.length = length;
        // Pre-allocate the memory block with spaces
        this.value = " ".repeat(length);
        
        // Fast identification flag for the Virtual CPU and QArray
        this.isFixedString = true; 
    }
    
    /**
     * Smart assignment: Updates the memory block in-place.
     * Prevents object destruction to maintain V8 hidden classes and GC performance.
     */
    update(newVal) {
        let str = (newVal !== null && newVal !== undefined) ? newVal.toString() : "";
        if (str.length < this.length) {
            // Auto-pad with spaces (Acts as a visual eraser for rendering engines)
            this.value = str.padEnd(this.length, " ");
        } else {
            // Strict truncation for MS-DOS memory bounds compliance
            this.value = str.substring(0, this.length);
        }
    }
    
    /**
     * Creates a perfect disconnected copy of the memory block.
     * Vital for UDT structural copying (e.g., Array1(I) = Array2(I))
     */
    clone() {
        const copy = new QFixedString(this.length);
        copy.value = this.value;
        return copy;
    }

    // JS Engine overrides for natural string concatenation and logic evaluation
    toString() { return this.value; }
    valueOf() { return this.value; }

    // Native JSON serialization override for the Test Runner (assertEqual)
    toJSON() { return this.value; }
}