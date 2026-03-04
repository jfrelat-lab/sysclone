// src/hardware/vga.test.js
import { VGA } from './vga.js';
import { Memory } from './memory.js';
import { VideoDriver } from './video/video_driver.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * A Test Double (Spy) that implements the strict VideoDriver contract.
 * Used to intercept and record signals dispatched by the VGA Router.
 */
class MockDriver extends VideoDriver {
    constructor(memory) {
        super(memory);
        this.width = 100;
        this.height = 100;
        // Spy registers to track what the router ordered
        this.spy = {
            clsCalled: 0,
            rendered: 0,
            printedBytes: [],
            psets: [],
            colors: [],
            locates: []
        };
    }

    // --- Mandatory implementations ---
    cls() { this.spy.clsCalled++; }
    render(display) { this.spy.rendered++; }

    // --- Optional overrides for spying ---
    print(bytes) { this.spy.printedBytes.push(bytes); }
    pset(x, y, color) { this.spy.psets.push({ x, y, color }); }
    color(fg, bg) { this.spy.colors.push({ fg, bg }); }
    locate(row, col) { this.spy.locates.push({ row, col }); }
    showCursor() {}
    hideCursor() {}
}

registerSuite('VGA Hardware Controller (Multi-Mode & Strategy Pattern)', () => {

    function createMockVGA() {
        const memory = new Memory(null);
        const mockDisplay = {
            width: 640,
            height: 400,
            pixelBuffer32: new Uint32Array(640 * 400),
            commit: () => {} 
        };
        return new VGA(memory, { displayAdapter: mockDisplay });
    }

    // --- STRATEGY PATTERN & MOCK INJECTION TESTS ---

    test('Strategy Pattern: VGA router should delegate calls to the active VideoDriver', () => {
        const vga = createMockVGA();
        const spyDriver = new MockDriver(vga.memory);
        
        // Inject the spy as a custom video mode (e.g., Mode 99)
        vga.drivers[99] = spyDriver;
        vga.setMode(99);
        
        // Send hardware commands to the generic VGA router
        vga.cls();
        vga.pset(10, 20, 15);
        vga.color(2, 4);
        vga.render();

        assertEqual(spyDriver.spy.clsCalled, 2); 
        assertEqual(spyDriver.spy.rendered, 1);
        assertEqual(spyDriver.spy.psets.length, 1);
        assertEqual(spyDriver.spy.psets[0].x, 10);
        assertEqual(spyDriver.spy.psets[0].color, 15);
        assertEqual(spyDriver.spy.colors[0].fg, 2);
    });

    // --- MODE 0 (TEXT) TESTS ---

    test('Mode 0: cls() should fill VRAM (0xB8000) with spaces and default attributes', () => {
        const vga = createMockVGA(); // Boots in Mode 0 by default
        vga.color(10, 1); // Fg: Light Green, Bg: Blue
        vga.cls();

        assertEqual(vga.memory.ram[0xB8000], 32); // Space
        assertEqual(vga.memory.ram[0xB8001], 26); // Attribute: (1 << 4) | 10 = 26
    });

    test('Mode 0: print() should process Carriage Return (13) and Line Feed (10) natively', () => {
        const vga = createMockVGA();
        
        // Print 'A' (65), CR (13), LF (10), 'B' (66)
        vga.print([65, 13, 10, 66]);

        assertEqual(vga.memory.ram[0xB8000], 65); // 'A' at (0, 0)
        assertEqual(vga.memory.ram[0xB80A0], 66); // 'B' at (0, 1) -> 0xB8000 + (1 * 80 * 2)
        assertEqual(vga.cursorX, 1);
        assertEqual(vga.cursorY, 1);
    });

    test('Mode 0: print() should handle Backspace (8) destructively', () => {
        const vga = createMockVGA();
        vga.print([65, 66, 8]); // 'A', 'B', Backspace
        
        assertEqual(vga.cursorX, 1); // Cursor back over 'B'
        
        vga.print([32, 8]); // Overwrite with Space, Backspace again
        assertEqual(vga.memory.ram[0xB8002], 32); 
        assertEqual(vga.cursorX, 1); 
    });

    // --- MODE 13 (GRAPHICS) TESTS ---

    test('Mode 13: setMode(13) should switch driver and memory addressing', () => {
        const vga = createMockVGA();
        
        vga.cls();
        assertEqual(vga.memory.ram[0xB8000], 32); 
        
        vga.setMode(13); // Switch hardware to VGA 256c
        
        vga.pset(0, 0, 15); // Should now hit 0xA0000
        assertEqual(vga.memory.ram[0xA0000], 15);
        
        assertEqual(vga.display.width, 320);
        assertEqual(vga.display.height, 200);
    });

    test('Mode 13: pset() should write 8-bit color index exactly to segment 0xA0000', () => {
        const vga = createMockVGA();
        vga.setMode(13);
        
        // Draw at x=10, y=20 with color 15 (White)
        vga.pset(10, 20, 15);
        
        // 0xA0000 + (20 * 320) + 10 = 0xA190A
        const expectedAddr = 0xA0000 + (20 * 320) + 10;
        assertEqual(vga.memory.ram[expectedAddr], 15);
    });

    test('Mode 13: pset() should gracefully ignore out-of-bounds coordinates (Hardware Clipping)', () => {
        const vga = createMockVGA();
        vga.setMode(13);
        
        vga.memory.ram[0xA0000] = 0;
        
        vga.pset(-1, 0, 15);
        vga.pset(320, 0, 15);
        vga.pset(0, 200, 15);
        
        assertEqual(vga.memory.ram[0xA0000], 0); // Uncorrupted
    });

    test('Mode 13: render() should translate 0xA0000 linear bytes into 32-bit colors', () => {
        const vga = createMockVGA();
        vga.setMode(13);
        
        // Inject color 10 (Light Green) at (0, 0)
        vga.memory.ram[0xA0000] = 10;
        vga.render();
        
        // Light Green (85, 255, 85) in 32-bit Little-Endian (AABBGGRR) -> 0xFF55FF55
        assertEqual(vga.display.pixelBuffer32[0], 0xFF55FF55);
    });

});