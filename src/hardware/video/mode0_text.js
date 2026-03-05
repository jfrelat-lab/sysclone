// src/hardware/video/mode0_text.js
import { fontVGA8x16 } from '../font.js';
import { VideoDriver } from './video_driver.js';

export class Mode0Text extends VideoDriver {
    constructor(memory) {
        super(memory);
        this.memory = memory;
        this.cols = 80;
        this.rows = 25;
        this.charWidth = 8;
        this.charHeight = 16;
        
        this.width = this.cols * this.charWidth;
        this.height = this.rows * this.charHeight;

        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorEnabled = false;
        this.currentFg = 15;
        this.currentBg = 0;
        
        this.TEXT_VRAM_BASE = 0xB8000;
        this.initPalette32();
    }

    initPalette32() {
        const rawPalette = [
            [0,0,0], [0,0,170], [0,170,0], [0,170,170],
            [170,0,0], [170,0,170], [170,85,0], [170,170,170],
            [85,85,85], [85,85,255], [85,255,85], [85,255,255],
            [255,85,85], [255,85,255], [255,255,85], [255,255,255]
        ];
        this.palette32 = new Uint32Array(16);
        for (let i = 0; i < 16; i++) {
            const [r, g, b] = rawPalette[i];
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

    cls() {
        const attr = (this.currentBg << 4) | this.currentFg;
        const end = this.TEXT_VRAM_BASE + (this.rows * this.cols * 2);
        for (let addr = this.TEXT_VRAM_BASE; addr < end; addr += 2) {
            this.memory.ram[addr] = 32;     
            this.memory.ram[addr + 1] = attr; 
        }
        this.cursorX = 0;
        this.cursorY = 0;
    }

    scrollUp() {
        const rowBytes = this.cols * 2;
        const totalBytes = this.rows * rowBytes;
        this.memory.ram.copyWithin(
            this.TEXT_VRAM_BASE,
            this.TEXT_VRAM_BASE + rowBytes,
            this.TEXT_VRAM_BASE + totalBytes
        );
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

    pset(x, y, color) { /* Ignored in Text Mode */ }

    render(display) {
        const buffer = display.pixelBuffer32;
        const screenWidth = display.width;
        let vramAddr = this.TEXT_VRAM_BASE;
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
                    let glyphRow = fontVGA8x16[fontOffset + py];
                    if (isCursorCell && py >= 14) {
                        glyphRow = 0xFF; 
                        fg32 = this.palette32[this.currentFg]; 
                    }
                    let pixelIdx = (baseY * screenWidth) + baseX;
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
    }
}