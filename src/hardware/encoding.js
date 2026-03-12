// src/hardware/encoding.js

/**
 * Code Page 437 (MS-DOS) Bidirectional Translation Layer.
 * Essential for rendering block characters (Nibbles) and international text correctly.
 */

const CP437_TO_UNICODE = [
    '\u0000', '\u263A', '\u263B', '\u2665', '\u2666', '\u2663', '\u2660', '\u2022', // 0-7
    '\u25D8', '\u25CB', '\u25D9', '\u2642', '\u2640', '\u266A', '\u266B', '\u263C', // 8-15
    '\u25BA', '\u25C4', '\u2195', '\u203C', '\u00B6', '\u00A7', '\u25AC', '\u21A8', // 16-23
    '\u2191', '\u2193', '\u2192', '\u2190', '\u221F', '\u2194', '\u25B2', '\u25BC', // 24-31
    ' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', // 32-47
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', // 48-63
    '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', // 64-79
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', // 80-95
    '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', // 96-111
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', '\u2302', // 112-127
    '\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7', // 128-135
    '\u00EA', '\u00EB', '\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5', // 136-143
    '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9', // 144-151
    '\u00FF', '\u00D6', '\u00DC', '\u00A2', '\u00A3', '\u00A5', '\u20A7', '\u0192', // 152-159
    '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1', '\u00AA', '\u00BA', // 160-167
    '\u00BF', '\u2310', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB', // 168-175
    '\u2591', '\u2592', '\u2593', '\u2502', '\u2524', '\u2561', '\u2562', '\u2556', // 176-183
    '\u2555', '\u2563', '\u2551', '\u2557', '\u255D', '\u255C', '\u255B', '\u2510', // 184-191
    '\u2514', '\u2534', '\u252C', '\u251C', '\u2500', '\u253C', '\u255E', '\u255F', // 192-199
    '\u255A', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256C', '\u2567', // 200-207
    '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256B', // 208-215
    '\u256A', '\u2518', '\u250C', '\u2588', '\u2584', '\u258C', '\u2590', '\u2580', // 216-223
    '\u03B1', '\u03B2', '\u0393', '\u03C0', '\u03A3', '\u03C3', '\u03BC', '\u03C4', // 224-231
    '\u03A6', '\u0398', '\u03A9', '\u03B4', '\u221E', '\u03C6', '\u03B5', '\u2229', // 232-239
    '\u2261', '\u00B1', '\u2265', '\u2264', '\u2320', '\u2321', '\u00F7', '\u2248', // 240-247
    '\u00B0', '\u2219', '\u00B7', '\u221A', '\u207F', '\u00B2', '\u25A0', '\u00A0'  // 248-255
];

// O(1) reverse lookup map generated at initialization
const UNICODE_TO_CP437 = new Map();
for (let i = 0; i < 256; i++) {
    UNICODE_TO_CP437.set(CP437_TO_UNICODE[i], i);
}

// Architectural definition of strict control characters
// These bypass the visual CP437 mapping to maintain logical integrity in the VM.
// 8=Backspace, 9=Tab, 10=LineFeed, 13=CarriageReturn, 27=Escape
const CONTROL_BYTES = new Set([8, 9, 10, 13, 27]);

/**
 * Converts a raw Uint8Array (typically a legacy DOS file) into a standard JS Unicode string.
 * Explicitly preserves ASCII control characters used in text files (Tabs, Newlines).
 * @param {Uint8Array} bytes 
 * @returns {string}
 */
export function fromCP437Array(bytes) {
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i];
        
        if (CONTROL_BYTES.has(b)) { 
            result += String.fromCharCode(b); 
        } else if (b === 26) { 
            continue; // DOS EOF (^Z) - ignore it to avoid parser garbage
        } else {
            result += CP437_TO_UNICODE[b];
        }
    }
    return result;
}

/**
 * Converts a standard JS Unicode string back into a CP437 byte array.
 * Re-injects control characters correctly.
 * @param {string} unicodeString 
 * @returns {Uint8Array}
 */
export function toCP437Array(unicodeString) {
    const bytes = new Uint8Array(unicodeString.length);
    for (let i = 0; i < unicodeString.length; i++) {
        const char = unicodeString[i];
        const charCode = unicodeString.charCodeAt(i);
        
        if (CONTROL_BYTES.has(charCode)) {
            bytes[i] = charCode;
        } else if (UNICODE_TO_CP437.has(char)) {
            bytes[i] = UNICODE_TO_CP437.get(char);
        } else {
            // Standard ASCII fallback (0-127) if exact map misses, or 0x3F ('?')
            bytes[i] = (charCode >= 0 && charCode <= 127) ? charCode : 0x3F; 
        }
    }
    return bytes;
}

/**
 * Returns the correct Unicode character for a single CP437 byte (Used by CHR$).
 * @param {number} byte 
 * @returns {string}
 */
export function getCharFromCP437(byte) {
    const b = byte & 255;
    if (CONTROL_BYTES.has(b)) return String.fromCharCode(b);
    return CP437_TO_UNICODE[b];
}

/**
 * Returns the CP437 byte for a single Unicode character (Used by ASC).
 * @param {string} char 
 * @returns {number}
 */
export function getCP437FromChar(char) {
    if (!char) return 0;
    const code = char.charCodeAt(0);
    if (CONTROL_BYTES.has(code)) return code;
    return UNICODE_TO_CP437.has(char) ? UNICODE_TO_CP437.get(char) : (code <= 127 ? code : 0x3F);
}

/**
 * Recovers a string that was incorrectly decoded as Windows-1252/ISO-8859-1 (Mojibake).
 * Extracts the raw byte values (0-255) and properly decodes them as CP437.
 * Vital for copy-pasting legacy code from GitHub or modern text editors.
 * @param {string} badString 
 * @returns {string}
 */
export function recoverCP437Mojibake(badString) {
    const bytes = new Uint8Array(badString.length);
    for (let i = 0; i < badString.length; i++) {
        // Recover the raw 8-bit byte from the corrupted Latin-1 character
        bytes[i] = badString.charCodeAt(i) & 255;
    }
    return fromCP437Array(bytes);
}

/**
 * Automatically detects and decodes QBasic source files.
 * Handles 3 cases: Raw CP437 (Legacy DOS), GitHub Mojibake (UTF-8 of Windows-1252), and True Unicode.
 * @param {Uint8Array} bytes 
 * @returns {string}
 */
export function autoDecodeSource(bytes) {
    let text = "";
    try {
        // Step 1: Attempt strict UTF-8 decoding
        const decoder = new TextDecoder('utf-8', { fatal: true });
        text = decoder.decode(bytes);
    } catch (e) {
        // Step 2: If it fails, it contains invalid UTF-8 bytes. 
        // It's a genuine MS-DOS CP437 binary file!
        return fromCP437Array(bytes);
    }

    // Step 3: It is valid UTF-8. Let's analyze the character codes.
    let hasMojibake = false;
    let hasTrueUnicode = false;

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code > 127 && code <= 255) hasMojibake = true; // e.g., 'Û' (219)
        if (code > 255) hasTrueUnicode = true;             // e.g., '█' (9608)
    }

    // If it has Extended ASCII but NO True Unicode, it's GitHub Mojibake!
    if (hasMojibake && !hasTrueUnicode) {
        return recoverCP437Mojibake(text);
    }

    // Otherwise, it's pure ASCII or an already perfect Unicode file.
    // We just strip the legacy DOS EOF character (26 / ^Z) to protect the parser.
    return text.replace(/\x1A/g, '');
}