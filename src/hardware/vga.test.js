// src/hardware/vga.test.js
import { VGA } from './vga.js';
import { Memory } from './memory.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Headless Unit Tests for the VGA Hardware Controller.
 * Verifies VRAM memory mapping, control character processing, and 32-bit rendering logic.
 */
registerSuite('VGA Hardware Controller (Memory Mapped)', () => {

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

    test('cls() should fill VRAM (0xB8000) with spaces and default attributes', () => {
        const vga = createMockVGA();
        vga.color(10, 1); // Fg: Light Green, Bg: Blue
        vga.cls();

        // 0xB8000 should be the first char (32 = Space)
        assertEqual(vga.memory.ram[0xB8000], 32);
        // 0xB8001 should be the attribute: (1 << 4) | 10 = 26
        assertEqual(vga.memory.ram[0xB8001], 26);
    });

    test('print() should process Carriage Return (13) and Line Feed (10) correctly', () => {
        const vga = createMockVGA();
        
        // Print 'A' (65), CR (13), LF (10), 'B' (66)
        vga.print([65, 13, 10, 66]);

        // 'A' should be at (0, 0)
        assertEqual(vga.memory.ram[0xB8000], 65);
        
        // 'B' should be at (0, 1), which is addr: 0xB8000 + (1 * 80 * 2) = 0xB80A0
        assertEqual(vga.memory.ram[0xB80A0], 66);
        assertEqual(vga.cursorX, 1);
        assertEqual(vga.cursorY, 1);
    });

    test('print() should handle Backspace (8) correctly', () => {
        const vga = createMockVGA();
        
        // Print 'A' (65), 'B' (66), BS (8)
        vga.print([65, 66, 8]);
        
        // Cursor should have moved back over 'B'
        assertEqual(vga.cursorX, 1);
        
        // A destructive backspace from Evaluator would send: BS (8), Space (32), BS (8)
        vga.print([32, 8]);
        assertEqual(vga.memory.ram[0xB8002], 32); // 'B' is now erased
        assertEqual(vga.cursorX, 1); // Cursor ready for new input
    });

    test('render() should correctly translate VRAM bytes to 32-bit ABGR pixels', () => {
        const vga = createMockVGA();
        vga.color(15, 0); // Fg: White, Bg: Black
        vga.cls();
        
        // Fill the entire first character with a solid block (CP437: 219)
        vga.memory.ram[0xB8000] = 219;
        vga.render();

        // The first pixel of the screen (0,0) should now be White (0xFFFFFFFF in Little Endian)
        assertEqual(vga.display.pixelBuffer32[0], 0xFFFFFFFF);
        // The pixel directly to the right of the first char (x=8) should be Black (0xFF000000)
        assertEqual(vga.display.pixelBuffer32[8], 0xFF000000);
    });
});