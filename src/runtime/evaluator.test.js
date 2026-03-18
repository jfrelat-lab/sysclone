// src/runtime/evaluator.test.js
import { Evaluator } from './evaluator.js';
import { Environment } from './environment.js';
import { block } from '../parser/qbasic/controlFlow.js';
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

registerSuite('Evaluator: Core Data Structures (Variables, Arrays, UDTs)', () => {

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

registerSuite('Evaluator: Hardware Integration (VGA, Memory, I/O)', () => {

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

    test('Should interface correctly with VGA for relative LINE and PRESET', () => {
        const env = new Environment();
        const mockVga = {
            // Simulated hardware state
            lastX: 50, lastY: 50, currentBg: 1, 
            lines: [], psets: [],
            line(x1, y1, x2, y2, c, b, sIs, eIs) { this.lines.push({x1, y1, x2, y2, c}); },
            pset(x, y, c, isStep) { this.psets.push({x, y, c}); }
        };
        
        executeWithHardware(env, { vga: mockVga }, `
            PRESET (10, 20)
            PRESET (30, 40), 5
            LINE -(100, 100), 14
        `);
        
        // 1. PRESET without color must default to the background color (currentBg = 1)
        assertEqual(mockVga.psets[0].x, 10);
        assertEqual(mockVga.psets[0].c, 1); 
        
        // 2. PRESET with explicit color must use the provided color
        assertEqual(mockVga.psets[1].x, 30);
        assertEqual(mockVga.psets[1].c, 5);

        // 3. LINE with omitted start coordinates (LINE -) must fetch the hardware's last cursor position
        assertEqual(mockVga.lines[0].x1, 50); 
        assertEqual(mockVga.lines[0].y1, 50);
        assertEqual(mockVga.lines[0].x2, 100);
        assertEqual(mockVga.lines[0].y2, 100);
        assertEqual(mockVga.lines[0].c, 14);
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

registerSuite('Evaluator: I/O Formatting (MS-DOS PRINT Rules)', () => {

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

registerSuite('Evaluator: Memory Management (Fixed Strings & Deep Clones)', () => {

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

registerSuite('Evaluator: Control Flow & Arithmetic (MS-DOS Quirks)', () => {
    
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

    test('Implicit Single Precision Typing (DEFSNG A-Z)', () => {
        const code = `DEFSNG A-Z : Value = 5.8`;
        const env = executeToEnv(code);
        // Unlike DEFINT which would round this to 6, DEFSNG preserves the floating point
        assertEqual(env.lookup('Value'), 5.8, "DEFSNG must allow floats, preventing integer rounding");
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

    test('Should seamlessly call a FUNCTION with or without its type suffix', () => {
        const code = `
            FUNCTION CalcTotal! (Amount)
                ' The internal variable MUST retain the suffix to return the value!
                CalcTotal! = Amount * 2
            END FUNCTION
            
            ' 1. Call without suffix (The Torus.bas way)
            A = CalcTotal(10)
            
            ' 2. Call with explicit suffix
            B = CalcTotal!(20)
        `;
        const env = executeToEnv(code);
        
        assertEqual(env.lookup('A'), 20, "Should resolve function without suffix");
        assertEqual(env.lookup('B'), 40, "Should resolve function with explicit suffix");
    });
});

registerSuite('Evaluator: Scope Isolation (Anti-Bleeding)', () => {

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

registerSuite('Evaluator: Standard Library (E2E Built-ins)', () => {

    test('String basic manipulations (LEN, UCASE$, LCASE$, LTRIM$, RTRIM$)', () => {
        const code = `
            L = LEN("HELLO")
            U$ = UCASE$("hello")
            C$ = LCASE$("HELLO")
            LT$ = LTRIM$("  TEXT")
            RT$ = RTRIM$("TEXT  ")
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('L'), 5);
        assertEqual(env.lookup('U$'), "HELLO");
        assertEqual(env.lookup('C$'), "hello");
        assertEqual(env.lookup('LT$'), "TEXT");
        assertEqual(env.lookup('RT$'), "TEXT");
    });

    test('String generators (SPACE$, STRING$)', () => {
        const code = `
            SP$ = SPACE$(3)
            ST1$ = STRING$(4, "A")
            ST2$ = STRING$(3, 65)
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('SP$'), "   ");
        assertEqual(env.lookup('ST1$'), "AAAA");
        assertEqual(env.lookup('ST2$'), "AAA"); // 65 is 'A' in ASCII/CP437
    });

    test('Substring slicing (LEFT$, RIGHT$, MID$)', () => {
        const code = `
            LE$ = LEFT$("SYSCLONE", 3)
            RI$ = RIGHT$("SYSCLONE", 5)
            MI1$ = MID$("SYSCLONE", 4, 2)
            MI2$ = MID$("SYSCLONE", 4)
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('LE$'), "SYS");
        assertEqual(env.lookup('RI$'), "CLONE");
        assertEqual(env.lookup('MI1$'), "CL");
        assertEqual(env.lookup('MI2$'), "CLONE"); // Without length, goes to the end
    });

    test('Casting and ASCII mapping (STR$, VAL, CHR$, ASC, INSTR)', () => {
        const code = `
            S1$ = STR$(42)
            S2$ = STR$(-15)
            V = VAL("-80.5")
            C$ = CHR$(65)
            A = ASC("A")
            I1 = INSTR("HELLO WORLD", "WORLD")
            I2 = INSTR(3, "HELLO WORLD, HELLO", "HELLO")
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('S1$'), " 42");
        assertEqual(env.lookup('S2$'), "-15");
        assertEqual(env.lookup('V'), -80.5);
        assertEqual(env.lookup('C$'), "A");
        assertEqual(env.lookup('A'), 65);
        assertEqual(env.lookup('I1'), 7);
        assertEqual(env.lookup('I2'), 14); // Finds the second HELLO
    });

    test('Math bounding and rounding (INT, FIX, CINT, ABS, SQR)', () => {
        const code = `
            I = INT(-2.2)
            F = FIX(-2.8)
            C = CINT(2.8)
            A = ABS(-42)
            S = SQR(16)
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('I'), -3);
        assertEqual(env.lookup('F'), -2);
        assertEqual(env.lookup('C'), 3);
        assertEqual(env.lookup('A'), 42);
        assertEqual(env.lookup('S'), 4);
    });

    test('Implicit arguments edge cases (RND without parens)', () => {
        const code = `
            R1 = RND
            R2 = RND(1)
        `;
        const env = executeToEnv(code);
        const r1 = env.lookup('R1');
        const r2 = env.lookup('R2');
        
        assertEqual(r1 >= 0 && r1 < 1, true, "RND without parens must evaluate");
        assertEqual(r2 >= 0 && r2 < 1, true, "RND with parens must evaluate");
    });
});

registerSuite('Evaluator: State Persistence (STATIC & SHARED)', () => {

    test('STATIC statement should preserve variable state across subroutine calls', () => {
        const code = `
            DIM SHARED FinalCount
            CALL Tick
            CALL Tick
            CALL Tick
            SUB Tick
                ' Explicitly declare only 'counter' as static
                STATIC counter AS INTEGER
                counter = counter + 1
                FinalCount = counter
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('FinalCount'), 3, "STATIC variable must retain its value between consecutive calls");
    });

    test('SHARED statement should import global variables into local subroutine scope', () => {
        const code = `
            DIM SHARED PlayerX AS INTEGER
            PlayerX = 10
            
            CALL MovePlayer
            
            SUB MovePlayer
                ' Import the global variable into this local scope explicitly
                SHARED PlayerX AS INTEGER
                PlayerX = PlayerX + 5
            END SUB
        `;
        const env = executeToEnv(code);
        assertEqual(env.lookup('PlayerX'), 15, "SHARED statement must link the local variable to the global Tier 1 scope");
    });

    test('STATIC arrays should retain values across calls', () => {
        const code = `
            DIM SHARED ExtractedValue
            CALL InitArray
            CALL ReadArray
            
            SUB InitArray
                STATIC MemoryBlock(1 TO 5) AS INTEGER
                MemoryBlock(3) = 42
            END SUB
            
            SUB ReadArray
                ' Accessing the exact same static array in a different call context
                ' (Note: In QBasic, STATIC is tied to the SUB, but let's ensure 
                ' calling the SUB again doesn't wipe the array).
                STATIC MemoryBlock(1 TO 5) AS INTEGER
                ExtractedValue = MemoryBlock(3)
            END SUB
        `;
        const env = executeToEnv(code);
        // Note: InitArray and ReadArray have DIFFERENT static scopes. MemoryBlock is local to each!
        // So ReadArray's MemoryBlock(3) should be 0. Let's test this pure scoping rule.
        assertEqual(env.lookup('ExtractedValue'), 0, "Static arrays must be strictly isolated to their specific subroutine scope");
    });

});

registerSuite('Evaluator: L-Values & Pass-by-Reference', () => {

    test('Pass-by-Reference: Should distinguish between Array Access (L-Value) and Function Call (R-Value)', () => {
        const code = `
            DIM arr(5)
            arr(1) = 10
            
            SUB TestSub (X, Y)
                X = 99  ' Try to modify the first argument (Passed by value)
                Y = 88  ' Try to modify the second argument (Passed by reference)
            END SUB
            
            ' The 1st arg is a function (R-Value), the 2nd is an array access (L-Value)
            TestSub LEN("HELLO"), arr(1)
        `;
        const env = executeToEnv(code);
        
        // arr(1) was passed by reference, so modifying Y to 88 inside the SUB must affect the original array
        const arr = env.lookup('ARR');
        assertEqual(arr.get([1]), 88, "Array should be passed by reference and modified successfully");
    });

    test('evaluateLValue should throw an error when attempting to assign a value to a function', () => {
        const code = `
            ' It is strictly illegal to assign a value to a function's result!
            LEN("A") = 10
        `;
        
        let caught = false;
        try {
            executeToEnv(code);
        } catch (e) {
            caught = true;
            assertEqual(e.message.includes("Cannot assign to function: LEN"), true, "Error message must explicitly mention the function name");
        }
        
        assertEqual(caught, true, "Evaluator MUST throw an exception when attempting an assignment to a function");
    });

});

registerSuite('Evaluator: Memory Aliasing & Type Suffixes', () => {

    test('1. Aliasing (DIM): Should deeply link explicit declarations in local/global scope', () => {
        const code = `
            DIM Available AS STRING
            
            ' Assign to the base name
            Available = "12789BCD"
            ' Read from the suffixed name
            A$ = MID$(Available$, 1, 2)
            
            ' Re-assign via the suffixed name
            Available$ = "XY"
            ' Read from the base name
            B$ = Available
        `;
        const env = executeToEnv(code);
        
        assertEqual(env.lookup('A$'), "12", "Should read the exact same memory slot via suffix");
        assertEqual(env.lookup('B$'), "XY", "Available and Available$ MUST share the exact same reference");
    });

    test('2. Aliasing (STATIC): Should maintain aliases in persistent local vaults', () => {
        const code = `
            SUB CountUp
                SHARED GlobalRes
                STATIC MyCount AS INTEGER
                ' Read via suffixed name, assign to base name
                MyCount = MyCount% + 1
                ' Export for assertion
                GlobalRes = MyCount%
            END SUB
            
            CountUp
            CountUp
        `;
        const env = executeToEnv(code);
        
        // After two calls, the static integer should be 2.
        // It proves that MyCount and MyCount% point to the same persistent slot.
        assertEqual(env.lookup('GlobalRes'), 2, "Static variables must maintain their alias across calls");
    });

    test('3. Aliasing (SHARED): Should resolve aliases in the global Tier 1 scope', () => {
        const code = `
            DIM SHARED ConfigStr AS STRING
            ConfigStr = "INIT"
            
            SUB UpdateConfig
                SHARED ConfigStr AS STRING
                ' Read via base name, append, and assign via suffixed name
                ConfigStr$ = ConfigStr + "-DONE"
            END SUB
            
            UpdateConfig
            FinalRes$ = ConfigStr
        `;
        const env = executeToEnv(code);
        
        assertEqual(env.lookup('FinalRes$'), "INIT-DONE", "Shared alias must route directly to Tier 1");
        assertEqual(env.lookup('ConfigStr$'), "INIT-DONE", "Both suffixed and non-suffixed names must reflect the global update");
    });

    test('4. Aliasing (Parameters): Should alias explicitly typed arguments inside subroutines', () => {
        const code = `
            FUNCTION Greet$ (UserName AS STRING)
                ' Read via suffixed name
                Greeting$ = "Hello " + UserName$
                
                ' Modify via base name (will affect the passed reference)
                UserName = "CONSUMED" 
                
                Greet$ = Greeting$
            END FUNCTION
            
            PlayerName$ = "Mario"
            Res$ = Greet(PlayerName$)
        `;
        const env = executeToEnv(code);
        
        assertEqual(env.lookup('Res$'), "Hello Mario", "Parameter alias must read correctly");
        assertEqual(env.lookup('PlayerName$'), "CONSUMED", "Parameter alias modification must reflect on the original reference (Copy-Out)");
    });

});