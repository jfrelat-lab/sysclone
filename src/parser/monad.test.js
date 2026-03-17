// src/parser/monad.test.js
import { 
    str, sequenceOf, choice, many, manyOne, regex, optional, 
    capture, sequenceObj, lazy, sepBy, chainLeft, wordChoice, anyChar 
} from './monad.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for the core Monadic Parser Combinators.
 * Ensures that the building blocks of the Sysclone grammar are robust.
 */
registerSuite('Core Monadic Combinators', () => {

    test('str() should recognize an exact string', () => {
        const parseType = str('TYPE');
        const success = parseType.run('TYPE snakeBody');
        assertEqual(success.isError, false);
        assertEqual(success.result, 'TYPE');
        assertEqual(success.index, 4);
        
        const fail = parseType.run('DIM SHARED');
        assertEqual(fail.isError, true);
    });

    test('sequenceOf() should chain multiple parsers', () => {
        const parseDim = sequenceOf([str('DIM'), str(' '), str('SHARED')]);
        const success = parseDim.run('DIM SHARED arena');
        assertEqual(success.result, ['DIM', ' ', 'SHARED']);
        assertEqual(success.index, 10);
        
        const fail = parseDim.run('DIM arena');
        assertEqual(fail.isError, true);
    });

    test('choice() should validate one of several options', () => {
        const parseTypeSuffix = choice([str('$'), str('%'), str('#')]);
        assertEqual(parseTypeSuffix.run('name$').isError, true);
        assertEqual(parseTypeSuffix.run('$name').result, '$');
        assertEqual(parseTypeSuffix.run('%name').result, '%');
    });

    test('many() should loop as long as possible or return empty array', () => {
        const parseSpaces = many(str(' '));
        assertEqual(parseSpaces.run('   Hello').result, [' ', ' ', ' ']);
        assertEqual(parseSpaces.run('Hello').result, []);
        assertEqual(parseSpaces.run('Hello').isError, false); // many() never fails
    });

    test('manyOne() should fail if no match is found, otherwise loop', () => {
        const parseSpaces = manyOne(str(' '));
        assertEqual(parseSpaces.run('   Hello').result, [' ', ' ', ' ']);
        assertEqual(parseSpaces.run('Hello').isError, true); // must have at least one
    });

    test('regex() should match based on regular expressions', () => {
        const parseNumber = regex(/^[0-9]+/);
        const success = parseNumber.run('12345 is a number');
        assertEqual(success.result, '12345');
        assertEqual(success.index, 5);
        
        const fail = parseNumber.run('abc 123');
        assertEqual(fail.isError, true);
    });

    test('optional() should return result if match, or null if it fails', () => {
        const parseOptSpace = optional(str(' '));
        assertEqual(parseOptSpace.run(' Hello').result, ' ');
        assertEqual(parseOptSpace.run('Hello').result, null);
        assertEqual(parseOptSpace.run('Hello').isError, false); // optional never fails
    });

    test('capture() and sequenceObj() should build an AST object', () => {
        const parseAssignment = sequenceObj([
            capture('variable', regex(/^[A-Z]+/)),
            str('='),
            capture('value', regex(/^[0-9]+/))
        ]);

        const success = parseAssignment.run('SCORE=100');
        assertEqual(success.isError, false);
        assertEqual(success.result.variable, 'SCORE');
        assertEqual(success.result.value, '100');

        // Missing equal sign should fail the whole sequence
        assertEqual(parseAssignment.run('SCORE 100').isError, true);
    });

    test('lazy() should evaluate a thunk (Crucial for recursive parsers)', () => {
        // Mock a recursive scenario where expression uses itself
        let called = false;
        const lazyParser = lazy(() => {
            called = true;
            return str('LAZY');
        });

        assertEqual(called, false); // Should not be called on definition
        assertEqual(lazyParser.run('LAZY_TEST').result, 'LAZY');
        assertEqual(called, true);  // Evaluated only on execution
    });

    test('sepBy() should parse a list separated by a delimiter', () => {
        const parseList = sepBy(str('A'), str(','));
        assertEqual(parseList.run('A,A,A').result, ['A', 'A', 'A']);
        assertEqual(parseList.run('A').result, ['A']);
        assertEqual(parseList.run('A,').result, ['A']); // Trailing comma gracefully ignored
        assertEqual(parseList.run('B').result, []); // Empty match
    });

    test('chainLeft() should parse and associate to the left (Mathematics)', () => {
        const parseNumber = choice([str('1'), str('2'), str('3')]);
        const parseOp = str('+');
        
        const reducer = (left, op, right) => ({ left, op, right });
        const parseMath = chainLeft(parseNumber, parseOp, reducer);

        // "1+2+3" should become "((1+2)+3)"
        const ast = parseMath.run('1+2+3').result;
        assertEqual(ast.op, '+');
        assertEqual(ast.right, '3');
        assertEqual(ast.left.op, '+');
        assertEqual(ast.left.left, '1');
        assertEqual(ast.left.right, '2');
    });

    test('wordChoice() should match whole words and respect length priority', () => {
        // ELSEIF must be evaluated before ELSE, even if defined in wrong order
        const keywords = wordChoice(['ELSE', 'ELSEIF', 'IF']);
        
        // Exact matches
        assertEqual(keywords.run('IF').result.toUpperCase(), 'IF');
        assertEqual(keywords.run('ELSEIF').result.toUpperCase(), 'ELSEIF');
        
        // Negative lookahead test: should NOT match 'PRINT' inside 'PRINTER'
        const printParser = wordChoice(['PRINT']);
        assertEqual(printParser.run('PRINTER').isError, true);
    });

    test('anyChar() should match exactly one character as an ultimate fallback', () => {
        assertEqual(anyChar.run('X').result, 'X');
        assertEqual(anyChar.run('\n').result, '\n'); // Should match newlines
        assertEqual(anyChar.run(' ').result, ' ');
        assertEqual(anyChar.run('').isError, true);  // Fails on EOF
    });

});