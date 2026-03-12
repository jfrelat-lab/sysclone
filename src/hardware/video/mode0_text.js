// src/hardware/video/mode0_text.js
import { fontVGA8x16 } from '../font.js';
import { TextModeDriver } from './text_mode_driver.js';

/**
 * Concrete Driver for VGA Mode 0 (80x25 Text Mode, 16 Colors).
 * Translates CP437 character memory (0xB8000) into pixels using an 8x16 BIOS font.
 */
export class Mode0Text extends TextModeDriver {
    constructor(memory) {
        super(memory);
        this.font = fontVGA8x16;
        this.charWidth = 8;
        this.charHeight = 16;
        this.cols = 80;
        this.rows = 25;
        
        this.width = this.cols * this.charWidth;
        this.height = this.rows * this.charHeight;

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

    updatePalette(index, r6, g6, b6) {
        if (index > 15) return; 
        const r8 = Math.round((r6 / 63) * 255);
        const g8 = Math.round((g6 / 63) * 255);
        const b8 = Math.round((b6 / 63) * 255);
        this.palette32[index] = (0xFF << 24) | (b8 << 16) | (g8 << 8) | r8;
    }

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
                
                const fontOffset = charCode * this.charHeight;
                const baseX = tx * this.charWidth;
                let baseY = ty * this.charHeight;

                const isCursorCell = showBlink && (tx === this.cursorX) && (ty === this.cursorY);

                for (let py = 0; py < this.charHeight; py++) {
                    let glyphRow = this.font[fontOffset + py];
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