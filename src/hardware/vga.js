// src/hardware/vga.js
import { fontVGA } from './font.js';

/**
 * Hardware Abstraction for the VGA Controller.
 * Reads directly from physical Memory (VRAM segments) and renders to a 32-bit pixel buffer.
 * Acts as a dumb terminal: processes control bytes (CR, LF, BS) natively.
 */
export class VGA {
    /**
     * @param {Object} memory - The system Memory instance
     * @param {Object} options - Configuration and DisplayAdapter injection
     */
    constructor(memory, options = {}) {
        this.memory = memory;
        
        // Mode 0 Metrics (Text 80x25)
        this.cols = 80;
        this.rows = 25;
        this.charWidth = 8;
        this.charHeight = 16;
        
        const width = this.cols * this.charWidth;
        const height = this.rows * this.charHeight;

        // Dependency Injection for the screen output (Canvas DOM or Test Mock)
        if (options.displayAdapter) {
            this.display = options.displayAdapter;
        } else {
            // Default DOM Canvas implementation
            const canvas = document.getElementById(options.canvasId || 'vga-display');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });
            const imageData = ctx.createImageData(width, height);
            
            this.display = {
                width: width,
                height: height,
                pixelBuffer32: new Uint32Array(imageData.data.buffer),
                commit: () => ctx.putImageData(imageData, 0, 0)
            };
        }

        // Hardware state
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorEnabled = false; // Hardware cursor flag
        this.currentFg = 15; // Default White
        this.currentBg = 0;  // Default Black
        
        // Physical memory pointers
        this.TEXT_VRAM_BASE = 0xB8000; // Segment B800:0000
        
        this.initPalette32();
        this.cls();
    }

    /**
     * Pre-calculates the 16-color EGA palette into 32-bit Little-Endian integers (AABBGGRR).
     * This saves thousands of bitwise operations per frame during rendering.
     */
    initPalette32() {
        const rawPalette = [
            [0,0,0],       [0,0,170],     [0,170,0],     [0,170,170],
            [170,0,0],     [170,0,170],   [170,85,0],    [170,170,170],
            [85,85,85],    [85,85,255],   [85,255,85],   [85,255,255],
            [255,85,85],   [255,85,255],  [255,255,85],  [255,255,255]
        ];

        this.palette32 = new Uint32Array(16);
        for (let i = 0; i < 16; i++) {
            const [r, g, b] = rawPalette[i];
            // Little Endian format: 0xAABBGGRR (Alpha is 255 = 0xFF)
            this.palette32[i] = (0xFF << 24) | (b << 16) | (g << 8) | r;
        }
    }

    color(fg, bg = this.currentBg) {
        this.currentFg = fg % 16;
        this.currentBg = bg % 16;
    }

    locate(row, col) {
        if (row !== null && row !== undefined) {
            const r = Math.floor(row); 
            if (r >= 1 && r <= this.rows) this.cursorY = r - 1;
        }
        if (col !== null && col !== undefined) {
            const c = Math.floor(col); 
            if (c >= 1 && c <= this.cols) this.cursorX = c - 1;
        }
    }

    showCursor() { this.cursorEnabled = true; }
    hideCursor() { this.cursorEnabled = false; }

    /**
     * Clears the Text Mode VRAM (0xB8000 to 0xB8FA0)
     */
    cls() {
        const attr = (this.currentBg << 4) | this.currentFg;
        const end = this.TEXT_VRAM_BASE + (this.rows * this.cols * 2);
        for (let addr = this.TEXT_VRAM_BASE; addr < end; addr += 2) {
            this.memory.ram[addr] = 32;      // Space character
            this.memory.ram[addr + 1] = attr; // Color attribute
        }
        this.cursorX = 0;
        this.cursorY = 0;
    }

    scrollUp() {
        // High-speed memory block transfer using TypedArrays
        const rowBytes = this.cols * 2;
        const totalBytes = this.rows * rowBytes;
        this.memory.ram.copyWithin(
            this.TEXT_VRAM_BASE,                  // Target: Line 0
            this.TEXT_VRAM_BASE + rowBytes,       // Source: Line 1
            this.TEXT_VRAM_BASE + totalBytes      // End of VRAM
        );

        // Clear the bottom line
        const attr = (this.currentBg << 4) | this.currentFg;
        const bottomLineAddr = this.TEXT_VRAM_BASE + totalBytes - rowBytes;
        for (let i = 0; i < rowBytes; i += 2) {
            this.memory.ram[bottomLineAddr + i] = 32;
            this.memory.ram[bottomLineAddr + i + 1] = attr;
        }
        this.cursorY = this.rows - 1;
    }

    /**
     * Prints raw bytes to the VRAM. Handles terminal control characters natively.
     * @param {Uint8Array|number[]} bytes 
     */
    print(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];

            // CR (Carriage Return)
            if (b === 13) {
                this.cursorX = 0;
            } 
            // LF (Line Feed)
            else if (b === 10) {
                this.cursorY++;
                if (this.cursorY >= this.rows) this.scrollUp();
            } 
            // Backspace
            else if (b === 8) {
                if (this.cursorX > 0) {
                    this.cursorX--;
                } else if (this.cursorY > 0) {
                    this.cursorX = this.cols - 1;
                    this.cursorY--;
                }
            } 
            // Standard Character Write
            else {
                if (this.cursorX >= this.cols) {
                    this.cursorX = 0;
                    this.cursorY++;
                    if (this.cursorY >= this.rows) this.scrollUp();
                }
                
                // Calculate physical VRAM address: 0xB8000 + (y * 80 + x) * 2
                const addr = this.TEXT_VRAM_BASE + (this.cursorY * this.cols + this.cursorX) * 2;
                
                // Write Character and Attribute directly to RAM
                this.memory.ram[addr] = b & 255;
                this.memory.ram[addr + 1] = (this.currentBg << 4) | this.currentFg;
                
                this.cursorX++;
            }
        }
    }

    /**
     * Rasterizer: Reads VRAM and blasts pixels to the 32-bit buffer.
     * Includes hardware-level cursor blinking.
     */
    render() {
        const buffer = this.display.pixelBuffer32;
        const screenWidth = this.display.width;
        let vramAddr = this.TEXT_VRAM_BASE;

        // Hardware blink logic (400ms interval)
        const showBlink = this.cursorEnabled && (Math.floor(Date.now() / 400) % 2 === 0);

        for (let ty = 0; ty < this.rows; ty++) {
            for (let tx = 0; tx < this.cols; tx++) {
                const charCode = this.memory.ram[vramAddr++];
                const attr = this.memory.ram[vramAddr++];
                
                let fg32 = this.palette32[attr & 0x0F];
                const bg32 = this.palette32[attr >> 4];
                
                const fontOffset = charCode * 16;
                const baseX = tx * this.charWidth;
                let baseY = ty * this.charHeight;

                const isCursorCell = showBlink && (tx === this.cursorX) && (ty === this.cursorY);

                for (let py = 0; py < this.charHeight; py++) {
                    let glyphRow = fontVGA[fontOffset + py];
                    
                    // Hardware Cursor drawing (usually lines 14 and 15)
                    if (isCursorCell && py >= 14) {
                        glyphRow = 0xFF; // Fill the entire scanline row
                        fg32 = this.palette32[this.currentFg]; 
                    }

                    let pixelIdx = (baseY * screenWidth) + baseX;

                    // Loop Unrolling: Write 8 pixels simultaneously for max performance
                    buffer[pixelIdx++] = (glyphRow & 128) ? fg32 : bg32;
                    buffer[pixelIdx++] = (glyphRow & 64) ? fg32 : bg32;
                    buffer[pixelIdx++] = (glyphRow & 32) ? fg32 : bg32;
                    buffer[pixelIdx++] = (glyphRow & 16) ? fg32 : bg32;
                    buffer[pixelIdx++] = (glyphRow & 8) ? fg32 : bg32;
                    buffer[pixelIdx++] = (glyphRow & 4) ? fg32 : bg32;
                    buffer[pixelIdx++] = (glyphRow & 2) ? fg32 : bg32;
                    buffer[pixelIdx++] = (glyphRow & 1) ? fg32 : bg32;
                    
                    baseY++;
                }
            }
        }
        this.display.commit();
    }
}