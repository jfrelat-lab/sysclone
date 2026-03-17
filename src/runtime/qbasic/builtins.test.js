// src/runtime/builtins.test.js
import { BuiltIns } from './builtins.js';
import { test, assertEqual, registerSuite } from '../../test_runner.js';

// Destructure the actual functions directly from the BuiltIns object.
// JavaScript natively allows '$' in variable names, making this 1:1 mapped to QBasic.
const { 
    LEN, UCASE$, LCASE$, LTRIM$, RTRIM$, SPACE$, SPC, STRING$, STR$, 
    RIGHT$, LEFT$, MID$, CHR$, ASC, INSTR, VAL,
    INT, FIX, CINT, RND, SIN, COS, TAN, ATN, ABS, SQR, EXP, LOG
} = BuiltIns;

registerSuite('STDLIB: String Built-ins', () => {

    test('LEN, UCASE$, LCASE$, LTRIM$, RTRIM$', () => {
        assertEqual(LEN("HELLO"), 5);
        assertEqual(UCASE$("hello"), "HELLO");
        assertEqual(LCASE$("HELLO"), "hello");
        assertEqual(LTRIM$("  TEXT "), "TEXT ");
        assertEqual(RTRIM$(" TEXT  "), " TEXT");
    });

    test('SPACE$ and SPC should handle positive and negative boundaries', () => {
        assertEqual(SPACE$(3), "   ");
        assertEqual(SPACE$(-5), "", "Negative space must yield empty string");
        assertEqual(SPC(2), "  ");
    });

    test('STR$ formatting quirks', () => {
        assertEqual(STR$(42), " 42", "Positive numbers get a leading space");
        assertEqual(STR$(0), " 0", "Zero gets a leading space");
        assertEqual(STR$(-15), "-15", "Negative numbers do not get a leading space");
    });

    test('LEFT$, RIGHT$, MID$ slicing and edge cases', () => {
        assertEqual(LEFT$("SYSCLONE", 3), "SYS");
        assertEqual(LEFT$("SYSCLONE", 100), "SYSCLONE", "Oversized length should return full string");
        
        assertEqual(RIGHT$("SYSCLONE", 5), "CLONE");
        
        assertEqual(MID$("SYSCLONE", 4, 2), "CL");
        assertEqual(MID$("SYSCLONE", 4), "CLONE", "Missing length parameter goes to the end");
    });

    test('STRING$ generator', () => {
        assertEqual(STRING$(4, "A"), "AAAA");
        assertEqual(STRING$(3, "XYZ"), "XXX", "Should only take the first character of the string");
        assertEqual(STRING$(3, 65), "AAA", "Should accept numeric CP437 codes");
        assertEqual(STRING$(-2, "B"), "", "Negative lengths yield empty strings");
    });

    test('INSTR search logic', () => {
        assertEqual(INSTR("HELLO WORLD", "WORLD"), 7);
        assertEqual(INSTR(3, "HELLO WORLD, HELLO", "HELLO"), 14);
        
        assertEqual(INSTR("HELLO", "Z"), 0, "Not found returns 0");
        assertEqual(INSTR("", "WORLD"), 0, "Empty source returns 0");
        assertEqual(INSTR(100, "HELLO", "L"), 0, "Out of bounds start returns 0");
    });

    test('VAL casting', () => {
        assertEqual(VAL("123.45"), 123.45);
        assertEqual(VAL("-80.5"), -80.5);
        assertEqual(VAL("NOTANUMBER"), 0, "Failed cast returns 0");
    });

});

registerSuite('STDLIB: Math Built-ins', () => {

    test('INT, FIX, CINT rounding rules', () => {
        assertEqual(INT(2.8), 2);
        assertEqual(FIX(2.8), 2);
        assertEqual(CINT(2.8), 3); 
        
        assertEqual(INT(-2.2), -3, "INT floors mathematically downwards");
        assertEqual(FIX(-2.8), -2, "FIX purely truncates towards zero");
        assertEqual(CINT(-2.6), -3, "CINT rounds to nearest");
    });

    test('ABS, SQR', () => {
        assertEqual(ABS(-42), 42);
        assertEqual(SQR(16), 4);
    });

    test('RND fallback', () => {
        const val = RND();
        const isValid = val >= 0 && val < 1;
        assertEqual(isValid, true, "RND must return a float between 0 and 1");
    });

});