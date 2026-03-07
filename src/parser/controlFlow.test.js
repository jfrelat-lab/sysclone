// src/parser/controlFlow.test.js
import { forStmt, doPreCondStmt, doPostCondStmt, ifStmt, selectCaseStmt, whileWendStmt } from './controlFlow.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for QBasic Control Flow (AST).
 * Ensures that loops, branches, and conditional blocks are correctly structured.
 */
registerSuite('QBasic Control Flow (AST)', () => {

    test('forStmt() should parse a loop with and without STEP', () => {
        const simpleFor = forStmt.run('FOR i = 1 TO 10\n PRINT "hello"\n NEXT i');
        assertEqual(simpleFor.result.variable, 'I');
        assertEqual(simpleFor.result.start.value, 1);
        assertEqual(simpleFor.result.end.value, 10);
        assertEqual(simpleFor.result.step.value, 1);
        assertEqual(simpleFor.result.body.length, 1);
        
        assertEqual(simpleFor.result.body[0].type, 'PRINT');
        assertEqual(simpleFor.result.body[0].values[0].type, 'STRING');
        assertEqual(simpleFor.result.body[0].values[0].value, 'hello');

        const stepFor = forStmt.run('FOR b = 0 TO 100 STEP 5\n NEXT');
        assertEqual(stepFor.result.variable, 'B');
        assertEqual(stepFor.result.step.value, 5);
    });

    test('doPostCondStmt() should parse DO ... LOOP UNTIL', () => {
        const code = `DO\n PRINT "Game Over"\n LOOP UNTIL playerDied = -1`; 
        const success = doPostCondStmt.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'DO_POST_COND'); 
        assertEqual(success.result.loopType, 'UNTIL'); 
    });

    test('doPostCondStmt() should parse multiplexed DO: LOOP UNTIL with colons', () => {
        const code = `DO: LOOP UNTIL TIMER - t > 1`;
        const success = doPostCondStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'DO_POST_COND');
        assertEqual(success.result.loopType, 'UNTIL');
        assertEqual(success.result.body.length, 0); 
    });

    test('doPostCondStmt() should parse infinite DO ... LOOP', () => {
        const code = `DO\n a = 1\n LOOP`;
        const success = doPostCondStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'DO_POST_COND');
        assertEqual(success.result.loopType, 'NONE');
        assertEqual(success.result.condition, null);
    });

    test('doPreCondStmt() should parse DO WHILE ... LOOP', () => {
        const code = `DO WHILE a < 10\n a = a + 1\n LOOP`;
        const success = doPreCondStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'DO_PRE_COND');
        assertEqual(success.result.loopType, 'WHILE');
    });

    test('ifStmt() should handle nested blocks (IF inside IF)', () => {
        const code = `IF lives = 0 THEN
            PRINT "Dead"
            IF score > 100 THEN
                PRINT "High Score"
            END IF
        ELSE
            PRINT "Alive"
        END IF`;
        
        const success = ifStmt.run(code);
        assertEqual(success.isError, false);
        
        const cond = success.result.condition;
        assertEqual(cond.operator, '=');
        assertEqual(cond.left.value, 'LIVES');
        assertEqual(cond.right.value, 0);

        assertEqual(success.result.thenBlock.length, 2); 
        assertEqual(success.result.thenBlock[1].type, 'IF'); 
        
        assertEqual(success.result.elseBlock[0].type, 'PRINT');
        assertEqual(success.result.elseBlock[0].values[0].value, 'Alive');
    });

    test('selectCaseStmt() should parse SELECT CASE while ignoring empty lines', () => {
        const code = `SELECT CASE level
            
            CASE 1
                PRINT "Easy"
            
            CASE ELSE
                PRINT "Hard"

        END SELECT`;
        
        const success = selectCaseStmt.run(code);
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'SELECT_CASE');
        assertEqual(success.result.testExpr.value, 'LEVEL');
        assertEqual(success.result.cases.length, 1);
        assertEqual(success.result.cases[0].exprs[0].value, 1);
        
        assertEqual(success.result.cases[0].body[0].type, 'PRINT');
        assertEqual(success.result.caseElse[0].type, 'PRINT');
    });

    test('ifStmt() should handle classic Single-Line IF', () => {
        const code = `IF lives = 0 THEN GOTO GameOver ELSE score = score + 10`;
        const success = ifStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'IF');
        
        assertEqual(success.result.thenBlock[0].type, 'GOTO');
        assertEqual(success.result.thenBlock[0].label, 'GAMEOVER');
        
        assertEqual(success.result.elseBlock[0].type, 'ASSIGN');
        assertEqual(success.result.elseBlock[0].target.value, 'SCORE');
    });

    test('ifStmt() should handle Single-Line IF with colons', () => {
        const code = `IF lives = 0 THEN score = 0 : dead = 1 ELSE score = 100 : dead = 0`;
        const success = ifStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'IF');
        
        // THEN block must contain exactly TWO statements
        assertEqual(success.result.thenBlock.length, 2);
        assertEqual(success.result.thenBlock[0].target.value, 'SCORE');
        assertEqual(success.result.thenBlock[1].target.value, 'DEAD');
        
        // Same for the ELSE block
        assertEqual(success.result.elseBlock.length, 2);
    });

    test('ifStmt() must strictly separate single-line and multi-line (Nibbles Bug fix)', () => {
        const code = `IF number = 10 THEN
            IF diff$ = "P" THEN speed = speed - 10 : curSpeed = speed
            number = 1
        END IF`;
        
        const success = ifStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'IF');
        
        // The main multi-line THEN must contain 2 statements
        assertEqual(success.result.thenBlock.length, 2);
        
        // The first statement is the inner single-line IF
        const subIf = success.result.thenBlock[0];
        assertEqual(subIf.type, 'IF');
        assertEqual(subIf.thenBlock.length, 2); // speed = ... : curSpeed = ...
        assertEqual(subIf.thenBlock[0].target.value, 'SPEED');
        assertEqual(subIf.thenBlock[1].target.value, 'CURSPEED');
        
        // The second statement is the assignment "number = 1"
        const assignStmt = success.result.thenBlock[1];
        assertEqual(assignStmt.type, 'ASSIGN');
        assertEqual(assignStmt.target.value, 'NUMBER');
        assertEqual(assignStmt.value.value, 1);
    });

    test('whileWendStmt() should parse a WHILE ... WEND loop', () => {
        const code = `WHILE INKEY$ <> ""\n PRINT "Flushing..."\n WEND`;
        const success = whileWendStmt.run(code);
        
        assertEqual(success.isError, false);
        assertEqual(success.result.type, 'WHILE_WEND');
        assertEqual(success.result.condition.operator, '<>');
        assertEqual(success.result.body[0].type, 'PRINT');
    });

});
