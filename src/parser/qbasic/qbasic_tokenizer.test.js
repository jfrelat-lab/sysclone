// src/parser/qbasic/qbasic_tokenizer.test.js
import { QBasicTokenizer } from './qbasic_tokenizer.js';
import { TokenTypes } from '../token_types.js';
import { test, assertEqual, registerSuite } from '../../test_runner.js';

registerSuite('QBasic Tokenizer (UI Strategy)', () => {
    
    // We instantiate the tokenizer once for the entire suite
    const tokenizer = new QBasicTokenizer();

    test('Should properly classify Keywords, Built-ins, and Identifiers', () => {
        // ABS is a true mathematical Built-in function, IF is a Keyword
        const tokens = tokenizer.tokenize('IF ABS MYVAR');
        
        // Filter out whitespace to simplify assertions
        const meaningful = tokens.filter(t => t.type !== TokenTypes.WHITESPACE);
        
        assertEqual(meaningful.length, 3);
        
        assertEqual(meaningful[0].type, TokenTypes.KEYWORD);
        assertEqual(meaningful[0].value, 'IF');
        
        assertEqual(meaningful[1].type, TokenTypes.BUILTIN);
        assertEqual(meaningful[1].value, 'ABS'); // ABS is correctly evaluated!
        
        assertEqual(meaningful[2].type, TokenTypes.IDENTIFIER);
        assertEqual(meaningful[2].value, 'MYVAR');
    });

    test('Should successfully tokenize Strings and Numbers', () => {
        const tokens = tokenizer.tokenize('"Hello World" 123.45 &HFF');
        const meaningful = tokens.filter(t => t.type !== TokenTypes.WHITESPACE);
        
        assertEqual(meaningful.length, 3);
        
        assertEqual(meaningful[0].type, TokenTypes.STRING);
        assertEqual(meaningful[0].value, '"Hello World"');
        
        assertEqual(meaningful[1].type, TokenTypes.NUMBER);
        assertEqual(meaningful[1].value, '123.45'); // Standard decimal
        
        assertEqual(meaningful[2].type, TokenTypes.NUMBER);
        assertEqual(meaningful[2].value, '&HFF');   // Hexadecimal
    });

    test('Should handle Comments, Symbols, and strict Whitespaces', () => {
        const tokens = tokenizer.tokenize('A = B + C \' Math note');
        
        // Let's verify the first elements including spaces this time
        assertEqual(tokens[0].type, TokenTypes.IDENTIFIER);
        assertEqual(tokens[0].value, 'A');
        
        assertEqual(tokens[1].type, TokenTypes.WHITESPACE);
        assertEqual(tokens[1].value, ' ');
        
        assertEqual(tokens[2].type, TokenTypes.SYMBOL);
        assertEqual(tokens[2].value, '=');
        
        // Verify the comment at the end
        const lastToken = tokens[tokens.length - 1];
        assertEqual(lastToken.type, TokenTypes.COMMENT);
        assertEqual(lastToken.value, "' Math note");
    });

    test('Should prevent partial prefix matching (Negative Lookahead check)', () => {
        // 'PRINTER' starts with 'PRINT' (a Built-in). 
        // It must NOT be split into [PRINT, ER], it must be a single IDENTIFIER.
        const tokens = tokenizer.tokenize('PRINTER');
        
        assertEqual(tokens.length, 1);
        assertEqual(tokens[0].type, TokenTypes.IDENTIFIER);
        assertEqual(tokens[0].value, 'PRINTER');
        
        // 'ELSEIF' vs 'ELSE' priority check
        const tokensElseIf = tokenizer.tokenize('ELSEIF');
        assertEqual(tokensElseIf.length, 1);
        assertEqual(tokensElseIf[0].type, TokenTypes.KEYWORD);
        assertEqual(tokensElseIf[0].value, 'ELSEIF');
    });

    test('Should parse a full complex line of QBasic seamlessly', () => {
        const code = 'FOR I = 1 TO 10: PRINT "N="; I: NEXT I';
        const tokens = tokenizer.tokenize(code);
        
        // Basic sanity checks to ensure the pipeline didn't crash
        assertEqual(tokens.length > 10, true);
        
        assertEqual(tokens[0].type, TokenTypes.KEYWORD);
        assertEqual(tokens[0].value, 'FOR');
        
        // Ensure the string was captured intact
        const hasString = tokens.some(t => t.type === TokenTypes.STRING && t.value === '"N="');
        assertEqual(hasString, true);
    });

});