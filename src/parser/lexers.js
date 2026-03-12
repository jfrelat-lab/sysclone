// src/parser/lexers.js
import { regex, sequenceObj, capture, Parser, optional, choice } from './monad.js';
import { BuiltIns } from '../runtime/builtins.js';

/**
 * STRICT WHITESPACE MANAGEMENT (Horizontal only)
 * Line breaks are handled separately by the EOS parser.
 */
export const ws = regex(/^[ \t]+/);
export const optWs = regex(/^[ \t]*/);

/**
 * End Of Statement (EOS)
 * Handles optional whitespace, comments (' or REM), colons (:), and line breaks.
 * Optimized for linear matching to prevent backtracking on large legacy files.
 * @type {Parser<string>}
 */
export const eos = regex(/^[ \t]*(?:(?:'|REM\b)[^\n]*)?(?:\r?\n|:)(?:[ \t\r\n]|(?:(?:'|REM\b)[^\n]*))*/i);

// --- ATOMIC LEXERS FOR UI TOKENIZATION ---

/**
 * Captures both apostrophe (') and REM comments.
 */
export const commentLexer = regex(/^(?:'|REM\b)[^\r\n]*/i).map(val => ({ type: 'COMMENT', value: val }));
export const whitespaceLexer = regex(/^[ \t\r\n]+/).map(val => ({ type: 'WHITESPACE', value: val }));
export const symbolLexer = regex(/^[^a-zA-Z0-9_ \t\r\n"']+/).map(val => ({ type: 'SYMBOL', value: val }));

// --- LITERALS ---

/**
 * Parses numeric literals including Hexadecimal (&H), Decimals, Scientific Notation (E/D),
 * and QBasic type suffixes (%, &, !, #).
 */
export const numberLiteral = regex(/^(?:&H[0-9A-Fa-f]+|\d+(?:\.\d*)?|\.\d+)(?:[eEdD][-+]?\d+)?(?:[%&!#])?/i).map(n => {
    let cleanNum = n.toUpperCase();

    // Hexadecimal conversion (Base 16 to Base 10)
    if (cleanNum.startsWith('&H')) {
        // Strip trailing QBasic type suffix ONLY at the end of the string ($)
        cleanNum = cleanNum.replace(/[%&!#]$/, '');
        return { type: 'NUMBER', value: parseInt(cleanNum.substring(2), 16), raw: n };
    }

    // Standard decimal and scientific processing
    cleanNum = cleanNum.replace(/[%&!#]$/, ''); // Strip type suffixes at the end only
    cleanNum = cleanNum.replace('D', 'E');      // Convert QBasic 'D' (Double) exponent to JS 'E'
    
    return { type: 'NUMBER', value: parseFloat(cleanNum), raw: n };
});

/**
 * Parses numeric literals with an optional leading sign (+ or -).
 * Crucial for statements like DATA or CONST that expect static signed values 
 * without invoking the complex unary/binary expression parser.
 */
export const signedNumberLiteral = sequenceObj([
    capture('sign', optional(choice([regex(/^\-/), regex(/^\+/) ]))),
    capture('num', numberLiteral)
]).map(obj => {
    if (obj.sign === '-') {
        // Manually invert the value for the AST and preserve the raw string
        return { type: 'NUMBER', value: -obj.num.value, raw: '-' + obj.num.raw };
    }
    if (obj.sign === '+') {
        // Just preserve the explicit '+' in the raw string
        return { type: 'NUMBER', value: obj.num.value, raw: '+' + obj.num.raw };
    }
    return obj.num; // Unsigned numbers remain unchanged
});

/**
 * Parses string literals enclosed in double quotes.
 */
export const stringLiteral = sequenceObj([
    regex(/^"/),
    capture('text', regex(/^[^"]*/)),
    regex(/^"/)
]).map(obj => ({
    type: 'STRING',
    value: obj.text,
    raw: `"${obj.text}"`
}));

// --- IDENTIFIERS AND KEYWORDS ---

/**
 * Strict list of reserved keywords.
 * Identifiers matching these will be rejected by the identifier parser.
 */
const RESERVED_KEYWORDS = new Set([
    // Control Flow
    'IF', 'THEN', 'ELSE', 'ELSEIF', 'END', 'FOR', 'TO', 'STEP', 'NEXT',
    'DO', 'LOOP', 'UNTIL', 'WHILE', 'WEND', 'GOTO', 'GOSUB', 'RETURN', 'CALL',
    'SELECT', 'CASE',
    // Legacy Error Handling & Jumps
    'ON', 'ERROR', 'RESUME',
    // Declarations
    'SUB', 'FUNCTION', 'DECLARE', 'DIM', 'REDIM', 'SHARED', 'AS', 'TYPE', 'CONST', 'DEFINT', 'DEF', 'SEG', 'ANY', 'STATIC',
    // System and Hardware Instructions
    'PRINT', 'USING', 'CLS', 'LOCATE', 'COLOR', 'POKE', 'OUT', 'RANDOMIZE', 'SCREEN', 'WIDTH', 'DATA', 'READ', 'RESTORE', 'INPUT',
    'WINDOW', 'PSET', 'CIRCLE', 'LINE', 'PAINT', 'PALETTE', 'PRESET', 'PUT', 'GET', 'VIEW', 'PLAY', 'BEEP', 'SLEEP',
    // Logical and Mathematical textual operators
    'AND', 'OR', 'NOT', 'MOD', 'XOR',
    // Comments
    'REM'
]);

/**
 * HARDWARE BUILT-INS
 * These interact with the HAL and are handled directly in the Evaluator loop.
 */
const HARDWARE_BUILTINS = [
    'PEEK', 'INP', 'OUT', 'INKEY$', 'TIMER', 'COMMAND$', 'ENVIRON$', 'POINT'
];

/**
 * BUILT-IN FUNCTIONS (Dynamic generation from STDLIB + Hardware stubs)
 */
const BUILTIN_FUNCTIONS = new Set([
    ...Object.keys(BuiltIns),
    ...HARDWARE_BUILTINS
]);

/**
 * Unified set for the UI Tokenizer.
 */
const HIGHLIGHT_KEYWORDS = new Set([...RESERVED_KEYWORDS, ...BUILTIN_FUNCTIONS]);

/**
 * anyKeywordLexer (Used by Tokenizer for UI only)
 * Uses the extended set (HIGHLIGHT_KEYWORDS) for rich syntax highlighting.
 */
export const anyKeywordLexer = new Parser(state => {
    const { targetString, index } = state;
    const match = targetString.slice(index).match(/^[a-zA-Z_][a-zA-Z0-9_]*[%&!#$]?/);
    
    if (match && match.index === 0) {
        const word = match[0].toUpperCase();
        const wordWithoutSuffix = word.replace(/[%&!#$]$/, '');
        
        if (HIGHLIGHT_KEYWORDS.has(wordWithoutSuffix) || HIGHLIGHT_KEYWORDS.has(word)) {
            return {
                ...state,
                index: index + match[0].length,
                result: { type: 'KEYWORD', value: match[0] },
                isError: false
            };
        }
    }
    return { ...state, isError: true, error: `Not a keyword at index ${index}` };
});

/**
 * Parses variable names or subroutine identifiers.
 * Rejects any word present in the RESERVED_KEYWORDS set.
 */
export const identifier = new Parser(state => {
    const { targetString, index } = state;
    const rest = targetString.slice(index);
    // QBasic identifiers can end with type suffixes ($, %, &, !, #)
    const match = rest.match(/^[a-zA-Z_][a-zA-Z0-9_]*[%&!#$]?/);
    
    if (match && match.index === 0) {
        const word = match[0].toUpperCase();
        // Remove suffix to check against base reserved keywords
        const wordWithoutSuffix = word.replace(/[%&!#$]$/, '');
        
        if (RESERVED_KEYWORDS.has(wordWithoutSuffix) || RESERVED_KEYWORDS.has(word)) {
            return { ...state, isError: true, error: `'${word}' is a reserved keyword.` };
        }
        
        return {
            ...state,
            index: index + match[0].length,
            // Add 'raw' to preserve the user's original casing for UI highlighting
            result: { type: 'IDENTIFIER', value: word, raw: match[0] },
            isError: false
        };
    }
    return { ...state, isError: true, error: `Invalid identifier at index ${index}` };
});

/**
 * Utility function to create a case-insensitive keyword parser.
 * Validates that the keyword is officially registered in RESERVED_KEYWORDS.
 */
export const keyword = (kw) => {
    const upperKw = kw.toUpperCase();
    
    // Architectural safety check
    if (!RESERVED_KEYWORDS.has(upperKw)) {
        throw new Error(`Internal Error: '${upperKw}' is not declared in RESERVED_KEYWORDS!`);
    }

    // Uses negative lookahead to ensure we don't match a prefix of a longer word
    return regex(new RegExp(`^${upperKw}(?![a-zA-Z0-9_])`, 'i'))
        .map(res => res.toUpperCase()); 
};