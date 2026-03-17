// src/parser/base_tokenizer.js
import { choice, many } from './monad.js';

export class BaseTokenizer {
    constructor() {
        // Must be initialized by the subclass with the specific language parser pipeline
        this.tokenParser = null; 
    }

    /**
     * Generic utility to decorate the output of a compiler lexer
     * with a universal UI semantic label.
     * @param {Parser} lexer - The monadic parser to wrap.
     * @param {string} tokenType - The target TokenTypes constant.
     * @returns {Parser} The mapped parser.
     */
    mapToType(lexer, tokenType) {
        return lexer.map(res => ({
            type: tokenType,
            value: res.raw !== undefined ? res.raw : (res.value !== undefined ? res.value : res)
        }));
    }

    /**
     * PIPELINE BUILDER
     * Assembles a list of explicit mapping objects into a single monadic parser.
     * @param {Array<{parser: Parser, type: string}>} rules - Explicit mapping rules.
     * @returns {Parser} The complete tokenization pipeline.
     */
    buildPipeline(rules) {
        const mappedChoices = rules.map(rule => this.mapToType(rule.parser, rule.type));
        return many(choice(mappedChoices));
    }

    /**
     * Universal tokenization loop.
     * @param {string} sourceCode - The raw source code to tokenize.
     * @returns {Array<{type: string, value: string}>} The stream of UI tokens.
     */
    tokenize(sourceCode) {
        if (!this.tokenParser) {
            throw new Error("Architecture Error: tokenParser must be initialized by the subclass.");
        }
        
        // Execute the monadic pipeline using its native 'run' method
        const finalState = this.tokenParser.run(sourceCode);
        
        return finalState.isError ? [] : finalState.result;
    }
}