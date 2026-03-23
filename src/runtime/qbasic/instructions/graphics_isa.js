// src/runtime/qbasic/instructions/graphics_isa.js

/**
 * Encapsulates MS-DOS QBasic graphics and viewport operations.
 * Forms part of the Virtual Instruction Set Architecture (ISA).
 */
export class GraphicsISA {
    constructor(hw) {
        this.vga = hw.vga;
    }

    /**
     * Executes the PSET statement.
     * Draws a pixel at the specified coordinates, defaulting to the foreground color.
     */
    executePSET(x, y, color, isStep) {
        if (this.vga) this.vga.pset(x, y, color, isStep);
    }

    /**
     * Executes the PRESET statement.
     * PSET's twin: Draws a pixel, but PRESET defaults to the background color, 
     * whereas PSET defaults to the foreground color.
     */
    executePRESET(x, y, color, isStep) {
        if (this.vga) this.vga.pset(x, y, color !== null ? color : this.vga.currentBg, isStep);
    }

    /**
     * Executes the LINE statement.
     * Supports drawing lines, boxes (B), and filled boxes (BF).
     */
    executeLINE(x1, y1, x2, y2, color, box, startIsStep, endIsStep) {
        if (this.vga) {
            // Use the current hardware graphic cursor if the start coordinate was omitted (e.g., LINE - (x, y))
            const startX = x1 !== null ? x1 : this.vga.lastX;
            const startY = y1 !== null ? y1 : this.vga.lastY;
            this.vga.line(startX, startY, x2, y2, color, box, startIsStep, endIsStep);
        }
    }

    /**
     * Executes the CIRCLE statement.
     * Handles perfect circles, partial arcs, and aspect-ratio adjusted ellipses.
     */
    executeCIRCLE(x, y, radius, color, start, end, aspect, isStep) {
        if (this.vga) this.vga.circle(x, y, radius, color, start, end, aspect, isStep);
    }

    /**
     * Executes the PAINT statement (Flood Fill).
     */
    executePAINT(x, y, paintColor, borderColor, isStep) {
        if (this.vga) this.vga.paint(x, y, paintColor, borderColor, isStep);
    }

    /**
     * Executes the SCREEN statement to change the video mode (e.g., Mode 13, Mode 9).
     */
    executeSCREEN(mode) {
        if (this.vga) this.vga.setMode(mode);
    }

    /**
     * Executes the WINDOW statement.
     * Defines a logical coordinate system. QBasic allows "WINDOW SCREEN" to invert the Y-axis mathematically.
     */
    executeWINDOW(invertY, x1, y1, x2, y2) {
        if (this.vga) this.vga.setWindow(invertY, x1, y1, x2, y2);
    }

    /**
     * Executes the CLS statement.
     * Clears the active Video RAM (VRAM) and resets cursors.
     */
    executeCLS() {
        if (this.vga) this.vga.cls();
    }

    /**
     * Executes the COLOR statement.
     * Sets the active foreground and background colors for subsequent drawing/printing operations.
     */
    executeCOLOR(fg, bg) {
        if (this.vga) {
            const finalFg = fg !== null ? fg : this.vga.currentFg;
            const finalBg = bg !== null ? bg : this.vga.currentBg;
            this.vga.color(finalFg, finalBg);
        }
    }

    /**
     * Executes the PALETTE statement.
     * Modifies hardware color mappings. 
     * Note: QBasic allows PALETTE without args to reset default colors.
     * If args are present, we map the specific attribute.
     */
    executePALETTE(attribute, color) {
        if (this.vga && typeof this.vga.setPalette === 'function' && attribute !== null && color !== null) {
            this.vga.setPalette(attribute, color);
        }
    }

    /**
     * Executes the GET (Graphics) statement.
     * Captures a rectangular area of the screen and packs it into an array (preserving EGA Planar / VGA Linear formats).
     */
    executeGET_GRAPHICS(x1, y1, x2, y2, targetArray, targetIndex, startIsStep, endIsStep) {
        if (this.vga) this.vga.getGraphics(x1, y1, x2, y2, targetArray, targetIndex, startIsStep, endIsStep);
    }

    /**
     * Executes the PUT (Graphics) statement.
     * Unpacks and renders an array of pixels to the screen using a specific blending action (e.g., XOR, PSET).
     */
    executePUT_GRAPHICS(x, y, targetArray, targetIndex, action, isStep) {
        if (this.vga) this.vga.putGraphics(x, y, targetArray, targetIndex, action, isStep);
    }

    /**
     * Reads the color index of a specific pixel on the screen.
     * Crucial for QBasic collision detection (e.g., Gorillas bounding boxes).
     */
    readPOINT(x, y) {
        if (this.vga && typeof this.vga.point === 'function') {
            return this.vga.point(x, y);
        }
        return 0; // Fallback to background color (0) if no hardware attached
    }
}