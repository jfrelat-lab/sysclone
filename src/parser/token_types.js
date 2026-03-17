// src/parser/token_types.js

/**
 * Universal semantic standard for syntax highlighting and UI.
 * Strictly independent of any specific language implementation.
 */
export const TokenTypes = {
    KEYWORD: 'KEYWORD', 
    BUILTIN: 'BUILTIN', 
    COMMENT: 'COMMENT',
    STRING: 'STRING', 
    NUMBER: 'NUMBER', 
    SYMBOL: 'SYMBOL',
    IDENTIFIER: 'IDENTIFIER',
    WHITESPACE: 'WHITESPACE', 
    UNKNOWN: 'UNKNOWN'
};