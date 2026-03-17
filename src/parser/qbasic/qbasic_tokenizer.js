// src/parser/qbasic/qbasic_tokenizer.js
import { BaseTokenizer } from '../base_tokenizer.js';
import { TokenTypes } from '../token_types.js';
import { Tokens, BuiltInTokens } from './tokens.js';
import { wordChoice, anyChar } from '../../parser/monad.js';
import {
    whitespaceLexer, commentLexer, stringLiteral, numberLiteral,
    identifier, symbolLexer
} from './lexers.js';

export class QBasicTokenizer extends BaseTokenizer {
    constructor() {
        super();
        this.buildParser();
    }

    /**
     * Assembles the QBasic-specific visual grammar pipeline.
     */
    buildParser() {
        // Build the raw parsers using our new generic monadic factory
        const builtinLexer = wordChoice(Object.values(BuiltInTokens));
        const keywordLexer = wordChoice(Object.values(Tokens));

        // Declarative pipeline assembly using explicit mapping objects.
        // Array order defines the strict evaluation priority.
        this.tokenParser = this.buildPipeline([
            { parser: whitespaceLexer, type: TokenTypes.WHITESPACE },
            { parser: commentLexer,    type: TokenTypes.COMMENT },
            { parser: stringLiteral,   type: TokenTypes.STRING },
            { parser: numberLiteral,   type: TokenTypes.NUMBER },
            { parser: builtinLexer,    type: TokenTypes.BUILTIN },
            { parser: keywordLexer,    type: TokenTypes.KEYWORD },
            { parser: identifier,      type: TokenTypes.IDENTIFIER },
            { parser: symbolLexer,     type: TokenTypes.SYMBOL },
            { parser: anyChar,         type: TokenTypes.UNKNOWN }
        ]);
    }
}