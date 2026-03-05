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
    'SPACE$': (args) => " ".repeat(Math.max(0, args[0] || 0)),
    'STR$': (args) => args[0] >= 0 ? " " + args[0] : String(args[0]),
    'RIGHT$': (args) => String(args[0]).slice(-(args[1] || 0)),
    'LEFT$': (args) => String(args[0]).slice(0, (args[1] || 0)),
    'MID$': (args) => String(args[0]).substr((args[1] || 1) - 1, args[2]),
    'CHR$': (args) => getCharFromCP437(args[0] || 0),
    'ASC': (args) => getCP437FromChar(String(args[0]).charAt(0) || 0),
    'VAL': (args) => parseFloat(args[0]) || 0,
    
    // --- Mathematics ---
    'INT': (args) => Math.floor(args[0] || 0),
    'FIX': (args) => Math.trunc(args[0] || 0), // Truncates towards zero
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