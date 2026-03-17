// src/parser/declarations.test.js
import { defintDecl, constDecl, typeDecl, dimDecl, redimDecl } from './declarations.js';
import { test, assertEqual, registerSuite } from '../../test_runner.js';

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

    test('constDecl() should parse a single constant', () => {
        const ast = constDecl.run('CONST MAX = 100').result;
        assertEqual(ast.type, 'CONST');
        assertEqual(ast.declarations.length, 1);
        assertEqual(ast.declarations[0].name, 'MAX');
        assertEqual(ast.declarations[0].value.value, 100);
    });

    test('constDecl() should parse multiple constants separated by commas', () => {
        const ast = constDecl.run('CONST MAX = 100, MIN = 10').result;
        assertEqual(ast.type, 'CONST');
        assertEqual(ast.declarations.length, 2);
        assertEqual(ast.declarations[0].name, 'MAX');
        assertEqual(ast.declarations[0].value.value, 100);
        assertEqual(ast.declarations[1].name, 'MIN');
        assertEqual(ast.declarations[1].value.value, 10);
    });

    test('typeDecl() should parse TYPE structures including fixed-length strings', () => {
        const code = `TYPE TORUS
            Sect AS INTEGER
            Bord AS STRING * 3
        END TYPE`;
        const ast = typeDecl.run(code).result;
        
        assertEqual(ast.type, 'TYPE_DECL');
        assertEqual(ast.name, 'TORUS');
        assertEqual(ast.fields.length, 2);
        
        // Assert normal field
        assertEqual(ast.fields[0].name, 'SECT');
        assertEqual(ast.fields[0].type, 'INTEGER');
        assertEqual(ast.fields[0].length, null);
        
        // Assert fixed-length string field
        assertEqual(ast.fields[1].name, 'BORD');
        assertEqual(ast.fields[1].type, 'STRING');
        assertEqual(ast.fields[1].length.type, 'NUMBER');
        assertEqual(ast.fields[1].length.value, 3);
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

    test('dimDecl() should parse DIM with fixed-length strings', () => {
        // Syntax from sortdemo.bas
        const code = `DIM SHARED OptionTitle(1 TO NUMOPTIONS) AS STRING * 12`;
        const ast = dimDecl.run(code).result;
        
        assertEqual(ast.type, 'DIM');
        assertEqual(ast.shared, true);
        
        const decl = ast.declarations[0];
        assertEqual(decl.name, 'OPTIONTITLE');
        assertEqual(decl.isArray, true);
        assertEqual(decl.varType, 'STRING');
        
        // Assert fixed string length
        assertEqual(decl.length.type, 'NUMBER');
        assertEqual(decl.length.value, 12);
        
        // Assert array bounds parsing remains unaffected
        assertEqual(decl.bounds[0].min.value, 1);
        assertEqual(decl.bounds[0].max.value, 'NUMOPTIONS');
    });

    test('redimDecl() should parse dynamic array reallocation', () => {
        // Syntax from Gorillas.bas
        const ast = redimDecl.run('REDIM LBan&(8), RBan&(8)').result;
        
        assertEqual(ast.type, 'REDIM');
        assertEqual(ast.shared, false);
        assertEqual(ast.declarations.length, 2);
        
        // Verify first declaration
        assertEqual(ast.declarations[0].name, 'LBAN&');
        assertEqual(ast.declarations[0].isArray, true);
        assertEqual(ast.declarations[0].bounds[0].max.value, 8);
        
        // Verify second declaration
        assertEqual(ast.declarations[1].name, 'RBAN&');
        assertEqual(ast.declarations[1].isArray, true);
    });
});
