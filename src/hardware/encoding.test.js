// src/hardware/encoding.test.js
import { getCharFromCP437, getCP437FromChar, fromCP437Array, toCP437Array, recoverCP437Mojibake, autoDecodeSource } from './encoding.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for the CP437 / Unicode Translation Layer.
 * Ensures legacy MS-DOS bytes are correctly mapped to visual Unicode characters,
 * Mojibake is repaired, and control characters are preserved.
 */
registerSuite('CP437 Encoding Layer', () => {

    // --- Core Translation Tests ---

    test('fromCP437Array() should decode standard ASCII correctly', () => {
        const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
        assertEqual(fromCP437Array(bytes), "Hello");
    });

    test('fromCP437Array() should decode Nibbles top border (Mojibake ÛßßÛ -> █▀▀█)', () => {
        // In CP437: 219 = Full Block, 223 = Top Half Block
        const bytes = new Uint8Array([219, 223, 223, 219]);
        assertEqual(fromCP437Array(bytes), "\u2588\u2580\u2580\u2588");
    });

    test('fromCP437Array() should decode Nibbles bottom border (Mojibake ÛÜÜÛ -> █▄▄█)', () => {
        // In CP437: 219 = Full Block, 220 = Bottom Half Block
        const bytes = new Uint8Array([219, 220, 220, 219]);
        assertEqual(fromCP437Array(bytes), "\u2588\u2584\u2584\u2588");
    });

    test('fromCP437Array() should strictly preserve ASCII control characters (BS, TAB, LF, CR, ESC)', () => {
        // 8 = Backspace, 9 = Tab, 10 = LF, 13 = CR, 27 = Escape
        // If mapped to CP437 graphics (e.g. 13 -> ♪), the parser and logic will break!
        const bytes = new Uint8Array([65, 8, 66, 9, 67, 13, 10, 68, 27]); // "A\bB\tC\r\nD\x1B"
        assertEqual(fromCP437Array(bytes), "A\bB\tC\r\nD\x1B");
    });

    test('getCharFromCP437() and getCP437FromChar() should respect CONTROL_BYTES bypass', () => {
        // Control bytes should return actual JS control characters, NOT graphical symbols
        assertEqual(getCharFromCP437(13), "\r", "CR should remain \\r, not a music note");
        assertEqual(getCharFromCP437(8), "\b", "BS should remain \\b, not a hole punch");
        
        // Reverse operation should also bypass the map
        assertEqual(getCP437FromChar("\r"), 13, "\\r should map back to 13");
        assertEqual(getCP437FromChar("\x1B"), 27, "Escape should map back to 27");

        // Standard graphical characters should still use the CP437 map
        assertEqual(getCharFromCP437(1), "\u263A", "Code 1 should be a smiley face");
        assertEqual(getCP437FromChar("\u263A"), 1, "Smiley face should map to Code 1");
    });

    test('fromCP437Array() should gracefully ignore DOS EOF character (^Z / 26)', () => {
        // Legacy files often end with 26. This must be swallowed to prevent parser garbage.
        const bytes = new Uint8Array([65, 66, 67, 26]); // "ABC" + EOF
        assertEqual(fromCP437Array(bytes), "ABC");
    });

    test('toCP437Array() should perfectly reverse the translation for VRAM writing', () => {
        const unicodeText = "\u2588\u2580\u2584"; // █ ▀ ▄
        const bytes = toCP437Array(unicodeText);
        
        assertEqual(bytes[0], 219);
        assertEqual(bytes[1], 223);
        assertEqual(bytes[2], 220);
    });

    test('toCP437Array() should fallback to 0x3F (?) for unmappable modern characters', () => {
        // Emojis or modern Unicode symbols did not exist in CP437
        const bytes = toCP437Array("🚀");
        assertEqual(bytes[0], 0x3F); // 0x3F is the ASCII code for '?'
    });

    // --- Mojibake & Auto-Detection Tests ---

    test('recoverCP437Mojibake() should repair copy-pasted GitHub Windows-1252 text', () => {
        // "ÛßßÛ" is what you get when copying byte sequence [219, 223, 223, 219] read as ANSI
        const pastedMojibake = "ÛßßÛ";
        const repaired = recoverCP437Mojibake(pastedMojibake);
        
        // It should perfectly match the correct CP437 visual representation
        assertEqual(repaired, "\u2588\u2580\u2580\u2588"); // █▀▀█
    });

    test('autoDecodeSource() should correctly identify and parse Raw CP437 bytes', () => {
        // Byte 219 (0xDB) is invalid in strict UTF-8 without a continuation byte.
        // The auto-decoder should catch the error and route to fromCP437Array.
        const rawDOSBytes = new Uint8Array([219, 223, 223, 219]);
        assertEqual(autoDecodeSource(rawDOSBytes), "\u2588\u2580\u2580\u2588"); // █▀▀█
    });

    test('autoDecodeSource() should detect and repair GitHub Mojibake', () => {
        // "ÛßßÛ" encoded in pure UTF-8 (what fetch() does when downloading from GitHub)
        // Û = 0xC3 0x9B, ß = 0xC3 0x9F
        const utf8MojibakeBytes = new Uint8Array([0xC3, 0x9B, 0xC3, 0x9F, 0xC3, 0x9F, 0xC3, 0x9B]);
        
        // The decoder should see it's valid UTF-8, detect characters between 128-255, and repair it.
        assertEqual(autoDecodeSource(utf8MojibakeBytes), "\u2588\u2580\u2580\u2588"); // █▀▀█
    });

    test('autoDecodeSource() should leave True Unicode files untouched', () => {
        // "█" (U+2588) encoded in UTF-8: 0xE2 0x96 0x88
        const trueUnicodeBytes = new Uint8Array([0xE2, 0x96, 0x88]);
        
        // Decoder sees character > 255, realizes it's modern, and leaves it alone.
        assertEqual(autoDecodeSource(trueUnicodeBytes), "█");
    });

});