// src/parser/lexers.js
import { regex, sequenceObj, capture, Parser, optional, choice } from '../monad.js';
import { Tokens, BuiltInTokens } from './tokens.js';

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

const RESERVED_KEYWORDS = new Set(Object.values(Tokens));

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
        
        // Exception: INPUT$ is a valid hardware function, not the INPUT statement.
        if (word !== BuiltInTokens.INPUT$) {
            if (RESERVED_KEYWORDS.has(wordWithoutSuffix) || RESERVED_KEYWORDS.has(word)) {
                return { ...state, isError: true, error: `'${word}' is a reserved keyword.` };
            }
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
 * Creates a case-insensitive keyword parser natively from a Token definition.
 * Simplified for performance: Assumes the provided token is valid by strict typing.
 */
export const keyword = (token) => {
    // Uses negative lookahead to ensure we don't match a prefix of a longer word
    return regex(new RegExp(`^${token}(?![a-zA-Z0-9_])`, 'i'))
        .map(res => res.toUpperCase()); 
};