// src/parser/tokenizer.js
import { choice, many, regex } from './monad.js';
import { 
    whitespaceLexer, 
    commentLexer, 
    stringLiteral, 
    numberLiteral, 
    anyKeywordLexer, 
    identifier, 
    symbolLexer 
} from './lexers.js';

/**
 * Absolute fallback lexer. 
 * Consumes exactly one character if all other lexers fail, 
 * ensuring the tokenizer never enters an infinite loop.
 */
const unknownLexer = regex(/^./).map(val => ({ type: 'UNKNOWN', value: val }));

/**
 * The Master Tokenizer Combinator.
 * Order is critical: 'anyKeywordLexer' must come BEFORE 'identifier' 
 * so that "PRINT" is caught as a keyword, not a variable.
 */
const masterTokenParser = many(choice([
    whitespaceLexer,
    commentLexer,
    stringLiteral,
    numberLiteral,
    anyKeywordLexer,
    identifier,
    symbolLexer,
    unknownLexer
]));

/**
 * Takes raw QBasic source code and returns a linear array of Tokens.
 * @param {string} source 
 * @returns {Array<{type: string, value: any, raw?: string}>}
 */
export function tokenize(source) {
    const parsed = masterTokenParser.run(source);
    if (parsed.isError) return [];
    return parsed.result;
}