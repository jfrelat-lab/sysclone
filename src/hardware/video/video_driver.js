// src/hardware/video/video_driver.js

/**
 * Abstract Base Class for VGA hardware drivers.
 * Enforces the contract that all video modes (Text, CGA, EGA, VGA) must respect.
 * Unimplemented optional features (like graphics in Text Mode) gracefully do nothing.
 * @abstract
 */
export class VideoDriver {
    constructor(memory) {
        if (new.target === VideoDriver) {
            throw new TypeError("Cannot construct Abstract instances of VideoDriver directly.");
        }
        /** @type {Object} System memory instance */
        this.memory = memory;
        /** @type {number} Pixel width of the display */
        this.width = 0;
        /** @type {number} Pixel height of the display */
        this.height = 0;
    }

    // --- MANDATORY HARDWARE CONTRACT ---

    /**
     * Clears the active Video RAM (VRAM) and resets cursors.
     */
    cls() { 
        throw new Error("Method 'cls()' must be implemented."); 
    }

    /**
     * Flushes the VRAM to the provided 32-bit display buffer.
     * @param {Object} displayAdapter - Target display buffer wrapper
     */
    render(displayAdapter) { 
        throw new Error("Method 'render()' must be implemented."); 
    }

    // --- OPTIONAL COMMANDS (Stubbed to prevent crashes on unsupported modes) ---

    /**
     * Draws a line between two points using Bresenham's algorithm.
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {number|null} color - Color index
     * @param {string|null} box - 'B' for Box, 'BF' for Box Fill
     */
    line(x1, y1, x2, y2, color, box) {}

    /**
     * Draws a circle or an arc using the Midpoint Circle Algorithm.
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Radius in pixels
     * @param {number|null} color - Color index
     * @param {number|null} start - Arc start angle in radians
     * @param {number|null} end - Arc end angle in radians
     * @param {number|null} aspect - Ratio for ellipses
     */
    circle(x, y, radius, color, start, end, aspect) {}

    /**
     * Fills an enclosed area with a color (Flood Fill).
     * @param {number} x - Starting X
     * @param {number} y - Starting Y
     * @param {number|null} paintColor - Fill color index
     * @param {number|null} borderColor - Boundary color index to stop the fill
     */
    paint(x, y, paintColor, borderColor) {}

    /**
     * Handles text output. Native in Mode 0, natively rasterized in Mode 13.
     * @param {number[]} bytes - Array of CP437 character codes
     */
    print(bytes) {}

    /**
     * Positions the text cursor.
     * @param {number|null} row - 1-based row index
     * @param {number|null} col - 1-based column index
     */
    locate(row, col) {}

    /**
     * Sets the active foreground and background colors.
     * @param {number} fg - Foreground color index
     * @param {number} bg - Background color index
     */
    color(fg, bg) {}

    /** Displays the blinking hardware cursor (Text modes only) */
    showCursor() {}
    
    /** Hides the hardware cursor */
    hideCursor() {}

    /**
     * Updates a single color entry in the hardware DAC palette.
     * @param {number} index - Palette index (0-255)
     * @param {number} r6 - 6-bit Red value (0-63)
     * @param {number} g6 - 6-bit Green value (0-63)
     * @param {number} b6 - 6-bit Blue value (0-63)
     */
    updatePalette(index, r6, g6, b6) {}
}