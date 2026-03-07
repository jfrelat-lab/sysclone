// src/hardware/video/text_mode_driver.js
import { VideoDriver } from './video_driver.js';

/**
 * Abstract Driver for MS-DOS Text Modes (e.g., Mode 0, Mode 1, Mode 3).
 * Manages standard 2-byte VRAM attributes (Char + Color) and terminal logic.
 * @abstract
 */
export class TextModeDriver extends VideoDriver {
    constructor(memory) {
        super(memory);
        if (new.target === TextModeDriver) {
            throw new TypeError("Cannot construct Abstract instances of TextModeDriver directly.");
        }
        this.cols = 80;
        this.rows = 25;
        this.cursorX = 0;
        this.cursorY = 0;
        this.currentFg = 15;
        this.currentBg = 0;
        this.cursorEnabled = false;
        this.TEXT_VRAM_BASE = 0xB8000;
    }

    color(fg, bg = this.currentBg) {
        if (fg !== null) this.currentFg = fg % 16;
        if (bg !== null) this.currentBg = bg % 16;
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

    cls() {
        const attr = (this.currentBg << 4) | this.currentFg;
        const end = this.TEXT_VRAM_BASE + (this.rows * this.cols * 2);
        for (let addr = this.TEXT_VRAM_BASE; addr < end; addr += 2) {
            this.memory.ram[addr] = 32;     // Space character
            this.memory.ram[addr + 1] = attr; // Color attribute
        }
        this.cursorX = 0;
        this.cursorY = 0;
    }

    scrollUp() {
        const rowBytes = this.cols * 2;
        const totalBytes = this.rows * rowBytes;
        // Fast memory move for scrolling
        this.memory.ram.copyWithin(
            this.TEXT_VRAM_BASE,
            this.TEXT_VRAM_BASE + rowBytes,
            this.TEXT_VRAM_BASE + totalBytes
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

    print(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            if (b === 13) this.cursorX = 0;
            else if (b === 10) {
                this.cursorY++;
                if (this.cursorY >= this.rows) this.scrollUp();
            } else if (b === 8) {
                if (this.cursorX > 0) this.cursorX--;
                else if (this.cursorY > 0) {
                    this.cursorX = this.cols - 1;
                    this.cursorY--;
                }
            } else {
                if (this.cursorX >= this.cols) {
                    this.cursorX = 0;
                    this.cursorY++;
                    if (this.cursorY >= this.rows) this.scrollUp();
                }
                const addr = this.TEXT_VRAM_BASE + (this.cursorY * this.cols + this.cursorX) * 2;
                this.memory.ram[addr] = b & 255;
                this.memory.ram[addr + 1] = (this.currentBg << 4) | this.currentFg;
                this.cursorX++;
            }
        }
    }
}