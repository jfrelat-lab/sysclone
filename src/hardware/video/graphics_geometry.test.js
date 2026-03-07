// src/hardware/video/graphics_geometry.test.js
import { Mode13Linear } from './mode13_linear.js';
import { Mode9EGA } from './mode9_ega.js';
import { test, assertEqual, registerSuite } from '../../test_runner.js';

class MockMemory {
    constructor() {
        this.ram = new Uint8Array(1024 * 1024); // 1MB Virtual RAM
    }
}

/**
 * Factory function to generate a test suite for ANY graphics driver.
 * It verifies that the base algorithms in GraphicsModeDriver work correctly
 * regardless of the underlying memory mapping (Linear, Planar, etc.).
 */
function registerGeometrySuite(modeName, DriverClass) {
    registerSuite(`Graphics Algorithms (${modeName})`, () => {

        let mem;
        let vga;

        // Helper to setup a fresh VGA state for each test
        const setupVGA = () => {
            mem = new MockMemory();
            vga = new DriverClass(mem);
            vga.cls(); // Ensure clean VRAM
        };

        // --- LINE ALGORITHMS ---

        test('LINE should draw horizontal and diagonal lines using Bresenham', () => {
            setupVGA();
            
            // Horizontal line, color 10
            vga.line(0, 0, 5, 0, 10, null); 
            
            // We now use the driver's own getPixel to abstract away the memory layout
            assertEqual(vga.getPixel(0, 0), 10);
            assertEqual(vga.getPixel(3, 0), 10);
            assertEqual(vga.getPixel(5, 0), 10);
            assertEqual(vga.getPixel(6, 0), 0); // Out of bounds or empty

            vga.cls();
            
            // Diagonal line, color 14
            vga.line(0, 0, 3, 3, 14, null); 
            assertEqual(vga.getPixel(0, 0), 14);
            assertEqual(vga.getPixel(2, 2), 14);
            assertEqual(vga.getPixel(0, 1), 0); // Off-axis pixel
        });

        test('LINE should draw a filled box when BF flag is used', () => {
            setupVGA();
            
            // 3x3 filled box, color 5
            vga.line(10, 10, 12, 12, 5, 'BF'); 
            
            assertEqual(vga.getPixel(10, 10), 5); // Top-Left corner
            assertEqual(vga.getPixel(12, 12), 5); // Bottom-Right corner
            assertEqual(vga.getPixel(11, 11), 5); // Center pixel
            assertEqual(vga.getPixel(9, 9), 0);   // Outside pixel
        });

        test('LINE should draw a hollow box when B flag is used', () => {
            setupVGA();
            
            // 3x3 hollow box, color 3
            vga.line(20, 20, 22, 22, 3, 'B'); 
            
            assertEqual(vga.getPixel(20, 20), 3); // Border Top-Left
            assertEqual(vga.getPixel(22, 22), 3); // Border Bottom-Right
            assertEqual(vga.getPixel(21, 20), 3); // Border Top-Middle
            assertEqual(vga.getPixel(21, 21), 0); // Center MUST be empty (0)
        });

        // --- CIRCLE ALGORITHM ---

        test('CIRCLE should draw a midpoint circle leaving the center empty', () => {
            setupVGA();
            
            // Circle radius 5, color 9
            vga.circle(20, 20, 5, 9, null, null, null); 
            
            assertEqual(vga.getPixel(20, 20), 0); // Center should remain 0
            assertEqual(vga.getPixel(20, 15), 9); // Top edge pixel
            assertEqual(vga.getPixel(20, 25), 9); // Bottom edge pixel
            assertEqual(vga.getPixel(15, 20), 9); // Left edge pixel
            assertEqual(vga.getPixel(25, 20), 9); // Right edge pixel
        });

        // --- PAINT (FLOOD FILL) ALGORITHM ---

        test('PAINT should perform a flood fill bounded by a specific color', () => {
            setupVGA();
            
            // Draw a boundary hollow box (color 1) from (30,30) to (34,34)
            vga.line(30, 30, 34, 34, 1, 'B'); 
            
            // Fill the inside with color 2, stopping at boundary color 1
            vga.paint(32, 32, 2, 1);
            
            assertEqual(vga.getPixel(30, 30), 1); // Boundary should remain color 1
            assertEqual(vga.getPixel(32, 32), 2); // Inside should be filled with 2
            assertEqual(vga.getPixel(29, 29), 0); // Outside should remain untouched (0)
        });
    });
}

// Run the full geometry suite against ALL our graphics drivers!
registerGeometrySuite('Mode 13h Linear', Mode13Linear);
registerGeometrySuite('Mode 9 EGA', Mode9EGA);