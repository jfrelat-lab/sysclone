// src/runtime/evaluator.test.js
import { Evaluator } from './evaluator.js';
import { Environment } from './environment.js';
import { block } from '../parser/controlFlow.js';
import { test, assertEqual, runSuite } from '../test_runner.js';

/**
 * Utility to run a generator to completion synchronously.
 * Used for testing the Evaluator without asynchronous delays.
 */
function runSync(generator) {
    let state = generator.next();
    while (!state.done) {
        state = generator.next();
    }
    return state.value; 
}

/**
 * Parses and executes a block of QBasic code within a given environment.
 */
function executeCode(env, code) {
    const ast = block.run(code).result;
    const evaluator = new Evaluator(env);
    runSync(evaluator.evaluate(ast));
}

export function runEvaluatorTests() {
    runSuite('AST Evaluator (Variables, Arrays, and Types)', () => {

        test('Should evaluate simple variables and mathematical expressions', () => {
            const env = new Environment();
            executeCode(env, `
                score = 10 + 2 * 5
                lives = score / 2
            `);
            assertEqual(env.lookup('SCORE'), 20);
            assertEqual(env.lookup('LIVES'), 10);
        });

        // --- AUDIT-DRIVEN CONTROL FLOW TESTS ---

        test('Should execute IF...THEN...ELSE blocks correctly', () => {
            const env = new Environment();
            executeCode(env, `
                score = 100
                IF score > 50 THEN
                    bonus = 10
                ELSE
                    bonus = 0
                END IF
                
                IF score < 10 THEN
                    penalty = 50
                ELSE
                    penalty = 0
                END IF
            `);
            assertEqual(env.lookup('BONUS'), 10);
            assertEqual(env.lookup('PENALTY'), 0);
        });

        test('Should execute FOR...TO...STEP loops correctly', () => {
            const env = new Environment();
            executeCode(env, `
                total = 0
                ' 1, 3, 5 -> Total should be 9
                FOR i = 1 TO 5 STEP 2
                    total = total + i
                NEXT
            `);
            assertEqual(env.lookup('TOTAL'), 9);
            // In QBasic, the iterator ends at (last valid value + step)
            assertEqual(env.lookup('I'), 7); 
        });

        // --- DATA STRUCTURE TESTS ---

        test('Should allocate and manipulate 1D arrays (DIM and ARRAY ACCESS)', () => {
            const env = new Environment();
            executeCode(env, `
                DIM arena(1 TO 10)
                arena(5) = 42
                arena(10) = arena(5) + 8
            `);
            const arrayObj = env.lookup('ARENA');
            assertEqual(arrayObj.get([5]), 42);
            assertEqual(arrayObj.get([10]), 50);
        });

        test('Should create and use custom TYPE structures (UDT)', () => {
            const env = new Environment();
            executeCode(env, `
                TYPE player
                    score AS INTEGER
                    name AS STRING
                END TYPE
                DIM p1 AS player
                p1.score = 150
                p1.name = "NIBBLES"
            `);
            const p1 = env.lookup('P1');
            assertEqual(p1.SCORE, 150);
            assertEqual(p1.NAME, "NIBBLES");
        });

        test('Should handle arrays of objects (Complex Snake-like structure)', () => {
            const env = new Environment();
            executeCode(env, `
                TYPE snakeBody
                    row AS INTEGER
                    col AS INTEGER
                END TYPE
                
                DIM snake(1 TO 50) AS snakeBody
                
                snake(1).row = 10
                snake(1).col = 20
                
                ' Simulate snake movement
                snake(2).row = snake(1).row + 1
            `);
            
            const snakeArray = env.lookup('SNAKE');
            assertEqual(snakeArray.get([1]).ROW, 10);
            assertEqual(snakeArray.get([1]).COL, 20);
            assertEqual(snakeArray.get([2]).ROW, 11);
            assertEqual(snakeArray.get([50]).ROW, 0); 
        });

        // --- SUBROUTINE AND JUMP TESTS ---

        test('Should register and execute a SUB with isolated scope', () => {
            const env = new Environment();
            executeCode(env, `
                SUB MultiplyAndAdd (a, b)
                    ' Local variable! Should not leak.
                    result = (a * b) + globalModifier
                END SUB

                globalModifier = 10
                CALL MultiplyAndAdd(5, 4)
            `);
            
            assertEqual(env.lookup('RESULT'), 0); // Local "result" should not exist globally
            assertEqual(env.lookup('GLOBALMODIFIER'), 10);
        });

        test('Should execute GOTO and GOSUB/RETURN correctly', () => {
            const env = new Environment();
            executeCode(env, `
                score = 10
                GOTO Skip
                score = 999 ' This line should be skipped!
                
                Skip:
                GOSUB Bonus
                GOTO Fin
                
                Bonus:
                score = score + 5
                RETURN
                
                Fin:
            `);
            
            assertEqual(env.lookup('SCORE'), 15);
        });

        test('Should manage static data bank (DATA, READ, RESTORE)', () => {
            const env = new Environment();
            executeCode(env, `
                READ a
                READ b
                RESTORE LevelData
                READ c
                
                DATA 10, 20
                LevelData:
                DATA 30, 40
            `);
            // CPU reads in sequence like a tape
            assertEqual(env.lookup('A'), 10);
            assertEqual(env.lookup('B'), 20);
            
            // RESTORE should rewind the tape pointer to the specific label
            assertEqual(env.lookup('C'), 30); 
        });

        test('Should gracefully ignore hardware stubs (PLAY, VIEW, RANDOMIZE) to avoid crashes', () => {
            const env = new Environment();
            // We use standard implicit calls for VIEW and PLAY to avoid breaking the parser.
            // This tests that the Evaluator correctly handles and skips them.
            const code = `
                SCREEN 0
                WIDTH 80, 25
                RANDOMIZE TIMER
                VIEW
                PLAY "T160O1L32CF"
                finished = 1
            `;
            
            try {
                // Execute code isolated in the try/catch
                executeCode(env, code);
            } catch (e) {
                // If the evaluator actually crashes, it will fail here
                assertEqual(true, false, `Regression detected: Stub command caused a crash: ${e.message}`);
            }
            
            // The assertion is OUTSIDE the try block, so its own errors don't trigger the catch.
            assertEqual(env.lookup('FINISHED'), 1);
        });

    });
}