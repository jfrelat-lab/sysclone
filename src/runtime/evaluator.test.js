// src/runtime/evaluator.test.js
import { Evaluator } from './evaluator.js';
import { Environment } from './environment.js';
import { block } from '../parser/controlFlow.js';
import { Memory } from '../hardware/memory.js';
import { VGA } from '../hardware/vga.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

// ============================================================================
// UTILITIES
// ============================================================================

function runSync(generator) {
    let state = generator.next();
    while (!state.done) {
        state = generator.next();
    }
    return state.value; 
}

function executeCode(env, code) {
    const ast = block.run(code).result;
    const evaluator = new Evaluator(env);
    runSync(evaluator.evaluate(ast));
}

/**
 * Helper to execute raw QBasic code and return the final Environment state.
 * Crucial: It does NOT pass a manual environment, allowing the Evaluator 
 * to build its strict 3-Tier RAM natively for accurate scoping tests.
 */
function executeToEnv(sourceCode) {
    const evaluator = new Evaluator(); 
    const ast = block.run(sourceCode).result;
    const process = evaluator.evaluate(ast);
    
    let state = process.next();
    while (!state.done) {
        state = process.next();
    }
    return evaluator.env; 
}

// ============================================================================
// SUITE 1: AST Evaluator (Variables, Arrays, and Types)
// ============================================================================
registerSuite('AST Evaluator (Variables, Arrays, and Types)', () => {

    test('Should evaluate simple variables and mathematical expressions', () => {
        const env = new Environment();
        executeCode(env, `score = 10 + 2 * 5 : lives = score / 2`);
        assertEqual(env.lookup('SCORE'), 20);
        assertEqual(env.lookup('LIVES'), 10);
    });

    test('Should evaluate exponentiation (^) correctly', () => {
        const env = new Environment();
        executeCode(env, `square = 5 ^ 2 : cube = 2 ^ 3 : complex = 10 + 2 * 3 ^ 2`);
        assertEqual(env.lookup('SQUARE'), 25);
        assertEqual(env.lookup('CUBE'), 8);
        assertEqual(env.lookup('COMPLEX'), 28);
    });

    test('Should correctly allocate scalar variables without turning them into arrays', () => {
        const env = new Environment();
        executeCode(env, `
            DIM lives AS INTEGER
            IF lives = 0 THEN status = 1 ELSE status = 2
        `);
        const livesVar = env.lookup('LIVES');
        assertEqual(typeof livesVar, 'number', "lives should be a primitive number");
        assertEqual(livesVar, 0, "lives should default to 0");
        assertEqual(env.lookup('STATUS'), 1, "The engine failed to evaluate lives = 0");
    });

    test('Should execute IF...THEN...ELSE blocks correctly', () => {
        const env = new Environment();
        executeCode(env, `
            score = 100
            IF score > 50 THEN bonus = 10 ELSE bonus = 0
            IF score < 10 THEN penalty = 50 ELSE penalty = 0
        `);
        assertEqual(env.lookup('BONUS'), 10);
        assertEqual(env.lookup('PENALTY'), 0);
    });

    test('Should execute FOR...TO...STEP loops correctly', () => {
        const env = new Environment();
        executeCode(env, `
            total = 0
            FOR i = 1 TO 5 STEP 2
                total = total + i
            NEXT
        `);
        assertEqual(env.lookup('TOTAL'), 9);
        assertEqual(env.lookup('I'), 7); 
    });

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

    test('Should perfectly isolate identical labels across different subroutines', () => {
        const env = new Environment();
        executeCode(env, `
            DIM SHARED mainVal, sub1Val
            SUB RoutineOne ()
                sub1Val = 1 : GOTO JumpTarget : sub1Val = 999
                JumpTarget: sub1Val = 2
            END SUB
            mainVal = 1 : GOTO JumpTarget : mainVal = 999
            JumpTarget: mainVal = 2
            CALL RoutineOne()
        `);
        assertEqual(env.lookup('MAINVAL'), 2, "Main scope label resolution failed");
        assertEqual(env.lookup('SUB1VAL'), 2, "Subroutine 1 local label resolution failed");
    });

    test('Should manage global DATA bank across subroutines and modules', () => {
        const env = new Environment();
        executeCode(env, `
            DIM SHARED global1, global2, global3
            SUB ReadTheData ()
                READ global2
            END SUB
            READ global1
            RESTORE LevelData
            CALL ReadTheData()
            READ global3
            DATA 10, 20
            LevelData: DATA 30, 40
        `);
        assertEqual(env.lookup('GLOBAL1'), 10);
        assertEqual(env.lookup('GLOBAL2'), 30);
        assertEqual(env.lookup('GLOBAL3'), 40);
    });

});

// ============================================================================
// SUITE 2: Hardware Integration & I/O
// ============================================================================
registerSuite('AST Evaluator (Hardware Integration & HAL)', () => {

    function executeWithHardware(env, hardware, code) {
        const ast = block.run(code).result;
        const evaluator = new Evaluator(env, hardware);
        runSync(evaluator.evaluate(ast));
    }

    test('Should interface correctly with VGA for CLS, COLOR, LOCATE, and PRINT', () => {
        const env = new Environment();
        const mockVga = {
            clsCalled: false, located: null, colored: null, cursorState: null, printed: [],
            cls() { this.clsCalled = true; },
            locate(r, c) { this.located = [r, c]; },
            color(f, b) { this.colored = [f, b]; },
            showCursor() { this.cursorState = 'VISIBLE'; },
            hideCursor() { this.cursorState = 'HIDDEN'; },
            print(data) { this.printed.push(Array.from(data).map(b => String.fromCharCode(b)).join('')); }
        };
        executeWithHardware(env, { vga: mockVga }, `
            CLS : COLOR 10, 2 : LOCATE 5, 15, 1 : PRINT "SYSCLONE" : LOCATE , , 0
        `);
        assertEqual(mockVga.clsCalled, true);
        assertEqual(mockVga.colored[0], 10); 
        assertEqual(mockVga.located[0], null); 
        assertEqual(mockVga.cursorState, 'HIDDEN');
        assertEqual(mockVga.printed[0], "SYSCLONE\r\n");
    });

    test('Should interface correctly with Memory for POKE', () => {
        const env = new Environment();
        const mockMemory = {
            poked: null,
            poke(address, value) { this.poked = { address, value }; }
        };
        executeWithHardware(env, { memory: mockMemory }, 'POKE &H41A, 30');
        assertEqual(mockMemory.poked.address, 1050); 
        assertEqual(mockMemory.poked.value, 30);
    });

});

// ============================================================================
// SUITE 3: MS-DOS PRINT Formatting Rules
// ============================================================================
registerSuite('Evaluator: PRINT Statement Formatting (MS-DOS Rules)', () => {

    function capturePrintOutput(sourceCode) {
        const env = new Environment();
        const mockVga = {
            output: "",
            print: function(bytes) { this.output += String.fromCharCode(...bytes); }
        };
        const evaluator = new Evaluator(env, { vga: mockVga });
        const ast = block.run(sourceCode).result;
        const process = evaluator.evaluate(ast);
        let state = process.next();
        while (!state.done) state = process.next();
        return mockVga.output;
    }

    test('Strings should print exactly as provided without added spaces', () => {
        assertEqual(capturePrintOutput(`PRINT "HELLO"`), "HELLO\r\n");
        assertEqual(capturePrintOutput(`PRINT "A"; "B"`), "AB\r\n");
    });

    test('Positive numbers and Zero must include a leading and trailing space', () => {
        assertEqual(capturePrintOutput(`PRINT 42`), " 42 \r\n");
        assertEqual(capturePrintOutput(`PRINT 0`), " 0 \r\n");
    });

    test('Negative numbers must include a trailing space, but no leading space', () => {
        assertEqual(capturePrintOutput(`PRINT -99`), "-99 \r\n");
    });

    test('PRINT USING engine should strictly format strings (&) and decimals (###.###)', () => {
        const evaluator = new Evaluator(new Environment());
        const output = evaluator.formatPrintUsing("  &###.### seconds  ", ["Insertion", 0.051283]);
        assertEqual(output, "  Insertion  0.051 seconds  ");
    });

});

// ============================================================================
// SUITE 4: Fixed-Length Strings & Memory Mutation
// ============================================================================
registerSuite('Evaluator: Fixed-Length Strings and Memory Mutation', () => {

    test('Scalar Assignment (ENV): DIM A AS STRING * 5', () => {
        const code = `DIM A AS STRING * 5 : A = "HI"`;
        const env = executeToEnv(code);
        const variableA = env.lookup('A');
        assertEqual(variableA.isFixedString, true);
        assertEqual(variableA.toString(), "HI   ", "Must auto-pad with spaces");
    });

    test('UDT Property Assignment (OBJECT): TYPE ... STRING * N', () => {
        const code = `
            TYPE SortType
                BarString AS STRING * 10
            END TYPE
            DIM Obj AS SortType
            Obj.BarString = "BLOCK"
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('Obj').BARSTRING.isFixedString, true);
        assertEqual(env.lookup('Obj').BARSTRING.toString(), "BLOCK     ");
    });

    test('Deep clone UDTs on ASSIGN and SWAP to prevent JS reference leakage', () => {
        const code = `
            TYPE Player : score AS INTEGER : END TYPE
            DIM p1 AS Player : p1.score = 100
            p2 = p1 : p2.score = 500
            DIM p3 AS Player : p3.score = 999
            SWAP p1, p3 : p1.score = 777
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('P2').SCORE, 500, "p2 should be mutated independently");
        assertEqual(env.lookup('P3').SCORE, 100, "p3 should receive the original p1 value");
        assertEqual(env.lookup('P1').SCORE, 777, "p1 should be mutated independently");
    });

});

// ============================================================================
// SUITE 5: MS-DOS Control Flow Paradigms
// ============================================================================
registerSuite('Evaluator: MS-DOS Control Flow & Arithmetic Quirks', () => {
    
    test('Integer Division (\\) vs Float Division (/)', () => {
        const code = `FloatDiv = 5 / 2 : IntDiv = 5 \\ 2`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('FloatDiv'), 2.5, "Standard division (/) must retain decimals");
        assertEqual(env.lookup('IntDiv'), 2, "Integer division (\\) must strictly truncate to integer");
    });

    test('Implicit Integer Typing (DEFINT A-Z)', () => {
        const code = `DEFINT A-Z : Row = 5.8 : Offset = 10.2 : StartTime! = 1.9`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('Row'), 6, "Implicit integer must round mathematically");
        assertEqual(env.lookup('Offset'), 10, "Implicit integer must round mathematically");
        assertEqual(env.lookup('StartTime!'), 1.9, "Explicit float (!) must bypass DEFINT");
    });

    test('FOR Loop Terminal Value Leak', () => {
        const code = `FOR I = 1 TO 3 : NEXT I : FOR J = 10 TO 2 STEP -1 : NEXT J`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('I'), 4, "A naturally exited FOR loop must leave the iterator at End + Step");
        assertEqual(env.lookup('J'), 1, "A STEP -1 loop ending at 2 must leave the iterator at 1");
    });

    test('LOOP WHILE Truthiness Evaluation', () => {
        const code = `Switch = 5 : Counter = 0 : DO WHILE Switch : Counter = Counter + 1 : Switch = 0 : LOOP`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('Counter'), 1, "LOOP WHILE must treat non-zero integers as TRUE, not strictly booleans");
    });

    test('Parser: Implicit Subroutine Calls (Without the CALL keyword)', () => {
        const code = `
            DIM SHARED Executed
            Executed = 0
            DummySub 42, 10
            SUB DummySub(ValA, ValB)
                IF ValA = 42 THEN 
                    IF ValB = 10 THEN Executed = 1
                END IF
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('Executed'), 1, "The parser MUST recognize implicit calls (identifier + arguments)");
    });
});

// ============================================================================
// SUITE 6: Purist Scope Isolation
// ============================================================================
registerSuite('Evaluator: Purist Scope Isolation (Anti-Bleeding)', () => {

    test('Strict Scope Isolation (Anti-Loop Bleeding)', () => {
        const code = `
            DIM SHARED GlobalCounter
            GlobalCounter = 0
            CALL FirstRoutine
            SUB FirstRoutine STATIC
                FOR I = 1 TO 3 : CALL SecondRoutine : NEXT I
            END SUB
            SUB SecondRoutine STATIC
                I = 99  ' Must not overwrite FirstRoutine's I
                GlobalCounter = GlobalCounter + 1
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('GlobalCounter'), 3, "Subroutine local variables must absolutely not shadow caller scopes");
    });

    test('QBasic Strict Shadowing: SUBs must ignore Main Module non-SHARED variables', () => {
        const code = `
            I = 50 
            CALL TestSub
            SUB TestSub
                I = 99 ' MUST NOT overwrite Main Module's I
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('I'), 50, "The Main Module's I must remain 50. The SUB must create its own shadowed local I.");
    });

    test('Recursive Scope Isolation', () => {
        const code = `
            DIM SHARED GlobalCheck
            GlobalCheck = 0
            CALL Recurse(3)
            SUB Recurse(Depth)
                I = Depth
                IF Depth > 1 THEN CALL Recurse(Depth - 1)
                IF I = 3 THEN GlobalCheck = 1
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('GlobalCheck'), 1, "Recursive calls MUST allocate a fresh local scope that doesn't bleed");
    });
});

registerSuite('Evaluator: MS-DOS Control Flow & Arithmetic Quirks', () => {
    
    test('Integer Division (\\) vs Float Division (/)', () => {
        const code = `FloatDiv = 5 / 2 : IntDiv = 5 \\ 2`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('FloatDiv'), 2.5, "Standard division (/) must retain decimals");
        assertEqual(env.lookup('IntDiv'), 2, "Integer division (\\) must strictly truncate to integer");
    });

    test('Implicit Integer Typing (DEFINT A-Z)', () => {
        const code = `DEFINT A-Z : Row = 5.8 : Offset = 10.2 : StartTime! = 1.9`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('Row'), 6, "Implicit integer must round mathematically");
        assertEqual(env.lookup('Offset'), 10, "Implicit integer must round mathematically");
        assertEqual(env.lookup('StartTime!'), 1.9, "Explicit float (!) must bypass DEFINT");
    });

    test('FOR Loop Terminal Value Leak', () => {
        const code = `FOR I = 1 TO 3 : NEXT I : FOR J = 10 TO 2 STEP -1 : NEXT J`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('I'), 4, "A naturally exited FOR loop must leave the iterator at End + Step");
        assertEqual(env.lookup('J'), 1, "A STEP -1 loop ending at 2 must leave the iterator at 1");
    });

    test('LOOP WHILE Truthiness Evaluation', () => {
        const code = `Switch = 5 : Counter = 0 : DO WHILE Switch : Counter = Counter + 1 : Switch = 0 : LOOP`;
        const env = executeToEnv(code);
        assertEqual(env.lookup('Counter'), 1, "LOOP WHILE must treat non-zero integers as TRUE, not strictly booleans");
    });

    test('Parser: Implicit Subroutine Calls (Without the CALL keyword)', () => {
        const code = `
            DIM SHARED Executed
            Executed = 0
            DummySub 42, 10
            SUB DummySub(ValA, ValB)
                IF ValA = 42 THEN 
                    IF ValB = 10 THEN Executed = 1
                END IF
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('Executed'), 1, "The parser MUST recognize implicit calls (identifier + arguments)");
    });
});

registerSuite('Evaluator: Purist Scope Isolation (Anti-Bleeding)', () => {

    test('Strict Scope Isolation (Anti-Loop Bleeding)', () => {
        const code = `
            DIM SHARED GlobalCounter
            GlobalCounter = 0
            CALL FirstRoutine
            SUB FirstRoutine STATIC
                FOR I = 1 TO 3 : CALL SecondRoutine : NEXT I
            END SUB
            SUB SecondRoutine STATIC
                I = 99  ' Must not overwrite FirstRoutine's I
                GlobalCounter = GlobalCounter + 1
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('GlobalCounter'), 3, "Subroutine local variables must absolutely not shadow caller scopes");
    });

    test('QBasic Strict Shadowing: SUBs must ignore Main Module non-SHARED variables', () => {
        const code = `
            I = 50 
            CALL TestSub
            SUB TestSub
                I = 99 ' MUST NOT overwrite Main Module's I
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('I'), 50, "The Main Module's I must remain 50. The SUB must create its own shadowed local I.");
    });

    test('Recursive Scope Isolation', () => {
        const code = `
            DIM SHARED GlobalCheck
            GlobalCheck = 0
            CALL Recurse(3)
            SUB Recurse(Depth)
                I = Depth
                IF Depth > 1 THEN CALL Recurse(Depth - 1)
                IF I = 3 THEN GlobalCheck = 1
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('GlobalCheck'), 1, "Recursive calls MUST allocate a fresh local scope that doesn't bleed");
    });
});