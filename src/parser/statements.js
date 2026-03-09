// src/parser/statements.js
import { choice, sequenceObj, sequenceOf, capture, optional, many, regex, sepBy, str } from './monad.js';
import { identifier, keyword, ws, optWs, signedNumberLiteral, stringLiteral } from './lexers.js';
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
 * Parses a coordinate, optionally preceded by the STEP keyword for relative positioning.
 * Example: STEP (10, 20) or just (10, 20)
 */
const stepCoordParser = sequenceObj([
    capture('stepOpt', optional(sequenceOf([keyword('STEP'), ws]))),
    capture('coord', coordParser)
]).map(obj => ({
    isStep: obj.stepOpt !== null,
    x: obj.coord.x,
    y: obj.coord.y
}));

/**
 * Helper for optional comma-separated arguments.
 * Safely handles empty arguments like: , , BF
 */
const commaArg = optional(sequenceObj([
    regex(/^[ \t]*,[ \t]*/),
    capture('val', optional(expression))
]).map(obj => obj.val));

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

/**
 * Parses the CLS statement.
 * Syntax: CLS [method] (0 = all text, 1 = active graphics viewport, 2 = active text viewport)
 */
export const clsStmt = sequenceObj([
    keyword('CLS'),
    capture('methodOpt', optional(sequenceOf([ws, expression]).map(arr => arr[1])))
]).map(obj => ({ 
    type: 'CLS', 
    method: obj.methodOpt || null 
}));

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

/**
 * Parses DATA statements containing comma-separated literal values.
 */
export const dataStmt = sequenceObj([
    keyword('DATA'), ws,
    capture('values', sepBy(choice([signedNumberLiteral, stringLiteral, identifier]), sequenceOf([optWs, str(','), optWs])))
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
 * PSET statement
 */
export const psetStmt = sequenceObj([
    keyword('PSET'), ws,
    capture('coord', stepCoordParser),
    capture('colorOpt', optional(sequenceObj([
        optWs, regex(/^,/), optWs, capture('c', expression)
    ]).map(obj => obj.c)))
]).map(obj => ({
    type: 'PSET',
    isStep: obj.coord.isStep,
    x: obj.coord.x,
    y: obj.coord.y,
    color: obj.colorOpt || null
}));

/**
 * LINE statement: LINE [STEP] (x1,y1) - [STEP] (x2,y2) [, color] [, B|BF]
 */
export const lineStmt = sequenceObj([
    keyword('LINE'), ws,
    capture('start', stepCoordParser), optWs, regex(/^-/), optWs,
    capture('end', stepCoordParser),
    capture('colorOpt', commaArg),
    capture('boxOpt', commaArg)
]).map(obj => {
    let box = null;
    // Safely check if the second optional argument is the identifier B or BF
    if (obj.boxOpt && obj.boxOpt.type === 'IDENTIFIER') {
        const flag = obj.boxOpt.value.toUpperCase();
        if (flag === 'B' || flag === 'BF') box = flag;
    }
    return {
        type: 'LINE',
        startX: obj.start.x, startY: obj.start.y, startIsStep: obj.start.isStep,
        endX: obj.end.x, endY: obj.end.y, endIsStep: obj.end.isStep,
        color: obj.colorOpt || null,
        box: box
    };
});

/**
 * CIRCLE statement: CIRCLE [STEP] (x,y), radius [, color] [, start] [, end] [, aspect]
 */
export const circleStmt = sequenceObj([
    keyword('CIRCLE'), ws,
    capture('center', stepCoordParser), optWs, regex(/^,/), optWs,
    capture('radius', expression),
    capture('color', commaArg),
    capture('start', commaArg),
    capture('end', commaArg),
    capture('aspect', commaArg)
]).map(obj => ({
    type: 'CIRCLE',
    x: obj.center.x, y: obj.center.y, isStep: obj.center.isStep,
    radius: obj.radius,
    color:  obj.color || null,
    start:  obj.start || null,
    end:    obj.end || null,
    aspect: obj.aspect || null
}));

/**
 * PAINT statement: PAINT [STEP] (x,y) [, paint_color] [, border_color]
 */
export const paintStmt = sequenceObj([
    keyword('PAINT'), ws,
    capture('start', stepCoordParser),
    capture('paintColor', commaArg),
    capture('borderColor', commaArg)
]).map(obj => ({
    type: 'PAINT',
    x: obj.start.x, y: obj.start.y, isStep: obj.start.isStep,
    paintColor:  obj.paintColor || null,
    borderColor: obj.borderColor || null
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

// --- LEGACY ERROR HANDLING & HARDWARE ---

/**
 * Parses the 'ON ERROR GOTO' statement.
 * This is heavily used in legacy QBasic (like Gorillas) for hardware detection
 * and runtime error trapping (e.g., trying to set an unsupported video mode).
 * The target can be a label (Identifier) to jump to, or 0 (Number) to disable the handler.
 * * Example: ON ERROR GOTO ScreenModeError
 * Example: ON ERROR GOTO 0
 */
export const onErrorStmt = sequenceObj([
    keyword('ON'), ws, keyword('ERROR'), ws, keyword('GOTO'), ws,
    // Capture either a valid label name or a numeric 0
    capture('target', choice([identifier, signedNumberLiteral]))
]).map(obj => {
    return {
        type: 'ON_ERROR',
        // Extract the raw value (string for labels, number for 0) regardless of the AST node type
        target: obj.target.value
    };
});

/**
 * Parses the RESUME statement used in error handling routines.
 * Syntax: RESUME [NEXT | label]
 */
export const resumeStmt = sequenceObj([
    keyword('RESUME'),
    // The target is optional. It can be the keyword NEXT, or a label identifier.
    capture('targetOpt', optional(sequenceOf([
        ws, choice([keyword('NEXT'), identifier])
    ]).map(arr => arr[1])))
]).map(obj => {
    let target = null;
    if (obj.targetOpt) {
        // If it's an identifier (label), extract its value. Otherwise, it's the string 'NEXT'
        target = obj.targetOpt.type === 'IDENTIFIER' ? obj.targetOpt.value : 'NEXT';
    }
    return {
        type: 'RESUME',
        target: target // Will be null, 'NEXT', or a string (label name)
    };
});

/**
 * Parses the 'PALETTE' statement.
 * Used to modify hardware color mappings, which is essential for EGA/VGA modes.
 * Note: Arguments are technically optional in QBasic (calling PALETTE alone resets default colors).
 * * Syntax: PALETTE [attribute, color]
 * Example: PALETTE 4, 0
 */
export const paletteStmt = sequenceObj([
    keyword('PALETTE'),
    // The entire argument block is optional
    capture('args', optional(sequenceObj([
        ws, capture('attribute', expression),
        optWs, str(','), optWs, // Using str(',') for optimal performance
        capture('color', expression)
    ])))
]).map(obj => ({
    type: 'PALETTE',
    // Safely map the parsed expressions or return null if PALETTE was called without arguments
    attribute: obj.args ? obj.args.attribute : null,
    color: obj.args ? obj.args.color : null
}));

/**
 * Parses the graphics PUT statement used for sprite rendering.
 * Syntax: PUT [STEP] (x, y), arrayName [, actionVerb]
 * Action verbs: PSET, PRESET, XOR, OR, AND (Default is XOR)
 */
const putActionParser = choice([
    keyword('PSET'), keyword('PRESET'), 
    keyword('XOR'), keyword('OR'), keyword('AND')
]);

export const putGraphicsStmt = sequenceObj([
    keyword('PUT'), ws,
    capture('coord', stepCoordParser), optWs, regex(/^,/), optWs,
    // The sprite data array (e.g., LBan& or bananaArray(0))
    capture('target', expression),
    // The blending mode is optional. If omitted, QBasic defaults to XOR
    capture('actionOpt', optional(sequenceObj([
        optWs, regex(/^,/), optWs,
        capture('action', putActionParser)
    ]).map(obj => obj.action)))
]).map(obj => ({
    type: 'PUT_GRAPHICS',
    isStep: obj.coord.isStep,
    x: obj.coord.x,
    y: obj.coord.y,
    target: obj.target,
    action: obj.actionOpt || 'XOR' // Default behavior in QBasic
}));

/**
 * Parses the graphics GET statement used to capture screen regions into an array.
 * Syntax: GET [STEP] (x1, y1) - [STEP] (x2, y2), arrayName
 */
export const getGraphicsStmt = sequenceObj([
    keyword('GET'), ws,
    capture('start', stepCoordParser), optWs, regex(/^-/), optWs,
    capture('end', stepCoordParser), optWs, str(','), optWs,
    capture('target', expression)
]).map(obj => ({
    type: 'GET_GRAPHICS',
    startX: obj.start.x, 
    startY: obj.start.y, 
    startIsStep: obj.start.isStep,
    endX: obj.end.x, 
    endY: obj.end.y, 
    endIsStep: obj.end.isStep,
    target: obj.target
}));

/**
 * Parses the VIEW PRINT statement.
 * Used to set the text viewport boundaries. Calling it without arguments resets the viewport.
 * Syntax: VIEW PRINT [topLine TO bottomLine]
 */
export const viewPrintStmt = sequenceObj([
    keyword('VIEW'), ws, keyword('PRINT'),
    capture('rangeOpt', optional(sequenceObj([
        ws, capture('top', expression), 
        ws, keyword('TO'), ws, 
        capture('bottom', expression)
    ])))
]).map(obj => ({
    type: 'VIEW_PRINT',
    top: obj.rangeOpt ? obj.rangeOpt.top : null,
    bottom: obj.rangeOpt ? obj.rangeOpt.bottom : null
}));

/**
 * Parses the PLAY statement used for playing musical macros.
 * Syntax: PLAY stringExpression
 */
export const playStmt = sequenceObj([
    keyword('PLAY'), ws, capture('music', expression)
]).map(obj => ({
    type: 'PLAY',
    music: obj.music
}));

/**
 * Parses the LINE INPUT statement.
 * Used to read an entire line of text from the user, ignoring comma separators.
 * Syntax: LINE INPUT ["prompt";] stringVariable$
 */
export const lineInputStmt = sequenceObj([
    keyword('LINE'), ws, keyword('INPUT'), ws,
    capture('promptOpt', optional(sequenceOf([
        stringLiteral, optWs, regex(/^[;,]/), optWs
    ]).map(arr => arr[0].value))),
    capture('target', variableAccess) // LINE INPUT only writes to a single variable
]).map(obj => ({
    type: 'LINE_INPUT',
    prompt: obj.promptOpt || "",
    target: obj.target
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