// src/hardware/vga.js
import { Mode0Text } from './video/mode0_text.js';
import { Mode13Linear } from './video/mode13_linear.js';

/**
 * VGA Controller Router.
 * Uses the Strategy Pattern to delegate rendering to the active video mode driver.
 */
export class VGA {
    /**
     * @param {Object} memory - The system Memory instance
     * @param {Object} options - Configuration and DisplayAdapter injection
     */
    constructor(memory, options = {}) {
        this.memory = memory;
        this.options = options;
        
        // Initialize available hardware drivers
        this.drivers = {
            0: new Mode0Text(this.memory),
            13: new Mode13Linear(this.memory)
        };
        
        this.mode = 0;
        this.activeDriver = null;
        this.display = null;
        this.logicalWindow = null;
        
        this.setMode(0); // Boot in Text Mode
    }

    initDisplay(width, height) {
        if (this.options.displayAdapter) {
            this.display = this.options.displayAdapter;
            this.display.width = width;
            this.display.height = height;
        } else {
            const canvas = document.getElementById(this.options.canvasId || 'vga-display');
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = "640px";
            canvas.style.height = "400px";
            canvas.style.imageRendering = "pixelated";
            
            const ctx = canvas.getContext('2d', { alpha: false });
            // If the size changes, we must recreate the ImageData
            const imageData = ctx.createImageData(width, height);
            
            this.display = {
                width: width,
                height: height,
                pixelBuffer32: new Uint32Array(imageData.data.buffer),
                commit: () => ctx.putImageData(imageData, 0, 0)
            };
        }
    }

    setMode(mode) {
        if (!this.drivers[mode]) throw new Error(`Video mode ${mode} not implemented.`);
        this.mode = mode;
        this.activeDriver = this.drivers[mode];
        
        // Reset logical window when changing modes
        this.logicalWindow = null;

        // Resize the actual display buffer to match the new driver's resolution
        this.initDisplay(this.activeDriver.width, this.activeDriver.height);
        this.activeDriver.cls();
    }

    /**
     * Defines a logical coordinate system mapping to the physical screen.
     */
    setWindow(invertY, x1, y1, x2, y2) {
        this.logicalWindow = { invertY, x1, y1, x2, y2 };
    }

    // --- DELEGATION TO ACTIVE DRIVER ---

    render() {
        if (this.activeDriver && this.display) {
            this.activeDriver.render(this.display);
            this.display.commit();
        }
    }

    cls() { this.activeDriver.cls(); }
    print(bytes) { this.activeDriver.print(bytes); }

    /**
     * Plots a pixel. If a logical WINDOW is active, projects coordinates to physical pixels first.
     */
    pset(x, y, color) { 
        let px = x;
        let py = y;

        if (this.logicalWindow && this.activeDriver) {
            const win = this.logicalWindow;
            const width = this.activeDriver.width;
            const height = this.activeDriver.height;

            // Prevent division by zero
            if (win.x2 === win.x1 || win.y2 === win.y1) return;

            // X Linear Interpolation
            px = ((x - win.x1) / (win.x2 - win.x1)) * width;

            // Y Linear Interpolation
            if (win.invertY) {
                // WINDOW SCREEN: Y axis grows downwards
                py = ((y - win.y1) / (win.y2 - win.y1)) * height;
            } else {
                // WINDOW: Cartesian format, Y axis grows upwards
                py = ((win.y2 - y) / (win.y2 - win.y1)) * height;
            }
        }

        this.activeDriver.pset(px, py, color); 
    }

    color(fg, bg) { this.activeDriver.color(fg, bg); }
    locate(row, col) { this.activeDriver.locate(row, col); }
    showCursor() { this.activeDriver.showCursor(); }
    hideCursor() { this.activeDriver.hideCursor(); }

    // Expose structural metrics for the Evaluator (backward compatibility)
    get rows() { return this.activeDriver.rows || 25; }
    get cols() { return this.activeDriver.cols || 80; }
    get cursorX() { return this.activeDriver.cursorX || 0; }
    get cursorY() { return this.activeDriver.cursorY || 0; }
}