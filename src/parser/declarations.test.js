// src/parser/declarations.test.js
import { defintDecl, constDecl, typeDecl, dimDecl } from './declarations.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for QBasic Declarations.
 * Ensures that variables, constants, types, and arrays are correctly transformed into AST nodes.
 */
registerSuite('QBasic Declarations (AST)', () => {

    test('defintDecl() should parse DEFINT A-Z', () => {
        const ast = defintDecl.run('DEFINT A-Z').result;
        assertEqual(ast.type, 'DEFINT');
        assertEqual(ast.range, 'A-Z');
    });

    test('constDecl() should parse constants', () => {
        const ast = constDecl.run('CONST MAX = 100').result;
        assertEqual(ast.type, 'CONST');
        assertEqual(ast.name, 'MAX');
        assertEqual(ast.value.value, 100);
    });

    test('typeDecl() should parse TYPE structures', () => {
        const code = `TYPE player\n score AS INTEGER\n END TYPE`;
        const ast = typeDecl.run(code).result;
        
        assertEqual(ast.type, 'TYPE_DECL');
        assertEqual(ast.name, 'PLAYER');
        assertEqual(ast.fields.length, 1);
        assertEqual(ast.fields[0].name, 'SCORE');
        assertEqual(ast.fields[0].type, 'INTEGER');
    });

    test('dimDecl() should parse DIM and DIM SHARED', () => {
        // Test a simple shared variable
        const ast1 = dimDecl.run('DIM SHARED curLevel AS INTEGER').result;
        assertEqual(ast1.type, 'DIM');
        assertEqual(ast1.shared, true);
        // Verify declaration list structure
        assertEqual(ast1.declarations[0].name, 'CURLEVEL');
        assertEqual(ast1.declarations[0].varType, 'INTEGER');

        // Test a multi-dimensional array with custom bounds (1 TO 10, 20)
        const ast2 = dimDecl.run('DIM arena(1 TO 10, 20) AS STRING').result;
        const decl = ast2.declarations[0];
        assertEqual(decl.isArray, true);
        
        // Verify mathematical expressions in bounds
        assertEqual(decl.bounds[0].min.value, 1);
        assertEqual(decl.bounds[0].max.value, 10);
        assertEqual(decl.bounds[1].min.value, 0); // "20" implies "0 TO 20"
        assertEqual(decl.bounds[1].max.value, 20);
        assertEqual(decl.varType, 'STRING');
    });

});
