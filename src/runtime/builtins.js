// src/runtime/builtins.js
import { getCharFromCP437, getCP437FromChar } from '../hardware/encoding.js';

/**
 * Sysclone Native Standard Library (STDLIB).
 * Contains pure functions that do not require access to hardware state.
 */
export const BuiltIns = {
    // --- String Manipulation ---
    'LEN': (args) => String(args[0]).length,
    'UCASE$': (args) => String(args[0]).toUpperCase(),
    'LCASE$': (args) => String(args[0]).toLowerCase(),
    'LTRIM$': (args) => String(args[0]).trimStart(),
    'RTRIM$': (args) => String(args[0]).trimEnd(),
    'SPACE$': (args) => " ".repeat(Math.max(0, args[0] || 0)),
    'SPC': (args) => " ".repeat(Math.max(0, args[0] || 0)),
    'STRING$': (args) => {
        const len = Math.max(0, Math.floor(args[0] || 0));
        let char = "";
        if (typeof args[1] === 'string') {
            char = args[1].charAt(0); // Take the first character of the string
        } else {
            // Treat as an ASCII / CP437 code
            char = getCharFromCP437(Math.floor(args[1] || 0));
        }
        return char.repeat(len);
    },
    'STR$': (args) => args[0] >= 0 ? " " + args[0] : String(args[0]),
    'RIGHT$': (args) => String(args[0]).slice(-(args[1] || 0)),
    'LEFT$': (args) => String(args[0]).slice(0, (args[1] || 0)),
    'MID$': (args) => String(args[0]).substr((args[1] || 1) - 1, args[2]),
    'CHR$': (args) => getCharFromCP437(args[0] || 0),
    'ASC': (args) => getCP437FromChar(String(args[0]).charAt(0) || 0),
    // Find the starting position of a substring (1-indexed)
    'INSTR': (args) => {
        let start = 1, str1 = "", str2 = "";
        if (args.length === 2) {
            str1 = String(args[0]);
            str2 = String(args[1]);
        } else if (args.length === 3) {
            start = Math.max(1, args[0]);
            str1 = String(args[1]);
            str2 = String(args[2]);
        }
        if (str1 === "" || str2 === "") return 0;
        
        // JavaScript indexOf is 0-indexed, QBasic is 1-indexed.
        // If not found, indexOf returns -1. Adding 1 conveniently returns 0!
        return str1.indexOf(str2, start - 1) + 1; 
    },
    'VAL': (args) => parseFloat(args[0]) || 0,
    
    // --- Mathematics ---
    'INT': (args) => Math.floor(args[0] || 0),
    'FIX': (args) => Math.trunc(args[0] || 0), // Truncates towards zero
    'CINT': (args) => Math.round(args[0] || 0), // Rounds to nearest integer
    'RND': () => Math.random(),
    'SIN': (args) => Math.sin(args[0] || 0),
    'COS': (args) => Math.cos(args[0] || 0),
    'TAN': (args) => Math.tan(args[0] || 0),
    'ATN': (args) => Math.atan(args[0] || 0),
    'ABS': (args) => Math.abs(args[0] || 0),
    'SQR': (args) => Math.sqrt(args[0] || 0),
    'EXP': (args) => Math.exp(args[0] || 0),
    'LOG': (args) => Math.log(args[0] || 0)
};