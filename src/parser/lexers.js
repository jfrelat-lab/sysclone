// src/parser/lexers.js
import { regex, sequenceObj, capture, Parser } from './monad.js';

/**
 * STRICT WHITESPACE MANAGEMENT (Horizontal only)
 * Line breaks are handled separately by the EOS parser.
 */
export const ws = regex(/^[ \t]+/);
export const optWs = regex(/^[ \t]*/);

/**
 * End Of Statement (EOS)
 * Handles optional whitespace, comments ('), colons (:), and line breaks.
 * Optimized for linear matching to prevent backtracking on large legacy files.
 * @type {Parser<string>}
 */
export const eos = regex(/^[ \t]*(?:'[^\n]*)?(?:\r?\n|:)(?:[ \t\r\n]|(?:'[^\n]*))*/);

// --- LITERALS ---

/**
 * Parses numeric literals including Hexadecimal (&H) and Decimals.
 */
export const numberLiteral = regex(/^(?:&H[0-9A-Fa-f]+|\d+(?:\.\d*)?|\.\d+)/i).map(n => {
    // Hexadecimal conversion (Base 16 to Base 10)
    if (n.toUpperCase().startsWith('&H')) {
        return { type: 'NUMBER', value: parseInt(n.substring(2), 16) };
    }
    // Standard decimal parsing
    return { type: 'NUMBER', value: parseFloat(n) };
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
    value: obj.text
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
    // Declarations
    'SUB', 'FUNCTION', 'DECLARE', 'DIM', 'SHARED', 'AS', 'TYPE', 'CONST', 'DEFINT', 'DEF', 'SEG', 'ANY', 'STATIC',
    // System and Hardware Instructions
    'PRINT', 'USING', 'CLS', 'LOCATE', 'COLOR', 'POKE', 'RANDOMIZE', 'SCREEN', 'WIDTH', 'DATA', 'READ', 'RESTORE', 'INPUT',
    // Logical and Mathematical textual operators
    'AND', 'OR', 'NOT', 'MOD'
]);

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
            result: { type: 'IDENTIFIER', value: word },
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