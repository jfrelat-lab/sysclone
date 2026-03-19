// src/runtime/builtins.js
import { getCharFromCP437, getCP437FromChar } from '../../hardware/encoding.js';
import { BuiltInTokens } from '../../parser/qbasic/tokens.js';

/**
 * MS-DOS "Banker's Rounding" (Round half to even).
 * Optimized for V8: relies on native Math.round (+infinity bias) 
 * and corrects the odd halves with a simple decrement.
 */
export function bankersRound(n) {
    const r = Math.round(n);
    return (Math.abs(n % 1) === 0.5 && r % 2 !== 0) ? r - 1 : r;
}

// --- Complex Native Functions ---

const executeSTRING$ = (lenArg, charArg) => {
    const len = Math.max(0, Math.floor(lenArg || 0));
    let char = "";
    if (typeof charArg === 'string') {
        char = charArg.charAt(0); // Take the first character of the string
    } else {
        // Treat as an ASCII / CP437 code
        char = getCharFromCP437(Math.floor(charArg || 0));
    }
    return char.repeat(len);
};

// Find the starting position of a substring (1-indexed)
const executeINSTR = (arg1, arg2, arg3) => {
    let start = 1, str1 = "", str2 = "";
    if (arg3 !== undefined) {
        start = Math.max(1, arg1);
        str1 = String(arg2);
        str2 = String(arg3);
    } else {
        str1 = String(arg1);
        str2 = String(arg2);
    }
    if (str1 === "" || str2 === "") return 0;
    
    // JavaScript indexOf is 0-indexed, QBasic is 1-indexed.
    // If not found, indexOf returns -1. Adding 1 conveniently returns 0!
    return str1.indexOf(str2, start - 1) + 1; 
};

/**
 * Converts a numeric expression to a hexadecimal string.
 * Accurately emulates QBasic's specific conversion quirks:
 * 1. Automatically rounds floating-point numbers to the nearest integer.
 * 2. Handles negative numbers by casting them to their 16-bit or 32-bit unsigned two's complement.
 * 3. Enforces an uppercase string output.
 */
const executeHEX$ = (val) => {
    let n = Math.round(Number(val) || 0);
    
    if (n < 0) {
        // Emulate MS-DOS architecture: Default to 16-bit boundaries.
        // If the number exceeds the 16-bit signed minimum, cast to 32-bit.
        if (n >= -32768) {
            n = (n >>> 0) & 0xFFFF; // 16-bit two's complement mask
        } else {
            n = (n >>> 0); // 32-bit two's complement mask
        }
    }
    
    return n.toString(16).toUpperCase();
};

/**
 * Converts a string representation of a number to a numeric value.
 * Accurately parses QBasic's hexadecimal (&H) and octal (&O) prefixes.
 */
const executeVAL = (valArg) => {
    let str = String(valArg).trim().toUpperCase();
    
    // MS-DOS Hexadecimal parsing
    if (str.startsWith('&H')) {
        const parsed = parseInt(str.substring(2), 16);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    // MS-DOS Octal parsing (just in case!)
    if (str.startsWith('&O')) {
        const parsed = parseInt(str.substring(2), 8);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    // Standard decimal parsing
    return parseFloat(str) || 0;
};

/**
 * Sysclone Native Standard Library (STDLIB).
 * Contains pure functions that do not require access to hardware state.
 */
export const BuiltIns = {
    // --- String Manipulation ---
    [BuiltInTokens.LEN]: (str) => String(str).length,
    [BuiltInTokens.UCASE$]: (str) => String(str).toUpperCase(),
    [BuiltInTokens.LCASE$]: (str) => String(str).toLowerCase(),
    [BuiltInTokens.LTRIM$]: (str) => String(str).trimStart(),
    [BuiltInTokens.RTRIM$]: (str) => String(str).trimEnd(),
    [BuiltInTokens.SPACE$]: (n) => " ".repeat(Math.max(0, n || 0)),
    [BuiltInTokens.SPC]: (n) => " ".repeat(Math.max(0, n || 0)),
    [BuiltInTokens.STRING$]: executeSTRING$,
    [BuiltInTokens.STR$]: (n) => n >= 0 ? " " + n : String(n),
    [BuiltInTokens.HEX$]: executeHEX$,
    [BuiltInTokens.RIGHT$]: (str, n) => String(str).slice(-(n || 0)),
    [BuiltInTokens.LEFT$]: (str, n) => String(str).slice(0, (n || 0)),
    [BuiltInTokens.MID$]: (str, start, len) => String(str).substr((start || 1) - 1, len),
    [BuiltInTokens.CHR$]: (code) => getCharFromCP437(code || 0),
    [BuiltInTokens.ASC]: (str) => getCP437FromChar(String(str).charAt(0) || 0),
    [BuiltInTokens.INSTR]: executeINSTR,
    [BuiltInTokens.VAL]: executeVAL,
    
    // --- Mathematics ---
    [BuiltInTokens.INT]: (n) => Math.floor(n || 0),
    [BuiltInTokens.FIX]: (n) => Math.trunc(n || 0), // Truncates towards zero
    [BuiltInTokens.CINT]: (n) => bankersRound(n || 0), // Rounds to nearest integer with Banker's rounding
    [BuiltInTokens.RND]: () => Math.random(),
    [BuiltInTokens.SIN]: (n) => Math.sin(n || 0),
    [BuiltInTokens.COS]: (n) => Math.cos(n || 0),
    [BuiltInTokens.TAN]: (n) => Math.tan(n || 0),
    [BuiltInTokens.ATN]: (n) => Math.atan(n || 0),
    [BuiltInTokens.ABS]: (n) => Math.abs(n || 0),
    [BuiltInTokens.SQR]: (n) => Math.sqrt(n || 0),
    [BuiltInTokens.EXP]: (n) => Math.exp(n || 0),
    [BuiltInTokens.LOG]: (n) => Math.log(n || 0)
};