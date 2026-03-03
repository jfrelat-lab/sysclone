// src/hardware/io.js

/**
 * Handles hardware Input/Output, specifically keyboard buffering and system timers.
 * Part of the Sysclone Hardware Abstraction Layer (HAL).
 */
export class IO {
    constructor() {
        this.keyBuffer = []; // FIFO keystroke queue

        // Listen for keyboard events at the window level
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        // Prevent default browser scrolling for navigation keys and spacebar
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
            e.preventDefault();
        }

        let qbKey = "";

        // Map modern keys to QBasic / MS-DOS legacy scan codes
        switch (e.key) {
            // Extended keys (Arrows) return CHR$(0) + a specific letter code
            case "ArrowUp":    qbKey = String.fromCharCode(0) + "H"; break;
            case "ArrowDown":  qbKey = String.fromCharCode(0) + "P"; break;
            case "ArrowLeft":  qbKey = String.fromCharCode(0) + "K"; break;
            case "ArrowRight": qbKey = String.fromCharCode(0) + "M"; break;
            
            // Standard control keys
            case "Enter":      qbKey = String.fromCharCode(13); break;
            case "Escape":     qbKey = String.fromCharCode(27); break;
            case "Backspace":  qbKey = String.fromCharCode(8); break;
            
            // Standard alphanumeric characters
            default:
                if (e.key.length === 1) {
                    qbKey = e.key; 
                }
        }

        if (qbKey) {
            this.keyBuffer.push(qbKey);
        }
    }

    /**
     * Equivalent to QBasic command: INKEY$
     * Pops the oldest keystroke from the buffer (FIFO).
     */
    inkey() {
        if (this.keyBuffer.length > 0) {
            return this.keyBuffer.shift(); 
        }
        return ""; // Empty string if no key was pressed
    }

    /**
     * Equivalent to QBasic command: TIMER
     * Returns the number of seconds elapsed since midnight.
     */
    timer() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return (now.getTime() - midnight.getTime()) / 1000.0;
    }

    /**
     * Flushes the keyboard buffer. 
     * Frequently used in Nibbles logic: WHILE INKEY$ <> "": WEND
     */
    clearKeyBuffer() {
        this.keyBuffer = [];
    }
}