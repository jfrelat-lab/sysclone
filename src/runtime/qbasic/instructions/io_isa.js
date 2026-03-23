// src/runtime/qbasic/instructions/io_isa.js
import { toCP437Array } from '../../../hardware/encoding.js';

export class IoISA {
    constructor(hw) {
        this.vga = hw.vga;
        this.io = hw.io;
    }

    /**
     * Pops the oldest keystroke from the hardware FIFO buffer.
     */
    readINKEY() {
        return this.io ? this.io.inkey() : "";
    }

    /**
     * Returns the number of seconds elapsed since midnight.
     */
    readTIMER() {
        return this.io ? this.io.timer() : 0;
    }

    /**
     * Checks if a keyboard hardware is attached.
     * Useful to prevent infinite loops in headless unit tests.
     */
    hasKeyboard() {
        return this.io !== null && this.io !== undefined;
    }

    /**
     * Prints a raw JS String to the VGA, handling CP437 encoding automatically.
     */
    executePrintString(str) {
        if (this.vga) this.vga.print(Array.from(toCP437Array(str)));
    }

    /**
     * Prints raw byte codes directly to the VGA.
     * Useful for hardware signals (e.g., [13, 10] for CR LF, or [8, 32, 8] for Backspace).
     */
    executePrintBytes(bytes) {
        if (this.vga) this.vga.print(bytes);
    }

    executeShowCursor() {
        if (this.vga) this.vga.showCursor();
    }

    executeHideCursor() {
        if (this.vga) this.vga.hideCursor();
    }

    // ========================================================================
    // DOS BUFFERED INPUT EMULATION (INT 21h, AH=0Ah)
    // ========================================================================

    /**
     * Initializes the hardware for a blocking string input.
     * The ISA is completely agnostic of language quirks (like appending "? ").
     */
    openInputBuffer(prompt) {
        this._inputBuffer = "";
        if (prompt !== undefined && prompt !== null) {
            this.executePrintString(prompt);
        }
        this.executeShowCursor();
    }

    /**
     * Polls the hardware for a single keystroke and processes UI echoes (Backspace, etc.).
     * Must be called continuously in a CPU yield loop.
     * @returns {Object} { done: boolean, text: string }
     */
    pumpInputBuffer() {
        if (!this.io) return { done: true, text: this._inputBuffer }; // Failsafe
        
        const key = this.readINKEY();
        if (!key) return { done: false };

        if (key === String.fromCharCode(13)) { // Enter
            this.executePrintBytes([13, 10]); // CR LF
            return { done: true, text: this._inputBuffer };
        }
        
        if (key === String.fromCharCode(8)) { // Backspace
            if (this._inputBuffer.length > 0) {
                this._inputBuffer = this._inputBuffer.slice(0, -1);
                this.executePrintBytes([8, 32, 8]); // Erase from VGA
            }
        } else if (key.length === 1) { // Standard character
            this._inputBuffer += key;
            this.executePrintString(key);
        }

        return { done: false };
    }

    /**
     * Finalizes the input process, hides the hardware cursor, and returns the buffer.
     */
    closeInputBuffer() {
        this.executeHideCursor();
        const finalString = this._inputBuffer;
        this._inputBuffer = ""; // Free internal state
        return finalString;
    }

    // ========================================================================
    // STANDARD PRINTING & I/O
    // ========================================================================

    /**
     * Purist MS-DOS string formatter for PRINT USING.
     * Decoupled from the I/O engine for strict unit testing.
     */
    formatPrintUsing(formatStr, values) {
        let valIndex = 0;
        
        // The regex catches '&' (Strings) and '[#,\.]+' (Numbers)
        return formatStr.replace(/&|[#,\.]+/g, (match) => {
            if (valIndex >= values.length) return match;
            let val = values[valIndex++];
            
            // --- 1. String Formatting ---
            if (match === '&') {
                return (val !== null && val !== undefined) ? val.toString() : "";
            }
            
            // --- 2. Number Formatting ---
            let numVal = Number(val);
            if (isNaN(numVal)) numVal = 0; // Fallback to avoid outright NaN crashes
            
            let numStr = "";
            
            if (match.includes('.')) {
                // Extract the number of decimal places requested (e.g., .### -> 3)
                const decimals = match.split('.')[1].replace(/[^#]/g, '').length;
                numStr = numVal.toFixed(decimals); // Preserve floating point precision!
            } else {
                // Integers only
                numStr = Math.round(numVal).toString(); 
            }
            
            // Handle comma thousands separators
            if (match.includes(',')) {
                let parts = numStr.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                numStr = parts.join('.');
            }
            
            // MS-DOS overflow rule: Prefix with '%' if the formatted number is too wide
            if (numStr.length > match.length) return "%" + numStr;
            
            // Right-align numbers within the specified width
            return numStr.padStart(match.length, ' ');
        });
    }

    /**
     * Executes the PRINT statement.
     * Handles standard printing, USING formats, TAB interception, and MS-DOS spacing quirks.
     */
    executePRINT(values, usingFormat, newline) {
        let output = "";
        
        // Handle the PRINT USING statement for specific string/number formatting (e.g., currency).
        if (usingFormat) {
            // --- PURIST USING ENGINE ---
            // The heavy lifting is delegated to our unit-tested method
            output = this.formatPrintUsing(usingFormat, values);
        } else {
            // Handle standard PRINT statements.
            for (let val of values) {
                // Surgical hardware interception for the TAB() function.
                if (val && val._special === 'TAB') {
                    if (this.vga) {
                        // Flush any pending text in the output buffer to the VRAM before moving the cursor.
                        if (output.length > 0) {
                            this.vga.print(Array.from(toCP437Array(output)));
                            output = "";
                        }
                        
                        const targetX = Math.max(1, Math.round(val.col)) - 1;
                        
                        // If the cursor is already past the target column, QBasic wraps it to the next line.
                        if (this.vga.cursorX > targetX) {
                            this.vga.print([13, 10]); // CR LF
                        }
                        
                        // Pad the screen with spaces until the cursor reaches the target column.
                        const spaces = targetX - this.vga.cursorX;
                        if (spaces > 0) {
                            this.vga.print(Array.from(toCP437Array(" ".repeat(spaces))));
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
        
        if (this.vga) {
            // CPU Phase: Translate the final Unicode string into a CP437 byte array for the MS-DOS hardware.
            const byteStream = Array.from(toCP437Array(output));
            
            // Hardware Phase: Inject Carriage Return (13) and Line Feed (10) if a newline is required.
            // (i.e., the PRINT statement did not end with a semicolon or comma).
            if (newline) {
                byteStream.push(13, 10);
            }
            this.vga.print(byteStream);
        }
    }

    /**
     * Executes the LOCATE statement to position the hardware cursor.
     */
    executeLOCATE(row, col, cursor) {
        if (this.vga) {
            this.vga.locate(row, col);
            
            // Hardware Cursor Control
            if (cursor !== null) {
                if (cursor === 0) this.vga.hideCursor();
                else this.vga.showCursor();
            }
        }
    }

    /**
     * Executes the OUT statement for low-level hardware port writing.
     */
    executeOUT(port, val) {
        if (this.vga) this.vga.out(port, val);
    }
}