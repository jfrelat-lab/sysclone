// src/parser/expressions.test.js
import { expression } from './expressions.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for QBasic Expressions and Operator Precedence.
 * Validates the generation of the Abstract Syntax Tree (AST) for math and logic.
 */
registerSuite('QBasic Expressions and Precedence (AST)', () => {

    test('expression() should respect mathematical precedence (BODMAS/PEMDAS)', () => {
        // 1 + (2 * 3)
        const ast = expression.run('1 + 2 * 3').result;
        assertEqual(ast.operator, '+');
        assertEqual(ast.right.operator, '*');
    });

    test('expression() should handle function calls: INT(5.5)', () => {
        const ast = expression.run('INT(5.5)').result;
        assertEqual(ast.type, 'CALL');
        assertEqual(ast.callee.value, 'INT');
        assertEqual(ast.args.length, 1);
        assertEqual(ast.args[0].value, 5.5);
    });

    test('expression() should handle array access and property member access', () => {
        // Complex case: arena(row, col).sister
        const ast = expression.run('arena(row, col).sister').result;
        
        assertEqual(ast.type, 'MEMBER_ACCESS');
        assertEqual(ast.property, 'SISTER');
        
        // The accessed object is the function/array call 'arena(row, col)'
        const obj = ast.object;
        assertEqual(obj.type, 'CALL');
        assertEqual(obj.callee.value, 'ARENA');
        assertEqual(obj.args[0].value, 'ROW');
        assertEqual(obj.args[1].value, 'COL');
    });

    test('expression() should parse unary operators (- and NOT)', () => {
        // Mathematical unary: -10 + 5
        const astMath = expression.run('-10 + 5').result;
        assertEqual(astMath.operator, '+');
        assertEqual(astMath.left.type, 'UNARY_OP');
        assertEqual(astMath.left.operator, '-');
        assertEqual(astMath.left.argument.value, 10);

        /**
         * Logical unary: NOT -1 AND 0
         * In QBasic, -1 is commonly used for True and 0 for False.
         */
        const astLogic = expression.run('NOT -1 AND 0').result;
        assertEqual(astLogic.operator, 'AND');
        assertEqual(astLogic.left.type, 'UNARY_OP');
        assertEqual(astLogic.left.operator, 'NOT');
        
        // Note: '-1' is itself a UNARY_OP (-) applied to a NUMBER (1)
        assertEqual(astLogic.left.argument.type, 'UNARY_OP');
        assertEqual(astLogic.left.argument.operator, '-');
        assertEqual(astLogic.left.argument.argument.value, 1);
    });
});
