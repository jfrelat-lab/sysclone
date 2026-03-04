// src/hardware/video/Mode13Linear.js
import { VideoDriver } from './video_driver.js';

export class Mode13Linear extends VideoDriver {
    constructor(memory) {
        super(memory);
        this.memory = memory;
        this.width = 320;
        this.height = 200;
        this.GRAPHICS_VRAM_BASE = 0xA0000;
        this.initPalette32();
    }

    initPalette32() {
        this.palette32 = new Uint32Array(256);
        const setCol = (i, r, g, b) => {
            this.palette32[i] = (0xFF << 24) | (b << 16) | (g << 8) | r;
        };

        const ega = [
            [0,0,0], [0,0,170], [0,170,0], [0,170,170],
            [170,0,0], [170,0,170], [170,85,0], [170,170,170],
            [85,85,85], [85,85,255], [85,255,85], [85,255,255],
            [255,85,85], [255,85,255], [255,255,85], [255,255,255]
        ];
        for (let i = 0; i < 16; i++) setCol(i, ega[i][0], ega[i][1], ega[i][2]);
        for (let i = 16; i < 32; i++) {
            const val = Math.floor((i - 16) * (255 / 15));
            setCol(i, val, val, val);
        }
        for (let i = 32; i < 256; i++) {
            const r = ((i >> 5) & 7) * 36;
            const g = ((i >> 2) & 7) * 36;
            const b = (i & 3) * 85;
            setCol(i, r, g, b);
        }
    }

    cls() {
        const end = this.GRAPHICS_VRAM_BASE + (this.width * this.height);
        this.memory.ram.fill(0, this.GRAPHICS_VRAM_BASE, end);
    }

    pset(x, y, color) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;
        const addr = this.GRAPHICS_VRAM_BASE + (py * this.width) + px;
        this.memory.ram[addr] = color & 255;
    }

    // Hardware stubs for text commands sent while in graphics mode
    print(bytes) { /* TODO: Draw text pixels using fontROM in graphics mode */ }
    locate(row, col) {}
    color(fg, bg) {}
    showCursor() {}
    hideCursor() {}

    render(display) {
        const buffer = display.pixelBuffer32;
        let vramAddr = this.GRAPHICS_VRAM_BASE;
        const totalPixels = this.width * this.height;
        
        for (let i = 0; i < totalPixels; i++) {
            const colorIndex = this.memory.ram[vramAddr++];
            buffer[i] = this.palette32[colorIndex];
        }
    }
}