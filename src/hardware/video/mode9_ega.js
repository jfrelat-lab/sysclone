// src/hardware/video/mode9_ega.js
import { GraphicsModeDriver } from './graphics_mode_driver.js';

/**
 * Simplified Concrete Driver for EGA Mode 9 (640x350, 16 colors).
 * Note: Temporarily uses a Linear Framebuffer (1 byte/pixel) instead of true EGA Bitplanes
 * for performance and simplicity while retaining perfect geometric resolution.
 */
export class Mode9EGA extends GraphicsModeDriver {
    constructor(memory) {
        super(memory);
        this.width = 640;
        this.height = 350;
        this.GRAPHICS_VRAM_BASE = 0xA0000;
        
        // Using an 8x8 font on a 640x350 screen gives an 80x43 text grid
        this.cols = 80;
        this.rows = 43;

        this.initPalette32();
    }

    initPalette32() {
        // Standard 16-color CGA/EGA Palette
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

    // --- LINEAR HARDWARE PRIMITIVES (Simplified EGA) ---

    cls() {
        // Note: 640*350 = 224,000 bytes. This technically overflows the standard 64KB VGA window,
        // but works flawlessly in our emulator's flat 1MB RAM model.
        const end = this.GRAPHICS_VRAM_BASE + (this.width * this.height);
        this.memory.ram.fill(this.currentBg & 15, this.GRAPHICS_VRAM_BASE, end);
        this.cursorX = 0;
        this.cursorY = 0;
    }

    render(display) {
        const buffer = display.pixelBuffer32;
        let vramAddr = this.GRAPHICS_VRAM_BASE;
        const totalPixels = this.width * this.height;
        for (let i = 0; i < totalPixels; i++) {
            // Ensure color index stays within 0-15 bounds
            buffer[i] = this.palette32[this.memory.ram[vramAddr++] & 15];
        }
    }

    getPixel(x, y) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        if (px < 0 || px >= this.width || py < 0 || py >= this.height) return -1;
        return this.memory.ram[this.GRAPHICS_VRAM_BASE + (py * this.width) + px] & 15;
    }

    pset(x, y, color) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;
        
        const finalColor = color !== null && color !== undefined ? color : this.currentFg;
        const addr = this.GRAPHICS_VRAM_BASE + (py * this.width) + px;
        this.memory.ram[addr] = finalColor & 15; // Strict 16-color masking
    }
}