// src/hardware/vga.js
import { fontVGA } from './font.js';

/**
 * Emulates a VGA Text Mode controller (80x25) with pixel-perfect rendering.
 * Part of the Sysclone Hardware Abstraction Layer (HAL).
 */
export class VGA {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // VGA 80x25 standard metrics
        this.cols = 80;
        this.rows = 25;
        this.charWidth = 8;
        this.charHeight = 16;
        
        this.canvas.width = this.cols * this.charWidth;
        this.canvas.height = this.rows * this.charHeight;

        // Standard 16-color RGB Palette (CGA/VGA)
        this.palette = [
            [0,0,0],       [0,0,170],     [0,170,0],     [0,170,170],
            [170,0,0],     [170,0,170],   [170,85,0],    [170,170,170],
            [85,85,85],    [85,85,255],   [85,255,85],   [85,255,255],
            [255,85,85],   [255,85,255],  [255,255,85],  [255,255,255]
        ];

        this.cursorX = 0;
        this.cursorY = 0;
        this.currentFg = 15; // Default White
        this.currentBg = 0;  // Default Black

        // Virtual VRAM: Stores character codes and color attributes
        this.vram = Array(this.rows).fill(null).map(() => 
            Array(this.cols).fill(null).map(() => ({ charCode: 32, fg: 15, bg: 0 }))
        );

        // Pre-allocate ImageData buffer for direct pixel manipulation
        this.screenData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
        this.cls();
    }

    /**
     * Equivalent to QBasic command: COLOR fg, bg
     */
    color(fg, bg = this.currentBg) {
        this.currentFg = fg % 16;
        this.currentBg = bg % 16;
    }

    /**
     * Equivalent to QBasic command: LOCATE row, col
     */
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

    /**
     * Equivalent to QBasic command: CLS
     */
    cls() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.vram[y][x] = { charCode: 32, fg: this.currentFg, bg: this.currentBg };
            }
        }
        this.cursorX = 0;
        this.cursorY = 0;
    }

    /**
     * Equivalent to QBasic command: PRINT text
     */
    print(text) {
        for (let i = 0; i < text.length; i++) {
            if (this.cursorX >= this.cols) {
                this.cursorX = 0;
                this.cursorY++;
            }
            if (this.cursorY >= this.rows) this.scrollUp();
            
            const code = text.charCodeAt(i) & 255;
            this.vram[this.cursorY][this.cursorX] = {
                charCode: code,
                fg: this.currentFg,
                bg: this.currentBg
            };
            this.cursorX++;
        }
    }

    /**
     * Scrolls the screen content up by one row.
     */
    scrollUp() {
        this.vram.shift();
        this.vram.push(Array(this.cols).fill(null).map(() => ({ charCode: 32, fg: this.currentFg, bg: this.currentBg })));
        this.cursorY = this.rows - 1;
    }

    /**
     * Renders the VRAM content to the canvas using bitwise font manipulation.
     * This achieves high-fidelity, pixel-perfect output.
     */
    render() {
        const data = this.screenData.data;
        const width = this.canvas.width;

        for (let ty = 0; ty < this.rows; ty++) {
            for (let tx = 0; tx < this.cols; tx++) {
                const cell = this.vram[ty][tx];
                const fgRGB = this.palette[cell.fg];
                const bgRGB = this.palette[cell.bg];
                
                const charOffset = cell.charCode * 16;

                // Loop through character scanlines (16 pixels high)
                for (let py = 0; py < this.charHeight; py++) {
                    const glyphRow = fontVGA[charOffset + py];
                    
                    // Loop through character bits (8 pixels wide)
                    for (let px = 0; px < this.charWidth; px++) {
                        const isForeground = (glyphRow & (1 << (7 - px))) !== 0;
                        const color = isForeground ? fgRGB : bgRGB;

                        const screenX = (tx * this.charWidth) + px;
                        const screenY = (ty * this.charHeight) + py;
                        const screenIndex = (screenY * width + screenX) * 4;

                        data[screenIndex] = color[0];     // Red
                        data[screenIndex + 1] = color[1]; // Green
                        data[screenIndex + 2] = color[2]; // Blue
                        data[screenIndex + 3] = 255;      // Alpha (Opaque)
                    }
                }
            }
        }
        this.ctx.putImageData(this.screenData, 0, 0);
    }
}