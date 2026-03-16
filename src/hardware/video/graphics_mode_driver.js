// src/hardware/video/graphics_mode_driver.js
import { VideoDriver } from './video_driver.js';

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
                const fontOffset = b * this.charHeight;
                const px = this.cursorX * this.charWidth;
                const py = this.cursorY * this.charHeight; 

                if (py < this.height && this.font) {
                    for (let y = 0; y < this.charHeight; y++) {
                        const glyphRow = this.font[fontOffset + y];
                        for (let x = 0; x < this.charWidth; x++) {
                            const isPixel = glyphRow & (128 >> x);
                            if (isPixel) {
                                this.pset(px + x, py + y, this.currentFg);
                            } else {
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

/**
     * Draws a circle, arc, or ellipse using a 4-Connected Midpoint Algorithm.
     * Prevents Moire pattern gaps in concentric loops (fixes Gorillas' background bleeding).
     */
    circle(x, y, radius, color, start, end, aspect) {
        const finalColor = color !== null ? color : this.currentFg;
        const cx = Math.floor(x);
        const cy = Math.floor(y);
        const r = Math.floor(radius);
        
        if (r <= 0) {
            if (r === 0) this.pset(cx, cy, finalColor);
            return;
        }

        const isArc = start !== null && end !== null;
        const sAngle = start !== null ? Math.abs(start) : 0;
        const eAngle = end !== null ? Math.abs(end) : Math.PI * 2;
        
        // --- Aspect Ratio Normalization & QBasic Quirks ---
        let finalAspect = aspect;
        if (finalAspect === null || finalAspect === undefined) {
            finalAspect = (4.0 * this.height) / (3.0 * this.width);
        }
        if (finalAspect < 0) {
            finalAspect = 1.0 / Math.abs(finalAspect);
        } else {
            finalAspect = Math.abs(finalAspect);
        }
        if (finalAspect === 0) finalAspect = 1.0; 
        
        const a = Math.max(0, Math.round(finalAspect <= 1 ? r : r / finalAspect));
        const b = Math.max(0, Math.round(finalAspect <= 1 ? r * finalAspect : r));
        const scaleX = a > 0 ? a : 1;
        const scaleY = b > 0 ? b : 1;

        const plotIfInArc = (ox, oy) => {
            if (isArc) {
                let angle = Math.atan2(-oy / scaleY, ox / scaleX);
                if (angle < 0) angle += Math.PI * 2; 
                let inArc = false;
                if (sAngle <= eAngle) {
                    inArc = (angle >= sAngle && angle <= eAngle);
                } else {
                    inArc = (angle >= sAngle || angle <= eAngle);
                }
                if (inArc) this.pset(cx + ox, cy + oy, finalColor);
            } else {
                this.pset(cx + ox, cy + oy, finalColor);
            }
        };

        const plot4Way = (ox, oy) => {
            plotIfInArc(ox, oy);
            if (ox !== 0) plotIfInArc(-ox, oy);
            if (oy !== 0) plotIfInArc(ox, -oy);
            if (ox !== 0 && oy !== 0) plotIfInArc(-ox, -oy);
        };

        // Ghost collision prevention for concentric erasing loops
        if (r <= 1) this.pset(cx, cy, finalColor); 

        // --- 4-Connected Midpoint Ellipse Algorithm ---
        let currX = 0;
        let currY = b;
        let a2 = a * a;
        let b2 = b * b;
        let err1 = b2 - (a2 * b) + (0.25 * a2);
        
        let px = 0;
        let py = 2 * a2 * currY;

        while (px < py) {
            plot4Way(currX, currY);
            currX++;
            px += 2 * b2;
            if (err1 < 0) {
                err1 += b2 + px;
            } else {
                plot4Way(currX, currY); // 4-connected filler pixel
                currY--;
                py -= 2 * a2;
                err1 += b2 + px - py;
            }
        }

        let err2 = b2 * (currX + 0.5) * (currX + 0.5) + a2 * (currY - 1) * (currY - 1) - a2 * b2;
        while (currY >= 0) {
            plot4Way(currX, currY);
            currY--;
            py -= 2 * a2;
            if (err2 > 0) {
                err2 += a2 - py;
            } else {
                plot4Way(currX, currY); // 4-connected filler pixel
                currX++;
                px += 2 * b2;
                err2 += a2 - py + px;
            }
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

    /**
     * Captures a rectangular area of the screen and packs it into a QArray.
     * Automatically adapts to the hardware architecture (Planar EGA vs Linear VGA).
     */
    getGraphics(x1, y1, x2, y2, qArray, startIndex = 0) {
        if (!qArray || typeof qArray.set !== 'function') return;

        const minX = Math.round(Math.min(x1, x2)), maxX = Math.round(Math.max(x1, x2));
        const minY = Math.round(Math.min(y1, y2)), maxY = Math.round(Math.max(y1, y2));
        const w = (maxX - minX) + 1;
        const h = (maxY - minY) + 1;

        // QBasic x86 Little-Endian Header:
        // Low Word (0xFFFF) = Width in bits
        // High Word (>> 16) = Height in pixels
        qArray.set([startIndex], (h << 16) | w);
        let idx = startIndex + 1;

        if (this.isPlanar) {
            // --- EGA PLANAR FORMAT (Mode 9) ---
            let currentLong = 0;
            let byteShift = 0;
            const bytesPerPlane = Math.ceil(w / 8);

            for (let y = 0; y < h; y++) {
                for (let plane = 0; plane < 4; plane++) {
                    for (let b = 0; b < bytesPerPlane; b++) {
                        let byteVal = 0;
                        for (let bit = 0; bit < 8; bit++) {
                            const px = b * 8 + bit;
                            if (px < w) {
                                const color = this.getPixel(minX + px, minY + y) & 15;
                                if ((color & (1 << plane)) !== 0) {
                                    byteVal |= (128 >> bit); // MSB to LSB packing
                                }
                            }
                        }
                        currentLong |= (byteVal << byteShift);
                        byteShift += 8;
                        if (byteShift >= 32) {
                            qArray.set([idx++], currentLong);
                            currentLong = 0;
                            byteShift = 0;
                        }
                    }
                }
            }
            if (byteShift > 0) qArray.set([idx], currentLong);
            
        } else {
            // --- VGA LINEAR FORMAT (Mode 13) ---
            let currentVal = 0;
            let shift = 0;
            const bpp = this.bpp || 4; 
            const mask = (1 << bpp) - 1;

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const color = this.getPixel(x, y);
                    const safeColor = color === -1 ? 0 : (color & mask);
                    
                    currentVal |= (safeColor << shift);
                    shift += bpp;

                    if (shift >= 32) {
                        qArray.set([idx++], currentVal);
                        shift = 0;
                        currentVal = 0;
                    }
                }
            }
            if (shift > 0) qArray.set([idx], currentVal);
        }
    }

    /**
     * Unpacks and renders an array of pixels to the screen.
     * Automatically decodes EGA Planar or VGA Linear formats natively.
     */
    putGraphics(x, y, qArray, startIndex = 0, action = 'XOR') {
        if (!qArray || typeof qArray.get !== 'function') return;

        const header = qArray.get([startIndex]) || 0;
        
        // Extract dimensions from the QBasic Little-Endian header
        const w = header & 0xFFFF;           // Low word is Width
        const h = (header >> 16) & 0xFFFF;   // High word is Height
        
        if (w === 0 || h === 0) return;

        const drawX = Math.round(x);
        const drawY = Math.round(y);

        let idx = startIndex + 1;

        if (this.isPlanar) {
            // --- EGA PLANAR FORMAT DECODING (Mode 9) ---
            let currentLong = qArray.get([idx]) || 0;
            let byteShift = 0;
            const bytesPerPlane = Math.ceil(w / 8);

            for (let py = 0; py < h; py++) {
                let lineData = []; 
                for (let plane = 0; plane < 4; plane++) {
                    let planeBytes = [];
                    for (let b = 0; b < bytesPerPlane; b++) {
                        // LAZY LOADING
                        if (byteShift >= 32) {
                            idx++;
                            currentLong = qArray.get([idx]) || 0;
                            byteShift = 0;
                        }
                        
                        planeBytes.push((currentLong >> byteShift) & 0xFF);
                        byteShift += 8;
                    }
                    lineData.push(planeBytes);
                }

                // Render the combined planes
                for (let px = 0; px < w; px++) {
                    const b = Math.floor(px / 8);
                    const bit = px % 8;
                    const mask = 128 >> bit;
                    
                    let color = 0;
                    if (lineData[0][b] & mask) color |= 1; // Blue
                    if (lineData[1][b] & mask) color |= 2; // Green
                    if (lineData[2][b] & mask) color |= 4; // Red
                    if (lineData[3][b] & mask) color |= 8; // Intensity

                    this._plotAction(drawX + px, drawY + py, color, action);
                }
            }
        } else {
            // --- VGA LINEAR FORMAT DECODING (Mode 13) ---
            let shift = 0;
            let currentVal = qArray.get([idx]) || 0;
            const bpp = this.bpp || 4;
            const mask = (1 << bpp) - 1;

            for (let py = 0; py < h; py++) {
                for (let px = 0; px < w; px++) {
                    // LAZY LOADING
                    if (shift >= 32) {
                        idx++;
                        currentVal = qArray.get([idx]) || 0;
                        shift = 0;
                    }
                    
                    const color = (currentVal >> shift) & mask;
                    shift += bpp;

                    this._plotAction(drawX + px, drawY + py, color, action);
                }
            }
        }
    }

    /**
     * Internal helper to apply blending modes (XOR, PSET, AND, OR, PRESET)
     * during a PUT operation.
     * @private
     */
    _plotAction(screenX, screenY, color, action) {
        let outColor = color;
        const colorMask = (1 << (this.bpp || 4)) - 1;

        if (action === 'PSET') {
            outColor = color;
        } else if (action === 'PRESET') {
            outColor = (~color) & colorMask;
        } else {
            const bg = this.getPixel(screenX, screenY);
            const safeBg = bg === -1 ? 0 : bg;
            
            if (action === 'AND') outColor = safeBg & color;
            else if (action === 'OR') outColor = safeBg | color;
            else outColor = safeBg ^ color; // XOR is the standard QBasic default
        }
        
        this.pset(screenX, screenY, outColor);
    }
}