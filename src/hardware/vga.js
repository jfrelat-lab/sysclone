// src/hardware/vga.js
import { Mode0Text } from './video/mode0_text.js';
import { Mode13Linear } from './video/mode13_linear.js';
import { Mode9EGA } from './video/mode9_ega.js';

const VGA_PORT_DAC_INDEX = 0x3C8; // Palette Address Register
const VGA_PORT_DAC_DATA  = 0x3C9; // Palette Data Register

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
            9: new Mode9EGA(this.memory),
            13: new Mode13Linear(this.memory)
        };
        
        this.mode = 0;
        this.activeDriver = null;
        this.display = null;
        this.logicalWindow = null;
        this.lastX = 0; // Graphic Cursor X
        this.lastY = 0; // Graphic Cursor Y
        
        // --- VGA DAC Palette State Machine ---
        this.paletteIndex = 0;
        this.rgbState = 0; // 0: Red, 1: Green, 2: Blue
        this.tempRGB = [0, 0, 0];

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
            
            // Dynamic CSS height calculation to maintain square pixels
            // We fix the physical CSS width to 640px (standard emulator UI width)
            const scale = 640 / width;
            const physicalHeight = Math.floor(height * scale);
            
            canvas.style.width = "640px";
            canvas.style.height = `${physicalHeight}px`;
            canvas.style.imageRendering = "pixelated";
            
            const ctx = canvas.getContext('2d', { alpha: false });
            // Recreate ImageData when the underlying resolution changes
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
     * Handles hardware port writes (Memory-Mapped I/O equivalent).
     * Intercepts standard VGA registers.
     * @param {number} port - The 16-bit hardware port address
     * @param {number} val  - The 8-bit value written to the port
     */
    out(port, val) {
        if (port === VGA_PORT_DAC_INDEX) {
            // Set DAC Write Index
            this.paletteIndex = val & 0xFF;
            this.rgbState = 0; 
        } else if (port === VGA_PORT_DAC_DATA) {
            // Write DAC Data (R, then G, then B) - values are 6-bit (0-63)
            this.tempRGB[this.rgbState] = val & 0x3F;
            this.rgbState++;
            
            if (this.rgbState === 3) {
                // Color is fully formed, send to active driver
                if (this.activeDriver && typeof this.activeDriver.updatePalette === 'function') {
                    this.activeDriver.updatePalette(this.paletteIndex, this.tempRGB[0], this.tempRGB[1], this.tempRGB[2]);
                }
                // Auto-increment the index after a full RGB write (Hardware feature)
                this.paletteIndex = (this.paletteIndex + 1) & 0xFF;
                this.rgbState = 0;
            }
        }
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
     * Maps a hardware color attribute to a specific display color index.
     * Equivalent to QBasic: PALETTE attribute, color
     */
    setPalette(attribute, color) {
        if (this.activeDriver && typeof this.activeDriver.setPalette === 'function') {
            this.activeDriver.setPalette(attribute, color);
        }
    }

    /**
     * Evaluates the color of a specific pixel on the screen.
     * Crucial for collision detection in QBasic (POINT function).
     * Automatically applies the WINDOW coordinate projection.
     */
    point(x, y) {
        if (!this.activeDriver || typeof this.activeDriver.getPixel !== 'function') return 0;
        
        // Resolve logical coords (WINDOW) to physical screen coords
        const { px, py } = this.resolveCoords(x, y, false);
        const color = this.activeDriver.getPixel(px, py);
        
        // If pixel is out of bounds, return 0 (Black) to avoid breaking physics
        return color !== -1 ? color : 0; 
    }

    /**
     * Resolves logical coordinates into physical driver coordinates, applying STEP and WINDOW.
     */
    resolveCoords(x, y, isStep) {
        // 1. Apply STEP relative positioning
        let logicalX = isStep ? this.lastX + x : x;
        let logicalY = isStep ? this.lastY + y : y;
        
        // Update the graphic cursor
        this.lastX = logicalX;
        this.lastY = logicalY;

        // 2. Apply WINDOW projection if active
        let physX = logicalX;
        let physY = logicalY;

        if (this.logicalWindow && this.activeDriver) {
            const { invertY, x1, y1, x2, y2 } = this.logicalWindow;
            const width = this.activeDriver.width;
            const height = this.activeDriver.height;

            physX = ((logicalX - x1) / (x2 - x1)) * width;
            
            let mappedY = ((logicalY - y1) / (y2 - y1)) * height;
            physY = invertY ? (height - mappedY) : mappedY;
        }

        return { px: Math.round(physX), py: Math.round(physY) };
    }

    pset(x, y, color, isStep = false) {
        if (!this.activeDriver) return;
        const { px, py } = this.resolveCoords(x, y, isStep);
        this.activeDriver.pset(px, py, color);
    }

    line(x1, y1, x2, y2, color, box, startIsStep, endIsStep) {
        if (!this.activeDriver || typeof this.activeDriver.line !== 'function') return;
        const p1 = this.resolveCoords(x1, y1, startIsStep);
        
        // In QBasic, the second STEP is relative to the first coordinate of the LINE, not the previous cursor!
        if (endIsStep) {
            this.lastX = x1;
            this.lastY = y1;
        }
        const p2 = this.resolveCoords(x2, y2, endIsStep);
        
        this.activeDriver.line(p1.px, p1.py, p2.px, p2.py, color, box);
    }

    circle(x, y, radius, color, start, end, aspect, isStep) {
        if (!this.activeDriver || typeof this.activeDriver.circle !== 'function') return;
        const { px, py } = this.resolveCoords(x, y, isStep);
        
        // Scale radius if WINDOW is active
        let physRadius = radius;
        if (this.logicalWindow) {
            const { x1, x2 } = this.logicalWindow;
            physRadius = (radius / Math.abs(x2 - x1)) * this.activeDriver.width;
        }
        
        this.activeDriver.circle(px, py, Math.round(physRadius), color, start, end, aspect);
    }

    paint(x, y, paintColor, borderColor, isStep) {
        if (!this.activeDriver || typeof this.activeDriver.paint !== 'function') return;
        const { px, py } = this.resolveCoords(x, y, isStep);
        this.activeDriver.paint(px, py, paintColor, borderColor);
    }

    getGraphics(x1, y1, x2, y2, qArray, startIndex, startIsStep, endIsStep) {
        if (!this.activeDriver || typeof this.activeDriver.getGraphics !== 'function') return;
        const p1 = this.resolveCoords(x1, y1, startIsStep);
        // Second coordinate STEP in QBasic is relative to the first coordinate!
        if (endIsStep) { this.lastX = x1; this.lastY = y1; }
        const p2 = this.resolveCoords(x2, y2, endIsStep);
        
        this.activeDriver.getGraphics(p1.px, p1.py, p2.px, p2.py, qArray, startIndex);
    }

    putGraphics(x, y, qArray, startIndex, action, isStep) {
        if (!this.activeDriver || typeof this.activeDriver.putGraphics !== 'function') return;
        const p = this.resolveCoords(x, y, isStep);
        this.activeDriver.putGraphics(p.px, p.py, qArray, startIndex, action);
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