// src/parser/qbasic/tokens.js

/**
 * Strict Lexicon for QBasic Keywords.
 * Prevents "Magic Strings" in the parser combinators and ensures 
 * a single source of truth for the language grammar.
 */
export const Tokens = {
    // Control Flow
    IF: 'IF', THEN: 'THEN', ELSE: 'ELSE', ELSEIF: 'ELSEIF', END: 'END', 
    FOR: 'FOR', TO: 'TO', STEP: 'STEP', NEXT: 'NEXT',
    DO: 'DO', LOOP: 'LOOP', UNTIL: 'UNTIL', WHILE: 'WHILE', WEND: 'WEND', 
    GOTO: 'GOTO', GOSUB: 'GOSUB', RETURN: 'RETURN', CALL: 'CALL',
    SELECT: 'SELECT', CASE: 'CASE', EXIT: 'EXIT', SWAP: 'SWAP',
    
    // Legacy Error Handling & Jumps
    ON: 'ON', ERROR: 'ERROR', RESUME: 'RESUME',
    
    // Declarations & Types
    SUB: 'SUB', FUNCTION: 'FUNCTION', DECLARE: 'DECLARE', DIM: 'DIM', 
    REDIM: 'REDIM', SHARED: 'SHARED', AS: 'AS', TYPE: 'TYPE', 
    CONST: 'CONST', DEFINT: 'DEFINT', DEFSNG: 'DEFSNG', DEF: 'DEF', SEG: 'SEG', 
    ANY: 'ANY', STATIC: 'STATIC', ERASE: 'ERASE',
    
    // System and Hardware Instructions
    PRINT: 'PRINT', USING: 'USING', CLS: 'CLS', LOCATE: 'LOCATE', 
    COLOR: 'COLOR', POKE: 'POKE', OUT: 'OUT', RANDOMIZE: 'RANDOMIZE', 
    SCREEN: 'SCREEN', WIDTH: 'WIDTH', DATA: 'DATA', READ: 'READ', 
    RESTORE: 'RESTORE', INPUT: 'INPUT', WINDOW: 'WINDOW', 
    PSET: 'PSET', CIRCLE: 'CIRCLE', LINE: 'LINE', PAINT: 'PAINT', 
    PALETTE: 'PALETTE', PRESET: 'PRESET', PUT: 'PUT', GET: 'GET', 
    VIEW: 'VIEW', PLAY: 'PLAY', BEEP: 'BEEP', SLEEP: 'SLEEP', SOUND: 'SOUND',
    
    // Logical and Mathematical textual operators
    AND: 'AND', OR: 'OR', NOT: 'NOT', MOD: 'MOD', XOR: 'XOR',
    
    // Comments
    REM: 'REM'
};

/**
 * Strict Lexicon for QBasic Native Functions (STDLIB & Hardware).
 * Keeps the Parser strictly decoupled from the Runtime implementation.
 */
export const BuiltInTokens = {
    // String Manipulation
    LEN: 'LEN', UCASE$: 'UCASE$', LCASE$: 'LCASE$', LTRIM$: 'LTRIM$', 
    RTRIM$: 'RTRIM$', SPACE$: 'SPACE$', SPC: 'SPC', STRING$: 'STRING$', 
    STR$: 'STR$', HEX$: 'HEX$', RIGHT$: 'RIGHT$', LEFT$: 'LEFT$', MID$: 'MID$', 
    CHR$: 'CHR$', ASC: 'ASC', INSTR: 'INSTR', VAL: 'VAL',
    
    // Mathematics
    INT: 'INT', FIX: 'FIX', CINT: 'CINT', RND: 'RND', SIN: 'SIN', 
    COS: 'COS', TAN: 'TAN', ATN: 'ATN', ABS: 'ABS', SQR: 'SQR', 
    EXP: 'EXP', LOG: 'LOG',
    
    // Hardware & I/O
    PEEK: 'PEEK', INP: 'INP', INKEY$: 'INKEY$', TIMER: 'TIMER', 
    COMMAND$: 'COMMAND$', ENVIRON$: 'ENVIRON$', POINT: 'POINT', 
    TAB: 'TAB', INPUT$: 'INPUT$'
};