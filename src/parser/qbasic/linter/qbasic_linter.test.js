// src/parser/qbasic/linter/qbasic_linter.test.js
import { QBasicLinter } from './qbasic_linter.js';
import { block } from '../controlFlow.js';
import { test, assertEqual, registerSuite } from '../../../test_runner.js';

/**
 * Helper utility to parse code and run it through the static analyzer.
 * @param {string} sourceCode - The QBasic code to lint.
 * @returns {Array<string>} The list of linter errors.
 */
function lintCode(sourceCode) {
    const parseState = block.run(sourceCode);
    if (parseState.isError) {
        throw new Error("Parse Error in Linter Test: " + parseState.error);
    }
    const linter = new QBasicLinter();
    return linter.lint(parseState.result);
}

registerSuite('Universal Syntax Linter (Static Analysis)', () => {

    // ========================================================================
    // SECTION 1: POSITIVE TESTS (OK - VALID CODE)
    // Goal: Ensure the Linter produces NO false positives on valid QBasic code
    // ========================================================================

    test('Linter (OK): Should allow assignments to valid user variables and FOR loops', () => {
        const code = `
            Score = 100
            Player$ = "Mario"
            FOR I = 1 TO 10
                PRINT I
            NEXT
        `;
        assertEqual(lintCode(code).length, 0, "Valid code should produce 0 linter errors");
    });

    test('Linter (OK): Should allow valid GOTO, GOSUB, and RESTORE jumps', () => {
        const code = `
            RESTORE DataBank
            GOTO MainLoop
            
            DataBank: DATA 1, 2, 3
            
            MainLoop:
                GOSUB PlayMusic
            END
            
            PlayMusic:
                BEEP
            RETURN
        `;
        assertEqual(lintCode(code).length, 0, "Valid jumps should produce 0 linter errors");
    });

    test('Linter (OK): Should correctly track ON ERROR and RESUME valid label targets', () => {
        const code = `
            ON ERROR GOTO ErrorHandler
            ErrorHandler: RESUME NEXT
        `;
        assertEqual(lintCode(code).length, 0, "Valid ON ERROR structures should produce 0 errors");
    });

    test('Linter (OK): Should track block boundaries for valid EXIT statements', () => {
        const code = `FOR I = 1 TO 10 : EXIT FOR : NEXT I`;
        assertEqual(lintCode(code).length, 0, "Valid block exits should produce 0 errors");
    });

    test('Linter (OK): Should allow valid explicit static typing', () => {
        const code = `Score% = 100 : PlayerName$ = "Luigi"`;
        assertEqual(lintCode(code).length, 0, "Valid typing should produce 0 errors");
    });

    test('Linter (OK): Should allow distinct SUB or FUNCTION definitions', () => {
        const code = `
            SUB PrintScore : END SUB
            FUNCTION GetScore : END FUNCTION
        `;
        assertEqual(lintCode(code).length, 0, "Distinct routines should produce 0 errors");
    });


    // ========================================================================
    // SECTION 2: NEGATIVE TESTS (KO - INVALID CODE)
    // Goal: Ensure the Linter catches true negatives and structural violations
    // ========================================================================

    test('Linter (KO): Should block assigning a value to a Built-in function', () => {
        const errors = lintCode(`LEN = 50`);
        assertEqual(errors.length, 1, "Should catch the illegal assignment");
        assertEqual(errors[0].includes("Cannot assign value to native function or built-in 'LEN'"), true);
    });

    test('Linter (KO): Should block using a Built-in function as a FOR loop iterator', () => {
        const code = `
            FOR ABS = 1 TO 10
                PRINT "Crash"
            NEXT
        `;
        const errors = lintCode(code);
        assertEqual(errors.length, 1);
        assertEqual(errors[0].includes("Cannot use native function or built-in 'ABS' as a FOR loop iterator"), true);
    });

    test('Linter (KO): Should block GOTO jumps to missing labels (Ghost Targets)', () => {
        const errors = lintCode(`PRINT "Start" : GOTO Nowhere`);
        assertEqual(errors.length, 1);
        assertEqual(errors[0].includes("Label not found 'NOWHERE' (Targeted by GOTO)"), true);
    });

    test('Linter (KO): Should block GOSUB jumps to missing labels', () => {
        const errors = lintCode(`CALL MySub : GOSUB MissingSubRoutine`);
        assertEqual(errors.length, 1);
        assertEqual(errors[0].includes("Label not found 'MISSINGSUBROUTINE' (Targeted by GOSUB)"), true);
    });

    test('Linter (KO): Should block Duplicate Label definitions', () => {
        const code = `
            MainMenu: PRINT "Hello"
            MainMenu: PRINT "Crash"
        `;
        const errors = lintCode(code);
        assertEqual(errors.length, 1);
        assertEqual(errors[0].includes("Duplicate label definition 'MAINMENU'"), true);
    });

    test('Linter (KO): Should block missing labels for ON ERROR and RESUME', () => {
        const err1 = lintCode(`ON ERROR GOTO MissingHandler`);
        assertEqual(err1.length, 1);
        assertEqual(err1[0].includes("Label not found 'MISSINGHANDLER' (Targeted by ON ERROR GOTO)"), true);

        const err2 = lintCode(`ErrorHandler: RESUME MissingRecoveryLabel`);
        assertEqual(err2.length, 1);
        assertEqual(err2[0].includes("Label not found 'MISSINGRECOVERYLABEL' (Targeted by RESUME)"), true);
    });

    test('Linter (KO): Should block EXIT statements outside their specific blocks', () => {
        const err1 = lintCode(`PRINT "Hello" : EXIT FOR`);
        assertEqual(err1.length, 1);
        assertEqual(err1[0].includes("EXIT FOR outside of a FOR loop"), true);

        const err2 = lintCode(`PRINT "Main Module" : EXIT SUB`);
        assertEqual(err2.length, 1);
        assertEqual(err2[0].includes("EXIT SUB outside of a SUB"), true);
    });

    test('Linter (KO): Should catch explicit static type mismatches', () => {
        const err1 = lintCode(`Score% = "Hundred"`);
        assertEqual(err1.length, 1);
        assertEqual(err1[0].includes("Type mismatch. Cannot assign a STRING to NUMERIC variable 'SCORE%'"), true);

        const err2 = lintCode(`PlayerName$ = 42`);
        assertEqual(err2.length, 1);
        assertEqual(err2[0].includes("Type mismatch. Cannot assign a NUMBER to STRING variable 'PLAYERNAME$'"), true);
    });

    test('Linter (KO): Should prevent duplicate SUB or FUNCTION definitions', () => {
        const code = `
            SUB MovePlayer : END SUB
            FUNCTION MovePlayer : END FUNCTION
        `;
        const errors = lintCode(code);
        assertEqual(errors.length, 1);
        assertEqual(errors[0].includes("Duplicate SUB/FUNCTION definition 'MOVEPLAYER'"), true);
    });

});