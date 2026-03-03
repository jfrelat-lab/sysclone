// src/parser/subroutines.test.js
import { declareStmt, subDef } from './subroutines.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for QBasic Subroutines and Functions (AST).
 * Validates procedure declarations and full block definitions.
 */
registerSuite('QBasic Subroutines and Functions (AST)', () => {

    test('declareStmt() should parse DECLARE statements with parameters', () => {
        const dec1 = declareStmt.run('DECLARE SUB Intro ()');
        assertEqual(dec1.result.subType, 'SUB');
        assertEqual(dec1.result.name, 'INTRO');
        assertEqual(dec1.result.params.length, 0);

        // Validating multi-parameter signatures
        const dec2 = declareStmt.run('DECLARE SUB Level (WhatToDO, sammy)');
        assertEqual(dec2.result.name, 'LEVEL');
        assertEqual(dec2.result.params.length, 2);
        assertEqual(dec2.result.params[0], 'WHATTODO'); // Now correctly mapped as a string array
        assertEqual(dec2.result.params[1], 'SAMMY');
    });

    test('subDef() should parse a full SUB block', () => {
        const code = `SUB Center (row, text$)
            PRINT "Centered Text"
        END SUB`;

        const success = subDef.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.name, 'CENTER');
        assertEqual(success.result.params.length, 2);
        assertEqual(success.result.params[1], 'TEXT$'); 
        
        // Verifying that the body correctly contains the inner statement
        assertEqual(success.result.body[0].type, 'PRINT');
    });

    test('subDef() should tolerate the STATIC keyword', () => {
        const code = `SUB Level (WhatToDO) STATIC\n PRINT "Level"\n END SUB`;
        const success = subDef.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.name, 'LEVEL');
    });

});
