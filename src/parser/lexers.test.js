// src/parser/lexers.test.js
import { numberLiteral, stringLiteral, identifier, eos } from './lexers.js';
import { test, assertEqual, runSuite } from '../test_runner.js';

/**
 * Unit tests for QBasic Lexers (Tokens).
 * Validates that raw text is correctly categorized into semantic units.
 */
export function runLexerTests() {
    runSuite('QBasic Lexers (Tokens)', () => {

        test('numberLiteral() should parse integers and floats', () => {
            assertEqual(numberLiteral.run('42').result, { type: 'NUMBER', value: 42 });
            // Used in Nibbles speed calculations (speed * .5)
            assertEqual(numberLiteral.run('.5').result, { type: 'NUMBER', value: 0.5 }); 
            assertEqual(numberLiteral.run('3.14').result, { type: 'NUMBER', value: 3.14 });
            // Hexadecimal parsing (e.g., BIOS Data Area addresses)
            assertEqual(numberLiteral.run('&H41A').result, { type: 'NUMBER', value: 1050 });
        });

        test('stringLiteral() should parse and extract quoted text', () => {
            assertEqual(
                stringLiteral.run('"Nibbles!"').result, 
                { type: 'STRING', value: 'Nibbles!' }
            );
        });

        test('identifier() should parse names and handle case/suffixes', () => {
            // Standard name (case-insensitive conversion)
            assertEqual(identifier.run('score').result, { type: 'IDENTIFIER', value: 'SCORE' });
            
            // With type suffixes: integer (%) or string ($)
            assertEqual(identifier.run('lives1%').result, { type: 'IDENTIFIER', value: 'LIVES1%' });
            assertEqual(identifier.run('diff$').result, { type: 'IDENTIFIER', value: 'DIFF$' });
        });

        test('eos() should handle line endings and comments', () => {
            // Should swallow comments followed by multiple line breaks
            const result1 = eos.run('  \' comment\n\n  ');
            assertEqual(result1.isError, false);

            // QBasic uses colons as multi-statement separators on a single line
            const result2 = eos.run(':\n'); 
            assertEqual(result2.isError, false);
        });

    });
}