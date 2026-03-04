// src/hardware/video/video_driver.js

/**
 * Abstract Base Class for VGA hardware drivers.
 * Enforces the contract that all video modes (Text, CGA, EGA, VGA) must respect.
 */
export class VideoDriver {
    constructor(memory) {
        if (new.target === VideoDriver) {
            throw new TypeError("Cannot construct Abstract instances of VideoDriver directly.");
        }
        this.memory = memory;
        this.width = 0;
        this.height = 0;
    }

    // --- MANDATORY HARDWARE CONTRACT ---

    cls() { throw new Error("Method 'cls()' must be implemented."); }
    render(displayAdapter) { throw new Error("Method 'render()' must be implemented."); }

    // --- OPTIONAL COMMANDS (Stubbed by default to prevent crashes) ---

    print(bytes) { /* Hardware ignores text if not supported */ }
    pset(x, y, color) { /* Hardware ignores graphics if not supported */ }
    locate(row, col) { }
    color(fg, bg) { }
    showCursor() { }
    hideCursor() { }
}