// src/hardware/video/text_mode.test.js
import { Mode0Text } from './mode0_text.js';
import { test, assertEqual, registerSuite } from '../../test_runner.js';

class MockMemory {
    constructor() {
        this.ram = new Uint8Array(1024 * 1024); // 1MB Virtual RAM
    }
}

/**
 * Factory function to generate a test suite for ANY text mode driver.
 * Verifies the TextModeDriver terminal logic (cursor, scrolling, attributes).
 */
function registerTextModeSuite(modeName, DriverClass) {
    registerSuite(`Text Terminal Logic (${modeName})`, () => {

        let mem;
        let vga;
        let BASE;
        let COLS;

        // Helper to setup a fresh VGA Text state for each test
        const setupVGA = () => {
            mem = new MockMemory();
            vga = new DriverClass(mem);
            BASE = vga.TEXT_VRAM_BASE; // Typically 0xB8000
            COLS = vga.cols;
            vga.cls();
        };

        // Helpers to read VRAM safely
        const getChar = (row, col) => mem.ram[BASE + ((row * COLS) + col) * 2];
        const getAttr = (row, col) => mem.ram[BASE + ((row * COLS) + col) * 2 + 1];

        // --- CORE TERMINAL FEATURES ---

        test('CLS should fill VRAM with spaces (32) and current color attributes', () => {
            setupVGA();
            
            vga.color(10, 1); // Foreground 10 (Light Green), Background 1 (Blue)
            vga.cls();
            
            // Expected attribute byte: (Background << 4) | Foreground
            const expectedAttr = (1 << 4) | 10; // 16 + 10 = 26

            assertEqual(getChar(0, 0), 32); // Top-left is a space
            assertEqual(getAttr(0, 0), expectedAttr);
            
            assertEqual(getChar(vga.rows - 1, vga.cols - 1), 32); // Bottom-right is a space
            assertEqual(getAttr(vga.rows - 1, vga.cols - 1), expectedAttr);
            
            assertEqual(vga.cursorX, 0);
            assertEqual(vga.cursorY, 0);
        });

        test('LOCATE and PRINT should write text at specific coordinates', () => {
            setupVGA();
            vga.color(15, 0); // White on Black
            
            // LOCATE is 1-indexed in QBasic! (Row 2, Col 3) -> Internal (Y:1, X:2)
            vga.locate(2, 3);
            vga.print([65]); // Print 'A'
            
            assertEqual(getChar(1, 2), 65);
            assertEqual(getAttr(1, 2), 15);
            
            // Cursor should advance
            assertEqual(vga.cursorX, 3);
            assertEqual(vga.cursorY, 1);
        });

        test('PRINT should process Backspace (8) destructively', () => {
            setupVGA();
            
            vga.print([65, 66, 8]); // 'A', 'B', Backspace
            assertEqual(vga.cursorX, 1); // Cursor moves back over 'B'
            
            vga.print([32, 8]); // Overwrite with Space, Backspace again
            assertEqual(getChar(0, 1), 32); 
            assertEqual(vga.cursorX, 1); 
        });

        test('PRINT should handle Carriage Return (13) and Line Feed (10)', () => {
            setupVGA();
            
            // Print 'A' (65), CR (13), LF (10), 'B' (66)
            vga.print([65, 13, 10, 66]);

            assertEqual(getChar(0, 0), 65); // 'A' at (0, 0)
            assertEqual(getChar(1, 0), 66); // 'B' at (1, 0)
            
            assertEqual(vga.cursorX, 1);
            assertEqual(vga.cursorY, 1);
        });

        test('PRINT should trigger hardware scrollUp() when exceeding the last row', () => {
            setupVGA();
            
            // Position cursor at the very last line
            vga.locate(vga.rows, 1);
            
            // In MS-DOS, a full newline requires both Carriage Return (13) AND Line Feed (10)!
            vga.print([65, 13, 10, 66]); 
            
            // The 'A' should have moved UP one row
            assertEqual(getChar(vga.rows - 2, 0), 65);
            
            // The 'B' should be on the new bottom row, exactly at Column 0
            assertEqual(getChar(vga.rows - 1, 0), 66);
            
            // The bottom row should otherwise be cleared with spaces
            assertEqual(getChar(vga.rows - 1, 5), 32);
        });

    });
}

// Run the full terminal logic suite against our Text Mode drivers!
registerTextModeSuite('Mode 0 (80x25)', Mode0Text);