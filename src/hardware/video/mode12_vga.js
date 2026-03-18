// src/hardware/video/mode12_vga.js
import { fontVGA8x16 } from '../font.js';
import { GraphicsModeDriver } from './graphics_mode_driver.js';

/**
 * Concrete Driver for VGA Mode 12h (640x480, 16 colors).
 * Uses a simplified Linear Framebuffer (1 byte/pixel) mapped to 0xA0000.
 * Retains Planar formatting compatibility for QBasic GET/PUT sprite operations.
 */
export class Mode12VGA extends GraphicsModeDriver {
    constructor(memory) {
        super(memory);
        this.width = 640;
        this.height = 480;
        this.GRAPHICS_VRAM_BASE = 0xA0000;
        
        this.font = fontVGA8x16;
        this.charWidth = 8;
        this.charHeight = 16;
        this.cols = this.width / this.charWidth;   // 80 columns
        this.rows = this.height / this.charHeight; // 30 rows
        this.isPlanar = true; // Emulate EGA/VGA planar bit-packing for PUT/GET
        this.bpp = 4;         // 4 bits per pixel (16 colors)

        this.initPalette32();
    }

    initPalette32() {
        // Standard 16-color VGA Palette (same defaults as EGA)
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

    /**
     * Translates a QBasic PALETTE call into real hardware VGA 32-bit colors.
     * In VGA modes (like SCREEN 12), color is a 24-bit integer: &HBBGGRR (0-63 per channel).
     * @param {number} attribute - The color index to override (0-15)
     * @param {number} vgaColor - The physical VGA color value (0-4144959)
     */
    setPalette(attribute, vgaColor) {
        if (attribute > 15 || vgaColor < 0) return;

        // Decode VGA color format: Blue (16-23), Green (8-15), Red (0-7)
        let r6 = vgaColor & 0xFF;
        let g6 = (vgaColor >> 8) & 0xFF;
        let b6 = (vgaColor >> 16) & 0xFF;

        // Clamp to VGA 6-bit maximum (63)
        if (r6 > 63) r6 = 63;
        if (g6 > 63) g6 = 63;
        if (b6 > 63) b6 = 63;

        // Scale 6-bit (0-63) up to 8-bit (0-255) for modern Canvas rendering
        const r8 = Math.round((r6 / 63) * 255);
        const g8 = Math.round((g6 / 63) * 255);
        const b8 = Math.round((b6 / 63) * 255);

        this.palette32[attribute] = (0xFF << 24) | (b8 << 16) | (g8 << 8) | r8;
    }

    // --- LINEAR HARDWARE PRIMITIVES ---

    cls() {
        // 640*480 = 307,200 bytes. Fits perfectly in our 1MB RAM starting at 0xA0000.
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