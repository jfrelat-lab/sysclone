// src/runtime/builtins.js
import { getCharFromCP437, getCP437FromChar } from '../../hardware/encoding.js';
import { BuiltInTokens } from '../../parser/qbasic/tokens.js';

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
    [BuiltInTokens.RIGHT$]: (str, n) => String(str).slice(-(n || 0)),
    [BuiltInTokens.LEFT$]: (str, n) => String(str).slice(0, (n || 0)),
    [BuiltInTokens.MID$]: (str, start, len) => String(str).substr((start || 1) - 1, len),
    [BuiltInTokens.CHR$]: (code) => getCharFromCP437(code || 0),
    [BuiltInTokens.ASC]: (str) => getCP437FromChar(String(str).charAt(0) || 0),
    [BuiltInTokens.INSTR]: executeINSTR,
    [BuiltInTokens.VAL]: (str) => parseFloat(str) || 0,
    
    // --- Mathematics ---
    [BuiltInTokens.INT]: (n) => Math.floor(n || 0),
    [BuiltInTokens.FIX]: (n) => Math.trunc(n || 0), // Truncates towards zero
    [BuiltInTokens.CINT]: (n) => Math.round(n || 0), // Rounds to nearest integer
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