// src/parser/lexers.test.js
import { numberLiteral, stringLiteral, identifier, eos, commentLexer, whitespaceLexer, anyKeywordLexer, symbolLexer } from './lexers.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for QBasic Lexers (Tokens).
 * Validates that raw text is correctly categorized into semantic units.
 */
registerSuite('QBasic Lexers (Tokens)', () => {

    test('numberLiteral() should parse integers and floats', () => {
        assertEqual(numberLiteral.run('42').result.value, 42);
        assertEqual(numberLiteral.run('.5').result.value, 0.5); 
        assertEqual(numberLiteral.run('3.14').result.value, 3.14);
        assertEqual(numberLiteral.run('&H41A').result.value, 1050);
        // Ensure raw string representation is preserved for UI rendering
        assertEqual(numberLiteral.run('&H41A').result.raw, '&H41A');
    });

    test('stringLiteral() should parse and extract quoted text', () => {
        const strRes = stringLiteral.run('"Nibbles!"').result;
        assertEqual(strRes.value, 'Nibbles!');
        assertEqual(strRes.raw, '"Nibbles!"'); // Crucial for UI Syntax Highlighting
    });

    test('identifier() should parse names and handle case/suffixes', () => {
        // Standard name (case-insensitive conversion, preserving raw)
        assertEqual(identifier.run('score').result, { type: 'IDENTIFIER', value: 'SCORE', raw: 'score' });
        
        // With type suffixes: integer (%) or string ($)
        assertEqual(identifier.run('lives1%').result, { type: 'IDENTIFIER', value: 'LIVES1%', raw: 'lives1%' });
        assertEqual(identifier.run('diff$').result, { type: 'IDENTIFIER', value: 'DIFF$', raw: 'diff$' });
        
        // Should reject keywords
        assertEqual(identifier.run('PRINT').isError, true);
    });

    test('eos() should handle line endings and comments (AST Core)', () => {
        const result1 = eos.run('  \' comment\n\n  ');
        assertEqual(result1.isError, false);
        const result2 = eos.run(':\n'); 
        assertEqual(result2.isError, false);
    });

    // --- TOKENIZER UI LEXERS ---

    test('commentLexer() and whitespaceLexer() should capture raw text', () => {
        const comRes = commentLexer.run("' This is a comment\n");
        assertEqual(comRes.result.type, 'COMMENT');
        assertEqual(comRes.result.value, "' This is a comment");

        const wsRes = whitespaceLexer.run("  \t\n  ");
        assertEqual(wsRes.result.type, 'WHITESPACE');
        assertEqual(wsRes.result.value, "  \t\n  ");
    });

    test('anyKeywordLexer() should dynamically match any reserved keyword', () => {
        const kw1 = anyKeywordLexer.run('pRiNt ');
        assertEqual(kw1.result.type, 'KEYWORD');
        assertEqual(kw1.result.value, 'pRiNt'); // Preserves original case for UI

        // Should reject normal identifiers
        const kw2 = anyKeywordLexer.run('myVar');
        assertEqual(kw2.isError, true);
    });

    test('symbolLexer() should capture operators and punctuation', () => {
        const sym = symbolLexer.run('()=+,');
        assertEqual(sym.result.type, 'SYMBOL');
        assertEqual(sym.result.value, '()=+,');
    });

});