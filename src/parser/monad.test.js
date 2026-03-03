// src/parser/monad.test.js
import { str, sequenceOf, choice, many, sepBy, chainLeft } from './monad.js';
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
        assertEqual(success.isError, false);
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

    test('many() should loop as long as possible', () => {
        const parseSpaces = many(str(' '));
        
        const success = parseSpaces.run('   Hello');
        assertEqual(success.result, [' ', ' ', ' ']);
        assertEqual(success.index, 3);
        
        const empty = parseSpaces.run('Hello');
        assertEqual(empty.isError, false);
        assertEqual(empty.result, []);
    });

    // --- AUDIT-DRIVEN TESTS ---

    test('sepBy() should parse a list separated by a delimiter', () => {
        const parseList = sepBy(str('A'), str(','));
        
        // List with multiple elements
        assertEqual(parseList.run('A,A,A').result, ['A', 'A', 'A']);
        
        // List with a single element
        assertEqual(parseList.run('A').result, ['A']);
        
        // If separator is present but followed by nothing, ignore gracefully
        assertEqual(parseList.run('A,').result, ['A']);
        
        // If the list does not match, return an empty array
        assertEqual(parseList.run('B').result, []);
    });

    test('chainLeft() should parse and associate to the left (Mathematics)', () => {
        const parseNumber = choice([str('1'), str('2'), str('3')]);
        const parseOp = str('+');
        
        // A simple reducer that creates a binary tree node
        const reducer = (left, op, right) => ({ left, op, right });
        const parseMath = chainLeft(parseNumber, parseOp, reducer);

        // "1 + 2 + 3" should be read as "(1 + 2) + 3" (Left Associativity)
        const ast = parseMath.run('1+2+3').result;
        
        assertEqual(ast.op, '+');
        assertEqual(ast.right, '3');
        assertEqual(ast.left.op, '+');
        assertEqual(ast.left.left, '1');
        assertEqual(ast.left.right, '2');
    });

});
