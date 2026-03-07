// src/hardware/video/graphics_mode_driver.js
import { VideoDriver } from './video_driver.js';
import { fontVGA8x8 } from '../font.js';

/**
 * Abstract Driver for MS-DOS Graphics Modes (e.g., Mode 13, Mode 9, Mode 7).
 * Implements Template Method Pattern: defines complex rasterization algorithms 
 * (Bresenham, Flood Fill, Text Overlay) that rely entirely on the child class 
 * implementing two primitive operations: pset() and getPixel().
 * @abstract
 */
export class GraphicsModeDriver extends VideoDriver {
    constructor(memory) {
        super(memory);
        if (new.target === GraphicsModeDriver) {
            throw new TypeError("Cannot construct Abstract instances of GraphicsModeDriver directly.");
        }
        this.cols = 40;
        this.rows = 25;
        this.cursorX = 0;
        this.cursorY = 0;
        this.currentFg = 15;
        this.currentBg = 0;
    }

    // --- TEMPLATE PRIMITIVES (To be implemented by child classes) ---

    pset(x, y, color) { 
        throw new Error("pset() must be implemented by concrete Graphics Driver."); 
    }
    
    getPixel(x, y) { 
        throw new Error("getPixel() must be implemented by concrete Graphics Driver."); 
    }

    // --- SHARED GRAPHICS ALGORITHMS ---

    color(fg, bg = this.currentBg) {
        if (fg !== null) this.currentFg = fg % 256;
        if (bg !== null) this.currentBg = bg % 256;
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

    print(bytes) {
        for (let i = 0; i < bytes.length; i++) {
            const b = bytes[i];
            if (b === 13) {
                this.cursorX = 0;
            } else if (b === 10) {
                this.cursorY++;
            } else if (b === 8) {
                if (this.cursorX > 0) this.cursorX--;
            } else {
                if (this.cursorX >= this.cols) {
                    this.cursorX = 0;
                    this.cursorY++;
                }
                const fontOffset = b * 8;
                const px = this.cursorX * 8;
                const py = this.cursorY * 8; 

                if (py < this.height) {
                    for (let y = 0; y < 8; y++) {
                        const glyphRow = fontVGA8x8[fontOffset + y];
                        for (let x = 0; x < 8; x++) {
                            const isPixel = glyphRow & (128 >> x);
                            if (isPixel) {
                                this.pset(px + x, py + y, this.currentFg);
                            } else if (this.currentBg !== 0) { 
                                this.pset(px + x, py + y, this.currentBg);
                            }
                        }
                    }
                }
                this.cursorX++;
            }
        }
    }

    line(x1, y1, x2, y2, color, box) {
        const finalColor = color !== null ? color : this.currentFg;
        let x0 = Math.floor(x1), y0 = Math.floor(y1);
        let xEnd = Math.floor(x2), yEnd = Math.floor(y2);

        if (box === 'BF' || box === 'B') {
            const minX = Math.min(x0, xEnd), maxX = Math.max(x0, xEnd);
            const minY = Math.min(y0, yEnd), maxY = Math.max(y0, yEnd);
            
            if (box === 'BF') {
                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        this.pset(x, y, finalColor);
                    }
                }
            } else {
                this.line(minX, minY, maxX, minY, finalColor, null);
                this.line(minX, maxY, maxX, maxY, finalColor, null);
                this.line(minX, minY, minX, maxY, finalColor, null);
                this.line(maxX, minY, maxX, maxY, finalColor, null);
            }
            return;
        }

        const dx = Math.abs(xEnd - x0);
        const sx = x0 < xEnd ? 1 : -1;
        const dy = -Math.abs(yEnd - y0);
        const sy = y0 < yEnd ? 1 : -1;
        let err = dx + dy;
        let e2;

        while (true) {
            this.pset(x0, y0, finalColor);
            if (x0 === xEnd && y0 === yEnd) break;
            e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }

    circle(x, y, radius, color, start, end, aspect) {
        const finalColor = color !== null ? color : this.currentFg;
        const cx = Math.floor(x);
        const cy = Math.floor(y);
        const r = Math.floor(radius);
        
        const isArc = start !== null && end !== null;
        let sAngle = start !== null ? Math.abs(start) : 0;
        let eAngle = end !== null ? Math.abs(end) : Math.PI * 2;
        
        if (sAngle > eAngle) {
            const temp = sAngle; sAngle = eAngle; eAngle = temp + (Math.PI * 2);
        }

        let offsetX = 0;
        let offsetY = r;
        let d = 3 - 2 * r;

        const plotIfInArc = (px, py) => {
            if (isArc) {
                let angle = Math.atan2(cy - py, px - cx);
                if (angle < 0) angle += Math.PI * 2;
                if (angle >= sAngle && angle <= eAngle) {
                    this.pset(px, py, finalColor);
                }
            } else {
                this.pset(px, py, finalColor);
            }
        };

        while (offsetX <= offsetY) {
            plotIfInArc(cx + offsetX, cy + offsetY);
            plotIfInArc(cx - offsetX, cy + offsetY);
            plotIfInArc(cx + offsetX, cy - offsetY);
            plotIfInArc(cx - offsetX, cy - offsetY);
            plotIfInArc(cx + offsetY, cy + offsetX);
            plotIfInArc(cx - offsetY, cy + offsetX);
            plotIfInArc(cx + offsetY, cy - offsetX);
            plotIfInArc(cx - offsetY, cy - offsetX);

            if (d <= 0) {
                d += 4 * offsetX + 6;
            } else {
                d += 4 * (offsetX - offsetY) + 10;
                offsetY--;
            }
            offsetX++;
        }
    }

    paint(x, y, paintColor, borderColor) {
        const finalColor = paintColor !== null ? paintColor : this.currentFg;
        const boundColor = borderColor !== null ? borderColor : finalColor;
        
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        
        const targetColor = this.getPixel(startX, startY);
        if (targetColor === finalColor || targetColor === boundColor || targetColor === -1) return;

        const stack = [startX, startY];

        while (stack.length > 0) {
            const cy = stack.pop();
            const cx = stack.pop();

            if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) continue;

            const current = this.getPixel(cx, cy);
            if (current !== boundColor && current !== finalColor && current !== -1) {
                this.pset(cx, cy, finalColor);
                stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
            }
        }
    }
}