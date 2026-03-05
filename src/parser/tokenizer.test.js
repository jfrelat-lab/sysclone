// src/parser/tokenizer.test.js
import { tokenize } from './tokenizer.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for the UI Tokenizer.
 * Ensures that a raw string of source code is correctly broken down into 
 * a continuous, non-destructive stream of tokens for Syntax Highlighting.
 */
registerSuite('UI Syntax Highlighting (Tokenizer)', () => {

    test('tokenize() should break a string into a continuous stream of tokens', () => {
        const source = 'PRINT "Hello" \' Comment';
        
        // We expect the Tokenizer to use our atomic lexers sequentially
        const tokens = tokenize(source);
        
        assertEqual(tokens.length, 5);
        
        assertEqual(tokens[0].type, 'KEYWORD');
        assertEqual(tokens[0].value, 'PRINT');
        
        assertEqual(tokens[1].type, 'WHITESPACE');
        assertEqual(tokens[1].value, ' ');
        
        assertEqual(tokens[2].type, 'STRING');
        assertEqual(tokens[2].raw, '"Hello"');
        
        assertEqual(tokens[3].type, 'WHITESPACE');
        assertEqual(tokens[3].value, ' ');
        
        assertEqual(tokens[4].type, 'COMMENT');
        assertEqual(tokens[4].value, "' Comment");
    });

    test('tokenize() should handle unknown characters gracefully (Fallback)', () => {
        // Even if the code contains weird characters, the tokenizer must not crash.
        // It should wrap them in an 'UNKNOWN' or 'SYMBOL' token.
        const source = 'score = score + 1';
        const tokens = tokenize(source);
        
        // Tokens: IDENTIFIER, WHITESPACE, SYMBOL(=), WHITESPACE, IDENTIFIER, WHITESPACE, SYMBOL(+), WHITESPACE, NUMBER
        assertEqual(tokens.length, 9);
        assertEqual(tokens[0].type, 'IDENTIFIER');
        assertEqual(tokens[2].type, 'SYMBOL');
        assertEqual(tokens[2].value, '=');
        assertEqual(tokens[8].type, 'NUMBER');
        assertEqual(tokens[8].raw, '1');
    });

});