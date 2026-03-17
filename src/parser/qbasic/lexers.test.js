// src/parser/lexers.test.js
import { numberLiteral, signedNumberLiteral, stringLiteral, identifier, eos, commentLexer, whitespaceLexer, symbolLexer } from './lexers.js';
import { test, assertEqual, registerSuite } from '../../test_runner.js';

/**
 * Unit tests for QBasic Lexers (Tokens).
 * Validates that raw text is correctly categorized into semantic units.
 */
registerSuite('QBasic Lexers (Tokens)', () => {

    // --- CORE AST LEXERS ---

    test('numberLiteral() should parse integers, floats, and Hexadecimals', () => {
        assertEqual(numberLiteral.run('42').result.value, 42);
        assertEqual(numberLiteral.run('.5').result.value, 0.5); 
        assertEqual(numberLiteral.run('3.14').result.value, 3.14);
        assertEqual(numberLiteral.run('&H41A').result.value, 1050);
        
        // Ensure raw string representation is preserved for UI rendering
        assertEqual(numberLiteral.run('&H41A').result.raw, '&H41A');
    });

    test('numberLiteral() should safely ignore QBasic type suffixes (%, &, !, #)', () => {
        // Long Integer (&) and Integer (%) suffixes
        assertEqual(numberLiteral.run('327686&').result.value, 327686);
        assertEqual(numberLiteral.run('60%').result.value, 60);
        
        // Hexadecimal with suffix
        assertEqual(numberLiteral.run('&H1A&').result.value, 26);
    });

    test('numberLiteral() should parse Scientific Notation (E and D)', () => {
        // Standard scientific notation
        assertEqual(numberLiteral.run('1.5E2').result.value, 150);
        
        // QBasic uses 'D' for Double Precision exponents
        assertEqual(numberLiteral.run('2.5D-1').result.value, 0.25);
    });

    test('signedNumberLiteral() should parse positive, negative, and unsigned numbers', () => {
        // Unsigned (delegates purely to numberLiteral)
        assertEqual(signedNumberLiteral.run('100').result.value, 100);
        
        // Negative values
        const negRes = signedNumberLiteral.run('-42');
        assertEqual(negRes.isError, false);
        assertEqual(negRes.result.value, -42);
        assertEqual(negRes.result.raw, '-42');
        
        // Explicit positive values
        const posRes = signedNumberLiteral.run('+3.14');
        assertEqual(posRes.isError, false);
        assertEqual(posRes.result.value, 3.14);
        assertEqual(posRes.result.raw, '+3.14');
        
        // Negative Hexadecimal (Yes, this is valid in QBasic DATA statements!)
        assertEqual(signedNumberLiteral.run('-&HFF').result.value, -255);
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

    test('symbolLexer() should capture operators and punctuation', () => {
        const sym = symbolLexer.run('()=+,');
        assertEqual(sym.result.type, 'SYMBOL');
        assertEqual(sym.result.value, '()=+,');
    });

    // --- LEGACY COMMENTS (REM) ---

    test('eos() should handle REM comments and compiler directives ($STATIC)', () => {
        // Standard REM comment
        const res1 = eos.run('  REM This is a comment\n\n  ');
        assertEqual(res1.isError, false);
        
        // Compiler directives used in Gorillas
        const res2 = eos.run(' REM $STATIC\n'); 
        assertEqual(res2.isError, false);

        // Case insensitivity
        const res3 = eos.run(' rem lowercase comment\n');
        assertEqual(res3.isError, false);
    });

    test('commentLexer() should capture REM and respect word boundaries (\\b)', () => {
        // Standard capture
        const com1 = commentLexer.run("REM This is a comment\n");
        assertEqual(com1.result.type, 'COMMENT');
        assertEqual(com1.result.value, "REM This is a comment");

        // Capturing legacy compiler pragmas
        const com2 = commentLexer.run("rem $STATIC\n");
        assertEqual(com2.result.type, 'COMMENT');
        assertEqual(com2.result.value, "rem $STATIC");

        // CRITICAL: Should NOT parse "REMARK" as a "REM" comment
        // This validates the \b (word boundary) in your regex
        const com3 = commentLexer.run("REMARKABLE = 10");
        assertEqual(com3.isError, true); 
    });

    test('identifier() should reject REM but accept words starting with REM', () => {
        // REM is now a reserved keyword
        assertEqual(identifier.run('REM').isError, true);
        assertEqual(identifier.run('rem').isError, true);
        
        // But words containing REM must still be valid variables
        const validId = identifier.run('REMARKABLE');
        assertEqual(validId.isError, false);
        assertEqual(validId.result.value, 'REMARKABLE');
        
        const validId2 = identifier.run('remnant$');
        assertEqual(validId2.isError, false);
        assertEqual(validId2.result.value, 'REMNANT$');
    });

});