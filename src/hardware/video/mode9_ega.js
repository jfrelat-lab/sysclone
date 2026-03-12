// src/hardware/video/mode9_ega.js
import { fontVGA8x14 } from '../font.js';
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
        
        this.font = fontVGA8x14;
        this.charWidth = 8;
        this.charHeight = 14;
        this.cols = this.width / this.charWidth;
        this.rows = this.height / this.charHeight;
        this.isPlanar = true; // EGA uses 4-bit Planar formatting for GET/PUT
        this.bpp = 4;         // 4 bits per pixel

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

    /**
     * Translates a QBasic PALETTE call into real hardware EGA 32-bit colors.
     * The EGA color palette uses a 6-bit format (0-63): rgbRGB.
     * @param {number} attribute - The color index to override (0-15)
     * @param {number} egaColor - The physical EGA color value (0-63)
     */
    setPalette(attribute, egaColor) {
        if (attribute > 15 || egaColor < 0 || egaColor > 63) return;
        
        // Decode 6-bit EGA hardware color format (bits: 5=r, 4=g, 3=b, 2=R, 1=G, 0=B)
        const r = ((egaColor & 32) ? 0x55 : 0) + ((egaColor & 4) ? 0xAA : 0);
        const g = ((egaColor & 16) ? 0x55 : 0) + ((egaColor & 2) ? 0xAA : 0);
        const b = ((egaColor & 8)  ? 0x55 : 0) + ((egaColor & 1) ? 0xAA : 0);

        // Update the 32-bit rendering palette (AABBGGRR)
        this.palette32[attribute] = (0xFF << 24) | (b << 16) | (g << 8) | r;
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