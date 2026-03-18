// src/hardware/video/graphics_geometry.test.js
import { Mode13Linear } from './mode13_linear.js';
import { Mode9EGA } from './mode9_ega.js';
import { Mode12VGA } from './mode12_vga.js';
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
            
            // Circle radius 5, color 9. Force aspect to 1.0 to bypass default screen ratio.
            vga.circle(20, 20, 5, 9, null, null, 1.0); 
            
            assertEqual(vga.getPixel(20, 20), 0); // Center should remain 0
            assertEqual(vga.getPixel(20, 15), 9); // Top edge pixel
            assertEqual(vga.getPixel(20, 25), 9); // Bottom edge pixel
            assertEqual(vga.getPixel(15, 20), 9); // Left edge pixel
            assertEqual(vga.getPixel(25, 20), 9); // Right edge pixel
        });

        test('CIRCLE should draw partial arcs correctly, including crossing 0 radians', () => {
            setupVGA();
            
            // Note on Coordinates for Radius 5 at Center (20, 20):
            // Right  (25, 20) -> Angle: 0
            // Top    (20, 15) -> Angle: PI/2 (90 deg)
            // Left   (15, 20) -> Angle: PI (180 deg)
            // Bottom (20, 25) -> Angle: 3*PI/2 (270 deg)

            // 1. Normal Arc (Top-Left quadrant: 90 to 180 degrees)
            // start < end. Force aspect to 1.0.
            vga.circle(20, 20, 5, 10, Math.PI / 2, Math.PI, 1.0);
            
            assertEqual(vga.getPixel(20, 15), 10, "Normal Arc: Top edge should be drawn");
            assertEqual(vga.getPixel(15, 20), 10, "Normal Arc: Left edge should be drawn");
            assertEqual(vga.getPixel(25, 20), 0,  "Normal Arc: Right edge should be empty");
            assertEqual(vga.getPixel(20, 25), 0,  "Normal Arc: Bottom edge should be empty");

            vga.cls();

            // 2. QBasic Special Arc crossing 0 radians (Right half: 270 to 90 degrees)
            // start > end -> Triggers the logical OR in the drawing algorithm. Force aspect 1.0.
            vga.circle(20, 20, 5, 11, 3 * Math.PI / 2, Math.PI / 2, 1.0);
            
            assertEqual(vga.getPixel(20, 25), 11, "0-Cross Arc: Bottom edge should be drawn");
            assertEqual(vga.getPixel(25, 20), 11, "0-Cross Arc: Right edge should be drawn");
            assertEqual(vga.getPixel(20, 15), 11, "0-Cross Arc: Top edge should be drawn");
            assertEqual(vga.getPixel(15, 20), 0,  "0-Cross Arc: Left edge MUST be empty (No full loop)");
        });

        test('CIRCLE should draw an ellipse adjusting radii based on the aspect parameter', () => {
            setupVGA();
            
            // 1. Aspect = 0.5 (Wider than tall). Radius 10.
            // Expected MS-DOS behavior: X-radius = 10, Y-radius = 5.
            vga.circle(20, 20, 10, 5, null, null, 0.5);
            
            // Verify bounds limits
            assertEqual(vga.getPixel(30, 20), 5, "Ellipse (aspect 0.5): Right edge should be at x+10");
            assertEqual(vga.getPixel(10, 20), 5, "Ellipse (aspect 0.5): Left edge should be at x-10");
            assertEqual(vga.getPixel(20, 15), 5, "Ellipse (aspect 0.5): Top edge should be at y-5");
            assertEqual(vga.getPixel(20, 25), 5, "Ellipse (aspect 0.5): Bottom edge should be at y+5");
            assertEqual(vga.getPixel(20, 10), 0, "Ellipse (aspect 0.5): y-10 should be empty (flattened)");

            vga.cls();

            // 2. Aspect = 2.0 (Taller than wide). Radius 10.
            // Expected MS-DOS behavior: Y-radius = 10, X-radius = 5.
            vga.circle(30, 30, 10, 6, null, null, 2.0);
            
            // Verify bounds limits
            assertEqual(vga.getPixel(30, 20), 6, "Ellipse (aspect 2.0): Top edge should be at y-10");
            assertEqual(vga.getPixel(30, 40), 6, "Ellipse (aspect 2.0): Bottom edge should be at y+10");
            assertEqual(vga.getPixel(25, 30), 6, "Ellipse (aspect 2.0): Left edge should be at x-5");
            assertEqual(vga.getPixel(35, 30), 6, "Ellipse (aspect 2.0): Right edge should be at x+5");
            assertEqual(vga.getPixel(40, 30), 0, "Ellipse (aspect 2.0): x+10 should be empty (squeezed)");
        });

        test('CIRCLE should treat negative aspect ratios as inverted absolute values (QBasic quirk)', () => {
            setupVGA();
            
            // Aspect = -2.0 (Negative value, used in Gorillas' explosions). Radius 10.
            // Expected MS-DOS behavior: 1 / ABS(-2.0) = 0.5.
            // So X-radius = 10, Y-radius = 5. (Horizontal ellipse).
            vga.circle(30, 30, 10, 12, null, null, -2.0);
            
            // Verify bounds limits to ensure it drew exactly like a +0.5 aspect
            assertEqual(vga.getPixel(30, 25), 12, "Negative Ellipse (-2.0): Top edge should be at y-5");
            assertEqual(vga.getPixel(30, 35), 12, "Negative Ellipse (-2.0): Bottom edge should be at y+5");
            assertEqual(vga.getPixel(20, 30), 12, "Negative Ellipse (-2.0): Left edge should be at x-10");
            assertEqual(vga.getPixel(40, 30), 12, "Negative Ellipse (-2.0): Right edge should be at x+10");
            assertEqual(vga.getPixel(30, 20), 0,  "Negative Ellipse (-2.0): y-10 should be empty (flattened)");
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

        // --- BLITTING (GET / PUT) ALGORITHMS ---

        test('GET and PUT should accurately pack and unpack 4-bit pixels (Bit-Packing)', () => {
            setupVGA();
            
            // 1. Draw a tiny 2x2 square with 4 distinct colors
            vga.pset(0, 0, 1); // Top-Left: Color 1
            vga.pset(1, 0, 2); // Top-Right: Color 2
            vga.pset(0, 1, 3); // Bottom-Left: Color 3
            vga.pset(1, 1, 4); // Bottom-Right: Color 4

            // 2. Create a mock QArray-like object to receive the data
            const mockArray = {
                data: [],
                set(idx, val) { this.data[idx[0]] = val; },
                get(idx) { return this.data[idx[0]]; }
            };

            // 3. Perform GET operation
            vga.getGraphics(0, 0, 1, 1, mockArray, 0);

            // 4. Verify Header Encoding: (width << 16) | height
            // Width = 2, Height = 2 -> (2 << 16) | 2 = 131074
            assertEqual(mockArray.data[0], 131074, "Header should contain packed width and height");

            // 5. Verify Pixel Packing ONLY for Linear modes
            // Planar modes (like EGA) separate bits by color planes, drastically changing the binary signature.
            if (!vga.isPlanar) {
                // Linear: (4 << 12) | (3 << 8) | (2 << 4) | (1 << 0) = 17185
                assertEqual(mockArray.data[1], 17185, "First data block should pack 4 pixels perfectly in Linear mode");
            }

            // 6. Perform PUT operation (PSET mode) at a new location
            vga.putGraphics(10, 10, mockArray, 0, 'PSET');
            
            // 7. Verify the pixels were unpacked correctly (Works for BOTH Linear and Planar!)
            assertEqual(vga.getPixel(10, 10), 1, "Unpacked Top-Left should be Color 1");
            assertEqual(vga.getPixel(11, 10), 2, "Unpacked Top-Right should be Color 2");
            assertEqual(vga.getPixel(10, 11), 3, "Unpacked Bottom-Left should be Color 3");
            assertEqual(vga.getPixel(11, 11), 4, "Unpacked Bottom-Right should be Color 4");
            
            // 8. Perform PUT operation (XOR mode) over the original drawing
            // XORing a sprite over itself should erase it (restore background color 0)
            vga.putGraphics(0, 0, mockArray, 0, 'XOR');
            assertEqual(vga.getPixel(0, 0), 0, "XORing the sprite over itself must erase it");
        });
    });
}

// Run the full geometry suite against ALL our graphics drivers!
registerGeometrySuite('Mode 13h Linear', Mode13Linear);
registerGeometrySuite('Mode 9 EGA', Mode9EGA);
registerGeometrySuite('Mode 12 VGA', Mode12VGA);