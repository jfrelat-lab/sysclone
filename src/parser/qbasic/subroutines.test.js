// src/parser/subroutines.test.js
import { declareStmt, subDef, functionDef, defFnStmt } from './subroutines.js';
import { test, assertEqual, registerSuite } from '../../test_runner.js';

/**
 * Unit tests for QBasic Subroutines and Functions (AST).
 * Validates procedure declarations and full block definitions.
 */
registerSuite('QBasic Subroutines and Functions (AST)', () => {

    // --- DECLARE STATEMENTS ---

    test('declareStmt() should parse DECLARE statements with parameters', () => {
        const dec1 = declareStmt.run('DECLARE SUB Intro ()');
        assertEqual(dec1.isError, false);
        assertEqual(dec1.result.subType, 'SUB');
        assertEqual(dec1.result.name.toUpperCase(), 'INTRO');
        assertEqual(dec1.result.params.length, 0);

        // Validating multi-parameter signatures
        const dec2 = declareStmt.run('DECLARE SUB Level (WhatToDO, sammy)');
        assertEqual(dec2.isError, false);
        assertEqual(dec2.result.name.toUpperCase(), 'LEVEL');
        assertEqual(dec2.result.params.length, 2);
        assertEqual(dec2.result.params[0].name.toUpperCase(), 'WHATTODO');
        assertEqual(dec2.result.params[1].name.toUpperCase(), 'SAMMY');
    });

    // --- SUBROUTINES (SUB) ---

    test('subDef() should parse a full SUB block', () => {
        const code = `SUB Center (row, text$)
            PRINT "Centered Text"
        END SUB`;

        const success = subDef.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.name.toUpperCase(), 'CENTER');
        assertEqual(success.result.params.length, 2);
        assertEqual(success.result.params[1].name.toUpperCase(), 'TEXT$');
        
        // Verifying that the body correctly contains the inner statement
        assertEqual(success.result.body[0].type, 'PRINT');
    });

    test('subDef() should tolerate the STATIC keyword', () => {
        const code = `SUB Level (WhatToDO) STATIC\n PRINT "Level"\n END SUB`;
        const success = subDef.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.name.toUpperCase(), 'LEVEL');
    });

    test('subDef() should strictly support empty parentheses for no-arg routines', () => {
        const codeWithParens = `SUB MakeCityScape () \n PRINT "Building" \n END SUB`;
        const codeWithoutParens = `SUB MakeCityScape \n PRINT "Building" \n END SUB`;
        
        const successParens = subDef.run(codeWithParens);
        assertEqual(successParens.isError, false);
        assertEqual(successParens.result.name.toUpperCase(), 'MAKECITYSCAPE');
        assertEqual(successParens.result.params.length, 0); // Empty array, no crash!

        const successNoParens = subDef.run(codeWithoutParens);
        assertEqual(successNoParens.isError, false);
        assertEqual(successNoParens.result.name.toUpperCase(), 'MAKECITYSCAPE');
        assertEqual(successNoParens.result.params.length, 0);
    });

    test('subDef() should parse complex parameter signatures (AS TYPE, Arrays)', () => {
        // This is crucial for Nibbles and Gorillas which pass typed arrays
        const code = `SUB DrawRect (x, y, col AS INTEGER, snake() AS ANY)\n PRINT "Drawing"\nEND SUB`;
        const success = subDef.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.params.length, 4);
        
        assertEqual(success.result.params[0].name.toUpperCase(), 'X');
        assertEqual(success.result.params[0].varType, 'VARIANT');
        
        assertEqual(success.result.params[2].name.toUpperCase(), 'COL');
        assertEqual(success.result.params[2].varType.toUpperCase(), 'INTEGER');
        
        assertEqual(success.result.params[3].name.toUpperCase(), 'SNAKE');
        assertEqual(success.result.params[3].isArray, true);
        assertEqual(success.result.params[3].varType.toUpperCase(), 'ANY');
    });

    test('subDef() should parse no-params with STATIC keyword', () => {
        const code = `SUB BoxInit STATIC\n PRINT "Box"\n END SUB`;
        const success = subDef.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.name.toUpperCase(), 'BOXINIT');
        assertEqual(success.result.isStatic, true);
        assertEqual(success.result.params.length, 0);
    });

    // --- FUNCTIONS (FUNCTION) ---

    test('functionDef() should parse a full FUNCTION block', () => {
        const code = `FUNCTION FnRan (x)\n  FnRan = INT(RND(1) * x) + 1\nEND FUNCTION`;
        
        const success = functionDef.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'FUNCTION_DEF');
        assertEqual(success.result.name.toUpperCase(), 'FNRAN');
        assertEqual(success.result.params.length, 1);
        assertEqual(success.result.params[0].name.toUpperCase(), 'X');
        
        // Ensure the body captured the assignment
        assertEqual(success.result.body[0].type, 'ASSIGN');
    });

    test('functionDef() should handle empty or omitted parentheses', () => {
        const code = `FUNCTION GetTime\n GetTime = TIMER\nEND FUNCTION`;
        
        const success = functionDef.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'FUNCTION_DEF');
        assertEqual(success.result.name.toUpperCase(), 'GETTIME');
        assertEqual(success.result.params.length, 0);
    });

    test('functionDef() should parse with STATIC keyword', () => {
        // Typical use-case for accumulating values across calls
        const code = `FUNCTION CalcScore (hits) STATIC\n CalcScore = hits * 10\nEND FUNCTION`;
        
        const success = functionDef.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'FUNCTION_DEF');
        assertEqual(success.result.name.toUpperCase(), 'CALCSCORE');
        assertEqual(success.result.isStatic, true);
        assertEqual(success.result.params.length, 1);
        assertEqual(success.result.params[0].name.toUpperCase(), 'HITS');
    });

    // --- MACRO FUNCTIONS (DEF FN) ---

    test('defFnStmt() should parse a single-line DEF FN macro', () => {
        // This exact syntax is used in Gorillas.bas for random calculations
        const code = `DEF FnRan (x) = INT(RND(1) * x) + 1`;
        
        const success = defFnStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'DEF_FN');
        assertEqual(success.result.name.toUpperCase(), 'FNRAN');
        
        // Verifying the parameter signature
        assertEqual(success.result.params.length, 1);
        assertEqual(success.result.params[0].name.toUpperCase(), 'X');
        
        // Verifying the right-side expression (Should be a BINARY_OP '+')
        assertEqual(success.result.expression.type, 'BINARY_OP');
        assertEqual(success.result.expression.operator, '+');
    });

});