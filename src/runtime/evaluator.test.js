// src/runtime/evaluator.test.js
import { Evaluator } from './evaluator.js';
import { Environment } from './environment.js';
import { block } from '../parser/controlFlow.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

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

/**
 * Unit tests for the AST Evaluator.
 * Validates the execution of variables, complex array structures, 
 * User-Defined Types (UDT), and QBasic control flow logic.
 */
registerSuite('AST Evaluator (Variables, Arrays, and Types)', () => {

    test('Should evaluate simple variables and mathematical expressions', () => {
        const env = new Environment();
        executeCode(env, `
            score = 10 + 2 * 5
            lives = score / 2
        `);
        assertEqual(env.lookup('SCORE'), 20);
        assertEqual(env.lookup('LIVES'), 10);
    });

    test('Should evaluate exponentiation (^) correctly', () => {
        const env = new Environment();
        executeCode(env, `
            square = 5 ^ 2
            cube = 2 ^ 3
            complex = 10 + 2 * 3 ^ 2 ' Should be 10 + 2 * 9 = 28
        `);
        
        assertEqual(env.lookup('SQUARE'), 25);
        assertEqual(env.lookup('CUBE'), 8);
        assertEqual(env.lookup('COMPLEX'), 28);
    });

    test('Should correctly allocate scalar variables without turning them into arrays', () => {
        const env = new Environment();
        
        // This code declares a simple scalar (lives) and verifies its native behavior.
        executeCode(env, `
            DIM lives AS INTEGER
            
            ' In QBasic, an uninitialized scalar defaults to 0.
            ' If "lives" was erroneously transformed into an array (QArray), 
            ' the comparison "QArray = 0" will yield FALSE in JavaScript!
            IF lives = 0 THEN
                status = 1
            ELSE
                status = 2
            END IF
        `);
        
        const livesVar = env.lookup('LIVES');
        
        // 1. Structural proof: lives MUST be a primitive number, not a QArray object
        assertEqual(typeof livesVar, 'number', "lives should be a primitive number");
        assertEqual(livesVar, 0, "lives should default to 0");
        
        // 2. Behavioral proof: did the CPU take the correct IF branch?
        assertEqual(env.lookup('STATUS'), 1, "The engine failed to evaluate lives = 0");
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

    test('Should execute IF...ELSEIF...ELSE cascading blocks correctly', () => {
        const env = new Environment();
        
        // Test 1: Should hit the first ELSEIF
        executeCode(env, `
            score = 75
            IF score >= 100 THEN
                grade = 1
            ELSEIF score >= 50 THEN
                grade = 2
            ELSEIF score >= 20 THEN
                grade = 3
            ELSE
                grade = 4
            END IF
        `);
        assertEqual(env.lookup('GRADE'), 2);

        // Test 2: Should bypass all ELSEIFs and hit the ELSE
        executeCode(env, `
            power = 5
            IF power > 50 THEN
                status = 100
            ELSEIF power > 20 THEN
                status = 200
            ELSE
                status = 300
            END IF
        `);
        assertEqual(env.lookup('STATUS'), 300);

        // Test 3: Should hit the first valid condition and ignore the rest
        executeCode(env, `
            testVal = 15
            IF testVal > 10 THEN
                res = 1
            ELSEIF testVal > 5 THEN
                res = 2  ' This is technically true, but should NOT execute
            ELSE
                res = 3
            END IF
        `);
        assertEqual(env.lookup('RES'), 1);
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

    test('Should handle EXIT FOR to break out of loops early', () => {
        const env = new Environment();
        executeCode(env, `
            counter = 0
            FOR i = 1 TO 10
                IF i = 5 THEN EXIT FOR
                counter = counter + 1
            NEXT i
        `);
        
        // Loop runs for i=1, 2, 3, 4. When i=5, it hits EXIT FOR.
        assertEqual(env.lookup('COUNTER'), 4);
        assertEqual(env.lookup('I'), 5); // The iterator preserves its exact value at the moment of exit
    });

    test('Should handle EXIT SUB correctly via bubbling', () => {
        const env = new Environment();
        executeCode(env, `
            SUB ProcessData (status)
                status = 1
                EXIT SUB
                status = 2 ' This should never execute
            END SUB
            
            myStatus = 0
            CALL ProcessData(myStatus)
        `);
        
        // Ensure the subroutine aborted before setting status to 2
        assertEqual(env.lookup('MYSTATUS'), 1);
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

    test('Should correctly differentiate scalar variables and arrays in DIM', () => {
        const env = new Environment();
        
        // Testing the "Truthy empty array" bug fix
        executeCode(env, `
            DIM scalarVar AS INTEGER
            DIM arrayVar(5) AS INTEGER
            scalarVar = 42
            arrayVar(1) = 99
        `);
        
        // scalarVar should be a primitive number, NOT a QArray object
        const scalar = env.lookup('SCALARVAR');
        assertEqual(typeof scalar, 'number');
        assertEqual(scalar, 42);
        
        // arrayVar should properly be instantiated as a QArray
        const arr = env.lookup('ARRAYVAR');
        assertEqual(arr.constructor.name, 'QArray');
        assertEqual(arr.get([1]), 99);
    });

    test('Should handle REDIM for dynamic array reallocation (Without PRESERVE)', () => {
        const env = new Environment();
        executeCode(env, `
            DIM dynArray(5)
            dynArray(2) = 50
            
            ' Reallocate the array with new bounds.
            ' In QBasic, without the PRESERVE keyword, this clears the memory.
            REDIM dynArray(10)
            dynArray(10) = 100
        `);
        
        const arr = env.lookup('DYNARRAY');
        assertEqual(arr.constructor.name, 'QArray');
        
        // Verify the old data was wiped clean
        assertEqual(arr.get([2]), 0);
        
        // Verify the new upper bound is accessible
        assertEqual(arr.get([10]), 100);
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

    test('Should handle ERASE statement to clear array contents', () => {
        const env = new Environment();
        executeCode(env, `
            DIM arr(1 TO 3)
            arr(1) = 42
            arr(2) = 84
            ERASE arr
        `);
        
        const arr = env.lookup('ARR');
        // Proof that the array structure remains intact, but the memory is zeroed out
        assertEqual(arr.get([1]), 0, "ERASE should zero out array element 1");
        assertEqual(arr.get([2]), 0, "ERASE should zero out array element 2");
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

    test('Should perfectly isolate identical labels across different subroutines', () => {
        const env = new Environment();
        executeCode(env, `
            DIM SHARED mainVal, sub1Val, sub2Val
            
            SUB RoutineOne ()
                sub1Val = 1
                GOTO JumpTarget
                sub1Val = 999 ' Should be skipped
                JumpTarget:
                sub1Val = 2
            END SUB
            
            SUB RoutineTwo ()
                sub2Val = 1
                GOTO JumpTarget
                sub2Val = 999 ' Should be skipped
                JumpTarget:
                sub2Val = 2
            END SUB
            
            ' Main Module
            mainVal = 1
            GOTO JumpTarget
            mainVal = 999 ' Should be skipped
            JumpTarget:
            mainVal = 2
            
            ' Execute subs to prove their internal GOTOs resolve locally
            CALL RoutineOne()
            CALL RoutineTwo()
        `);
        
        // If scopes leaked, the GOTO in Main would have jumped into a SUB,
        // or the SUBs would have jumped back to Main, causing bad values or crashes.
        assertEqual(env.lookup('MAINVAL'), 2, "Main scope label resolution failed");
        assertEqual(env.lookup('SUB1VAL'), 2, "Subroutine 1 local label resolution failed");
        assertEqual(env.lookup('SUB2VAL'), 2, "Subroutine 2 local label resolution failed");
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

    test('Should manage global DATA bank across subroutines and modules', () => {
        const env = new Environment();
        executeCode(env, `
            DIM SHARED global1, global2, global3
            
            SUB ReadTheData ()
                ' SUB reads sequentially from the global tape pointer
                READ global2
            END SUB
            
            ' 1. Read first available data
            READ global1
            
            ' 2. RESTORE must be executed in the scope where the label exists!
            RESTORE LevelData
            
            ' 3. Call the SUB. It should pick up exactly where the main pointer left off.
            CALL ReadTheData()
            
            ' 4. Main module continues reading after the SUB returns
            READ global3
            
            DATA 10, 20
            LevelData:
            DATA 30, 40
        `);
        
        assertEqual(env.lookup('GLOBAL1'), 10); // Main reads 10
        assertEqual(env.lookup('GLOBAL2'), 30); // Sub reads 30 (because pointer was RESTORED to LevelData)
        assertEqual(env.lookup('GLOBAL3'), 40); // Main reads 40
    });

    test('Should evaluate SWAP correctly for variables and array elements', () => {
        const env = new Environment();
        executeCode(env, `
            a = 10
            b = 20
            SWAP a, b
            
            DIM arr(1 TO 2)
            arr(1) = 99
            arr(2) = 44
            SWAP arr(1), arr(2)
        `);
        
        assertEqual(env.lookup('A'), 20);
        assertEqual(env.lookup('B'), 10);
        
        const arr = env.lookup('ARR');
        assertEqual(arr.get([1]), 44);
        assertEqual(arr.get([2]), 99);
    });

    test('Should deep clone UDTs on ASSIGN and SWAP to prevent JS reference leakage', () => {
        const env = new Environment();
        executeCode(env, `
            TYPE Player
                score AS INTEGER
            END TYPE
            
            DIM p1 AS Player
            p1.score = 100
            
            ' ASSIGN test: p2 should be a deep clone, not a JS memory reference
            p2 = p1
            p2.score = 500
            
            DIM p3 AS Player
            p3.score = 999
            
            ' SWAP test: p1 and p3 should swap clones
            SWAP p1, p3
            p1.score = 777
        `);
        
        const p1 = env.lookup('P1');
        const p2 = env.lookup('P2');
        const p3 = env.lookup('P3');
        
        // If it was a pure JS reference, mutating p2.score to 500 would have corrupted p1.
        // But after the swap, p1 became 999, then mutated to 777.
        // p3 became the OLD p1 (which was firmly 100).
        assertEqual(p2.SCORE, 500, "p2 should be mutated independently");
        assertEqual(p3.SCORE, 100, "p3 should receive the original p1 value via swap");
        assertEqual(p1.SCORE, 777, "p1 should be mutated independently after swap");
    });

    test('Should gracefully ignore hardware stubs (PLAY, VIEW PRINT, RANDOMIZE) to avoid crashes', () => {
        const env = new Environment();
        // We use standard implicit calls for VIEW PRINT and PLAY to avoid breaking the parser.
        // This tests that the Evaluator correctly handles and skips them.
        const code = `
            SCREEN 0
            WIDTH 80, 25
            RANDOMIZE TIMER
            VIEW PRINT
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

    test('Should evaluate built-in functions without parentheses (e.g., RND)', () => {
        const env = new Environment();
        executeCode(env, `
            val1 = RND
            val2 = RND
        `);
        // RND without parentheses should return a float between 0 and 1
        const v1 = env.lookup('VAL1');
        const v2 = env.lookup('VAL2');
        
        assertEqual(v1 >= 0 && v1 < 1, true);
        assertEqual(v2 >= 0 && v2 < 1, true);
        // They should ideally be different (though random implies a tiny chance of equality)
        assertEqual(v1 !== v2, true);
    });

    test('Should evaluate built-in string functions (STRING$, SPACE$, SPC, etc.)', () => {
        const env = new Environment();
        
        executeCode(env, `
            s1$ = STRING$(5, 65)   ' 65 is 'A'
            s2$ = STRING$(3, "B")
            s3$ = SPACE$(4)
            s4$ = SPC(3)
        `);
        
        assertEqual(env.lookup('S1$'), "AAAAA");
        assertEqual(env.lookup('S2$'), "BBB");
        assertEqual(env.lookup('S3$'), "    ");
        assertEqual(env.lookup('S4$'), "   ");
    });
});

/**
 * Unit tests for Hardware Integration.
 * Uses Dependency Injection to provide Mock Hardware to the Evaluator,
 * ensuring that instructions like PRINT, INPUT, and CLS send the correct signals.
 */
registerSuite('AST Evaluator (Hardware Integration & HAL)', () => {

    /**
     * Helper to execute code with injected hardware mocks.
     */
    function executeWithHardware(env, hardware, code) {
        const ast = block.run(code).result;
        const evaluator = new Evaluator(env, hardware);
        runSync(evaluator.evaluate(ast));
    }

    /**
     * Helper for the mock to reconstruct strings from CP437 byte arrays 
     * in order to make testing assertions readable.
     */
    function bytesToString(bytes) {
        return Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    }

    test('Should interface correctly with VGA for CLS, COLOR, LOCATE, and PRINT', () => {
        const env = new Environment();
        
        // 1. Build the updated VGA Mock (Byte-Array aware + Cursor aware)
        const mockVga = {
            clsCalled: false,
            located: null,
            colored: null,
            cursorState: null,
            printed: [],
            cls() { this.clsCalled = true; },
            locate(r, c) { this.located = [r, c]; },
            color(f, b) { this.colored = [f, b]; },
            showCursor() { this.cursorState = 'VISIBLE'; },
            hideCursor() { this.cursorState = 'HIDDEN'; },
            print(data) { 
                this.printed.push(Array.from(data).map(b => String.fromCharCode(b)).join('')); 
            }
        };
        
        const code = `
            CLS
            COLOR 10, 2
            LOCATE 5, 15, 1
            PRINT "SYSCLONE"
            LOCATE , , 0
        `;
        
        executeWithHardware(env, { vga: mockVga }, code);
        
        // 2. Assert that the CPU triggered the correct hardware states
        assertEqual(mockVga.clsCalled, true);
        assertEqual(mockVga.colored[0], 10); 
        assertEqual(mockVga.colored[1], 2);  
        assertEqual(mockVga.located[0], null); // Last locate was LOCATE , , 0
        assertEqual(mockVga.located[1], null);
        
        // Verify cursor state changed to hidden at the end
        assertEqual(mockVga.cursorState, 'HIDDEN');
        
        assertEqual(mockVga.printed[0], "SYSCLONE\r\n");
    });

    // --- GRAPHICS BLITTING (GET / PUT) INTEGRATION TESTS ---

    test('GET and PUT should pass array references to VGA without overwriting memory', () => {
        const env = new Environment();
        
        // 1. Mock VGA to intercept GET and PUT hardware calls
        const mockVga = {
            getCalled: null,
            putCalled: null,
            getGraphics(x1, y1, x2, y2, arr, idx, sIsStep, eIsStep) {
                this.getCalled = { x1, y1, x2, y2, arr, idx };
            },
            putGraphics(x, y, arr, idx, action, isStep) {
                this.putCalled = { x, y, arr, idx, action };
            }
        };

        // 2. Execute QBasic code that creates an array and blits it
        const code = `
            DIM spriteData(50)
            GET (10, 10)-(20, 20), spriteData
            PUT (50, 50), spriteData, XOR
        `;
        
        executeWithHardware(env, { vga: mockVga }, code);
        
        // 3. Assertions on the GET command
        assertEqual(mockVga.getCalled.x1, 10, "GET X1 should be 10");
        assertEqual(mockVga.getCalled.y2, 20, "GET Y2 should be 20");
        assertEqual(mockVga.getCalled.arr.constructor.name, 'QArray', "GET must receive the QArray object, not a primitive");

        // 4. Assertions on the PUT command
        assertEqual(mockVga.putCalled.x, 50, "PUT X should be 50");
        assertEqual(mockVga.putCalled.action, 'XOR', "PUT action should be parsed as XOR");
        
        // CRITICAL: Ensure the exact same memory reference was passed to both
        assertEqual(mockVga.putCalled.arr === mockVga.getCalled.arr, true, "PUT must use the exact same QArray reference");
    });

    test('POINT should correctly read pixel colors from the VGA hardware', () => {
        const env = new Environment();
        
        // 1. Mock the VGA with a deterministic 'point' response
        const mockVga = {
            point(x, y) {
                if (x === 150 && y === 100) return 42; // The magic banana pixel
                return 0; // Empty space
            }
        };

        // 2. Execute QBasic code querying the screen
        executeWithHardware(env, { vga: mockVga }, `
            colorHit = POINT(150, 100)
            colorMiss = POINT(10, 10)
        `);
        
        // 3. Assertions
        assertEqual(env.lookup('COLORHIT'), 42, "POINT must return the hardware color at specific coordinates");
        assertEqual(env.lookup('COLORMISS'), 0, "POINT must return 0 for empty space");
    });

    // --- USER I/O INTEGRATION TESTS ---

    test('INPUT should handle multiple variables, split by commas, and append "? " to prompt', () => {
        const env = new Environment();
        
        // 1. Mock VGA to track what is printed to the screen
        const mockVga = {
            printed: [], cursorVisible: false,
            showCursor() { this.cursorVisible = true; },
            hideCursor() { this.cursorVisible = false; },
            print(data) { this.printed.push(bytesToString(data)); }
        };
        
        // 2. Mock IO to simulate a user typing a sequence of keys
        // The user types: "42, 10" then presses ENTER (Char 13)
        const mockIo = {
            keyQueue: ['4', '2', ',', ' ', '1', '0', String.fromCharCode(13)],
            inkey() {
                return this.keyQueue.length > 0 ? this.keyQueue.shift() : "";
            }
        };
        
        // Execute a multi-variable INPUT statement
        executeWithHardware(env, { vga: mockVga, io: mockIo }, 'INPUT "Coordinates"; x, y');
        
        // 3. Assertions on Hardware Behavior
        // Standard INPUT always appends "? " automatically in QBasic
        assertEqual(mockVga.printed[0], "Coordinates? ", "INPUT should append '? ' to the prompt");
        assertEqual(mockVga.cursorVisible, false, "Cursor must be hidden after execution");

        // 4. Assertions on Memory & Parsing
        // The CPU should split the input at the comma and assign respective values
        assertEqual(env.lookup('X'), 42, "First target should be parsed as 42");
        assertEqual(env.lookup('Y'), 10, "Second target should be parsed as 10 (ignoring spaces)");
    });

    test('LINE INPUT should read full strings including commas and suppress the "? "', () => {
        const env = new Environment();
        
        // 1. Mock VGA setup
        const mockVga = {
            printed: [], cursorVisible: false,
            showCursor() { this.cursorVisible = true; },
            hideCursor() { this.cursorVisible = false; },
            print(data) { this.printed.push(bytesToString(data)); }
        };
        
        // 2. Mock IO simulating a user typing a name with a comma
        // The user types: "Smith, John" then presses ENTER
        const mockIo = {
            keyQueue: ['S', 'm', 'i', 't', 'h', ',', ' ', 'J', 'o', 'h', 'n', String.fromCharCode(13)],
            inkey() {
                return this.keyQueue.length > 0 ? this.keyQueue.shift() : "";
            }
        };
        
        // Execute a LINE INPUT statement
        executeWithHardware(env, { vga: mockVga, io: mockIo }, 'LINE INPUT "Full Name: "; pName$');
        
        // 3. Assertions on Hardware Behavior
        // LINE INPUT natively suppresses the "? " formatting
        assertEqual(mockVga.printed[0], "Full Name: ", "LINE INPUT should NOT append '? '");
        
        // 4. Assertions on Memory
        // The comma should NOT trigger a split, the entire string goes to the single variable
        assertEqual(env.lookup('PNAME$'), "Smith, John", "Entire string including commas must be captured");
    });

    test('PRINT should intercept TAB() and interact natively with VGA cursorX', () => {
        const env = new Environment();
        
        // 1. Specific VGA Mock for TAB
        // TAB absolutely needs to read 'cursorX' to calculate the space delta.
        // Our Mock must therefore simulate cursor movement during a print().
        const mockVga = {
            cursorX: 0,
            printed: [],
            print(data) {
                // Decode to facilitate our assertions
                const str = Array.from(data).map(b => String.fromCharCode(b)).join('');
                this.printed.push(str);
                
                // Strict hardware simulation of the text cursor
                for (let i = 0; i < data.length; i++) {
                    if (data[i] === 13) this.cursorX = 0;      // Carriage Return
                    else if (data[i] !== 10) this.cursorX++; // Standard character (ignore LF for X)
                }
            }
        };
        
        // 2. Execute QBasic code
        // Case A: Normal TAB advancing on the same line.
        // Case B: TAB with a value lower than the current cursor (must force a line wrap).
        const code = `
            PRINT "A"; TAB(5); "B"
            PRINT "123456"; TAB(3); "X"
        `;
        
        executeWithHardware(env, { vga: mockVga }, code);
        
        // Concatenate the entire output stream to verify absolute fidelity
        const fullOutput = mockVga.printed.join('');
        
        // 3. Assertions
        // Explanation Line 1: "A" (col 1) + TAB(5) generates 3 spaces (cols 2, 3, 4) + "B" (col 5)
        // Explanation Line 2: "123456" puts cursor at col 7. TAB(3) is < 7, so CR/LF, then 2 spaces, then "X"
        const expectedOutput = "A   B\r\n123456\r\n  X\r\n";
        
        assertEqual(fullOutput, expectedOutput, "TAB formatting and wrapping failed");
    });

    test('INPUT$ should block expression evaluation until exactly N keystrokes are read', () => {
        const env = new Environment();
        
        // 1. Mock IO injecting 3 specific keys sequentially
        const mockIo = {
            keyQueue: ['A', 'B', 'C'],
            inkey() {
                return this.keyQueue.length > 0 ? this.keyQueue.shift() : "";
            }
        };
        
        // 2. The code will execute linearly, proving the CPU blocked 
        // until the requested characters were fulfilled.
        const code = `
            val1$ = INPUT$(2)
            val2$ = INPUT$(1)
        `;
        
        executeWithHardware(env, { io: mockIo }, code);
        
        // 3. Assertions
        assertEqual(env.lookup('VAL1$'), "AB", "First read must capture exactly 2 characters");
        assertEqual(env.lookup('VAL2$'), "C", "Second read must capture exactly 1 character");
    });

    test('Should interface correctly with Memory for POKE', () => {
        const env = new Environment();
        
        const mockMemory = {
            poked: null,
            poke(address, value) { this.poked = { address, value }; }
        };
        
        executeWithHardware(env, { memory: mockMemory }, 'POKE &H41A, 30');
        
        assertEqual(mockMemory.poked.address, 1050); // &H41A
        assertEqual(mockMemory.poked.value, 30);
    });

    test('Should evaluate standard mathematical functions (SIN, COS, ATN, ABS)', () => {
        const env = new Environment();
        // We use ABS to avoid floating point precision issues in simple assertions
        executeCode(env, `
            s = SIN(0)
            c = COS(0)
            a = ABS(-42.5)
            pi_approx = ATN(1) * 4
        `);
        
        assertEqual(env.lookup('S'), 0);
        assertEqual(env.lookup('C'), 1);
        assertEqual(env.lookup('A'), 42.5);
        
        // Math.atan(1) * 4 should be roughly 3.14159...
        const pi = env.lookup('PI_APPROX');
        assertEqual(pi > 3.14 && pi < 3.15, true);
    });

    test('Should evaluate integer division (\\) with operand rounding', () => {
        const env = new Environment();
        executeCode(env, `
            a = 10 \\ 3
            b = 14.9 \\ 3.1
        `);
        // 10 \ 3 = 3
        assertEqual(env.lookup('A'), 3);
        // 14.9 rounds to 15, 3.1 rounds to 3 -> 15 \ 3 = 5
        assertEqual(env.lookup('B'), 5); 
    });

    test('SOUND should yield a SYS_DELAY calculated from DOS clock ticks (18.2 Hz)', () => {
        const env = new Environment();
        
        // We use the generic 'block' parser to maintain import consistency
        const ast = block.run('SOUND 440, 18.2').result; 
        const evaluator = new Evaluator(env);
        
        const generator = evaluator.evaluate(ast);
        
        // 1. The first next() consumes the Virtual CPU TICK (yield at the start of the block)
        generator.next();
        
        // 2. The second next() executes the SOUND statement and yields the hardware interrupt
        const state = generator.next();
        
        // 18.2 ticks should equal roughly 1000 milliseconds
        assertEqual(state.value.type, 'SYS_DELAY');
        assertEqual(Math.round(state.value.ms), 1000);
    });
});