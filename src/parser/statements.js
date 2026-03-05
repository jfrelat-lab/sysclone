// src/parser/statements.js
import { choice, sequenceObj, sequenceOf, capture, optional, many, regex, sepBy, str } from './monad.js';
import { identifier, keyword, ws, optWs, numberLiteral, stringLiteral } from './lexers.js';
import { expression, variableAccess } from './expressions.js';

/**
 * Reusable parser for graphical coordinates: (x, y)
 */
const coordParser = sequenceObj([
    regex(/^\(/), optWs,
    capture('x', expression), optWs, regex(/^,/), optWs,
    capture('y', expression), optWs,
    regex(/^\)/)
]).map(obj => ({ x: obj.x, y: obj.y }));

/**
 * Parses the PRINT statement, including the optional USING format block
 * and trailing separators (semicolons/commas) for line-wrapping control.
 */
export const printStmt = sequenceObj([
    keyword('PRINT'),
    // Optional USING "format"; block
    capture('usingOpt', optional(sequenceObj([
        ws, keyword('USING'), ws,
        capture('format', expression), optWs, regex(/^[;,]/) 
    ]).map(obj => obj.format))),
    
    capture('values', optional(sequenceOf([
        optWs, 
        sepBy(expression, sequenceOf([optWs, regex(/^[;,]/), optWs]))
    ]).map(arr => arr[1]))),
    
    capture('trailing', optional(sequenceOf([optWs, regex(/^[;,]/)])))
]).map(obj => ({ 
    type: 'PRINT', 
    usingFormat: obj.usingOpt || null, 
    values: obj.values || [], 
    newline: obj.trailing === null
}));

export const clsStmt = keyword('CLS').map(() => ({ type: 'CLS' }));

export const locateStmt = sequenceObj([
    keyword('LOCATE'), ws,
    capture('row', expression),
    capture('colOpt', optional(sequenceOf([optWs, regex(/^,/), optWs, expression]).map(arr => arr[3])))
]).map(obj => ({ type: 'LOCATE', row: obj.row, col: obj.colOpt || null }));

export const colorStmt = sequenceObj([
    keyword('COLOR'), ws,
    // The first argument (foreground) is optional in some contexts
    capture('fgOpt', optional(expression)),
    // The second argument (background) is also optional
    capture('bgOpt', optional(sequenceOf([optWs, regex(/^,/), optWs, expression]).map(arr => arr[3])))
]).map(obj => ({ 
    type: 'COLOR', 
    fg: obj.fgOpt || null, 
    bg: obj.bgOpt || null 
}));

/**
 * Emulates memory segment selection (x86 Real Mode logic).
 */
export const defSegStmt = sequenceObj([
    keyword('DEF'), ws, keyword('SEG'),
    capture('addressOpt', optional(sequenceObj([
        optWs, regex(/^=/), optWs, capture('addr', expression)
    ]).map(obj => obj.addr)))
]).map(obj => ({ 
    type: 'DEF_SEG', 
    address: obj.addressOpt || null 
}));

export const pokeStmt = sequenceObj([
    keyword('POKE'), ws, capture('address', expression), optWs, regex(/^,/), optWs, capture('value', expression)
]).map(obj => ({ type: 'POKE', address: obj.address, value: obj.value }));

export const assignStmt = sequenceObj([
    capture('target', variableAccess), optWs, regex(/^=/), optWs, capture('value', expression)
]).map(obj => ({ type: 'ASSIGN', target: obj.target, value: obj.value }));

export const outStmt = sequenceObj([
    keyword('OUT'), ws, capture('port', expression), optWs, regex(/^,/), optWs, capture('value', expression)
]).map(obj => ({ type: 'OUT', port: obj.port, value: obj.value }));

/**
 * Explicit CALL statement for subroutines with parentheses.
 */
export const callStmt = sequenceObj([
    keyword('CALL'), ws, capture('callee', identifier),
    capture('argsOpt', optional(sequenceObj([
        optWs, regex(/^\(/), optWs,
        capture('args', optional(sequenceOf([
            expression, many(sequenceOf([optWs, regex(/^,/), optWs, expression]).map(arr => arr[3]))
        ]).map(arr => [arr[0], ...arr[1]]))),
        optWs, regex(/^\)/)
    ]).map(obj => obj.args || [])))
]).map(obj => ({ type: 'CALL', callee: obj.callee, args: obj.argsOpt || [] }));

export const labelDef = sequenceObj([
    capture('name', identifier), optWs, regex(/^:/)
]).map(obj => ({ type: 'LABEL', name: obj.name.value }));

export const gotoStmt = sequenceObj([
    keyword('GOTO'), ws, capture('label', identifier)
]).map(obj => ({ type: 'GOTO', label: obj.label.value }));

export const gosubStmt = sequenceObj([
    keyword('GOSUB'), ws, capture('label', identifier)
]).map(obj => ({ type: 'GOSUB', label: obj.label.value }));

export const returnStmt = keyword('RETURN').map(() => ({ type: 'RETURN' }));

// --- LEGACY EMULATION STATEMENTS (Nibbles Requirements) ---

export const randomizeStmt = sequenceObj([
    keyword('RANDOMIZE'), 
    capture('seed', optional(sequenceOf([ws, expression]).map(arr => arr[1])))
]).map(obj => ({ type: 'RANDOMIZE', seed: obj.seed || null }));

export const screenStmt = sequenceObj([
    keyword('SCREEN'), ws, capture('mode', expression)
]).map(obj => ({ type: 'SCREEN_STMT', mode: obj.mode }));

export const widthStmt = sequenceObj([
    keyword('WIDTH'), ws, capture('col', expression),
    capture('rowOpt', optional(sequenceOf([optWs, str(','), optWs, expression]).map(arr => arr[3])))
]).map(obj => ({ type: 'WIDTH', col: obj.col, row: obj.rowOpt || null }));

export const dataStmt = sequenceObj([
    keyword('DATA'), ws,
    capture('values', sepBy(choice([numberLiteral, stringLiteral, identifier]), sequenceOf([optWs, str(','), optWs])))
]).map(obj => ({ type: 'DATA', values: obj.values }));

export const readStmt = sequenceObj([
    keyword('READ'), ws,
    capture('targets', sepBy(variableAccess, sequenceOf([optWs, str(','), optWs])))
]).map(obj => ({ type: 'READ', targets: obj.targets }));

export const restoreStmt = sequenceObj([
    keyword('RESTORE'), 
    capture('label', optional(sequenceOf([ws, identifier]).map(arr => arr[1].value)))
]).map(obj => ({ 
    type: 'RESTORE', 
    label: obj.label || null 
}));

// --- ADVANCED GRAPHICS (Gorillas & Mandelbrot) ---

/**
 * WINDOW statement: Defines a logical coordinate system.
 * Example: WINDOW (-2, 1.5)-(2, -1.5)
 */
export const windowStmt = sequenceObj([
    keyword('WINDOW'), 
    // QBasic allows "WINDOW SCREEN" to invert the Y-axis mathematically
    capture('screenOpt', optional(sequenceOf([ws, keyword('SCREEN')]))),
    ws,
    capture('coord1', coordParser), optWs, regex(/^-/), optWs,
    capture('coord2', coordParser)
]).map(obj => ({
    type: 'WINDOW',
    invertY: obj.screenOpt !== null,
    x1: obj.coord1.x, y1: obj.coord1.y,
    x2: obj.coord2.x, y2: obj.coord2.y
}));

/**
 * PSET statement: Draws a pixel at specific coordinates.
 * Example: PSET (x, y), c
 */
export const psetStmt = sequenceObj([
    keyword('PSET'), ws,
    // QBasic allows PSET STEP (x, y) for relative coordinates
    capture('stepOpt', optional(sequenceOf([keyword('STEP'), ws]))),
    capture('coord', coordParser),
    capture('colorOpt', optional(sequenceObj([
        optWs, regex(/^,/), optWs, capture('c', expression)
    ]).map(obj => obj.c)))
]).map(obj => ({
    type: 'PSET',
    isStep: obj.stepOpt !== null,
    x: obj.coord.x,
    y: obj.coord.y,
    color: obj.colorOpt || null
}));

// --- IMPLICIT STATEMENTS ---

/**
 * IMPLICIT CALL (Native QBasic behavior)
 * Example: Intro  OR  GetInputs NumPlayers, speed
 * We map this to a CALL node for the evaluator.
 */
export const implicitCallStmt = sequenceObj([
    capture('callee', identifier),
    capture('argsOpt', optional(sequenceObj([
        ws, // Space is mandatory if arguments follow the identifier
        capture('args', sepBy(expression, sequenceOf([optWs, str(','), optWs])))
    ]).map(obj => obj.args)))
]).map(obj => ({
    type: 'CALL', 
    callee: obj.callee,
    args: (obj.argsOpt && obj.argsOpt.length > 0) ? obj.argsOpt : []
}));

/**
 * INPUT statement for user interaction.
 * Example: INPUT "Enter speed: "; gamespeed$
 */
export const inputStmt = sequenceObj([
    keyword('INPUT'), ws,
    capture('promptOpt', optional(sequenceOf([
        stringLiteral, optWs, regex(/^[;,]/), optWs
    ]).map(arr => arr[0].value))),
    capture('targets', sepBy(variableAccess, sequenceOf([optWs, str(','), optWs])))
]).map(obj => ({
    type: 'INPUT',
    prompt: obj.promptOpt || "", 
    targets: obj.targets
}));

/**
 * END statement (Program termination).
 * Uses negative lookahead to ensure it's a stand-alone END, 
 * not part of END IF or END SUB.
 */
export const endStmt = sequenceObj([
    keyword('END'),
    regex(/^(?![ \t]*(?:IF|SUB|FUNCTION|TYPE|SELECT)\b)/i)
]).map(() => ({ type: 'END' }));

/**
 * Master statement choice.
 */
export const statement = choice([
    labelDef, 
    clsStmt, printStmt, locateStmt, colorStmt, 
    defSegStmt, pokeStmt, outStmt, assignStmt, callStmt,
    gotoStmt, gosubStmt, returnStmt,
    randomizeStmt, screenStmt, widthStmt, dataStmt, readStmt, restoreStmt,
    windowStmt, psetStmt,
    inputStmt,
    endStmt,
    implicitCallStmt
]);