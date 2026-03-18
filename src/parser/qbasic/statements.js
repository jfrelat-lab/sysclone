// src/parser/statements.js
import { choice, sequenceObj, sequenceOf, capture, optional, many, regex, sepBy, str } from '../monad.js';
import { Tokens } from './tokens.js';
import { identifier, keyword, ws, optWs, signedNumberLiteral, stringLiteral } from './lexers.js';
import { expression, variableAccess } from './expressions.js';

/**
 * Reusable parser for graphical coordinates: (x, y)
 */
const coordParser = sequenceObj([
    str('('), optWs,
    capture('x', expression), optWs, str(','), optWs,
    capture('y', expression), optWs,
    str(')')
]).map(obj => ({ x: obj.x, y: obj.y }));

/**
 * Parses a coordinate, optionally preceded by the STEP keyword for relative positioning.
 * Example: STEP (10, 20) or just (10, 20) or even STEP(10, 20)
 */
const stepCoordParser = sequenceObj([
    capture('stepOpt', optional(sequenceOf([keyword(Tokens.STEP), optWs]))),
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
    keyword(Tokens.PRINT),
    // Optional USING "format"; block
    capture('usingOpt', optional(sequenceObj([
        ws, keyword(Tokens.USING), ws,
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
    keyword(Tokens.CLS),
    capture('methodOpt', optional(sequenceOf([ws, expression]).map(arr => arr[1])))
]).map(obj => ({ 
    type: 'CLS', 
    method: obj.methodOpt || null 
}));

/**
 * LOCATE statement
 * Syntax: LOCATE [row] [, [col]] [, [cursor]] [, [start]] [, [stop]]
 */
export const locateStmt = sequenceObj([
    keyword(Tokens.LOCATE),
    // Row is optional and preceded by spaces (e.g. LOCATE 5)
    capture('rowOpt', optional(sequenceOf([ws, expression]).map(arr => arr[1]))),
    capture('colOpt', commaArg),
    capture('cursorOpt', commaArg),
    capture('startOpt', commaArg),
    capture('stopOpt', commaArg)
]).map(obj => ({ 
    type: 'LOCATE', 
    row: obj.rowOpt || null, 
    col: obj.colOpt || null,
    cursor: obj.cursorOpt || null,
    start: obj.startOpt || null,
    stop: obj.stopOpt || null
}));

export const colorStmt = sequenceObj([
    keyword(Tokens.COLOR), ws,
    // The first argument (foreground) is optional in some contexts
    capture('fgOpt', optional(expression)),
    // The second argument (background) is also optional
    capture('bgOpt', optional(sequenceOf([optWs, str(','), optWs, expression]).map(arr => arr[3])))
]).map(obj => ({ 
    type: 'COLOR', 
    fg: obj.fgOpt || null, 
    bg: obj.bgOpt || null 
}));

/**
 * Emulates memory segment selection (x86 Real Mode logic).
 */
export const defSegStmt = sequenceObj([
    keyword(Tokens.DEF), ws, keyword(Tokens.SEG),
    capture('addressOpt', optional(sequenceObj([
        optWs, str('='), optWs, capture('addr', expression)
    ]).map(obj => obj.addr)))
]).map(obj => ({ 
    type: 'DEF_SEG', 
    address: obj.addressOpt || null 
}));

export const pokeStmt = sequenceObj([
    keyword(Tokens.POKE), ws, capture('address', expression), optWs, str(','), optWs, capture('value', expression)
]).map(obj => ({ type: 'POKE', address: obj.address, value: obj.value }));

export const assignStmt = sequenceObj([
    capture('target', variableAccess), optWs, str('='), optWs, capture('value', expression)
]).map(obj => ({ type: 'ASSIGN', target: obj.target, value: obj.value }));

export const swapStmt = sequenceObj([
    keyword(Tokens.SWAP), ws,
    capture('target1', variableAccess), optWs, str(','), optWs,
    capture('target2', variableAccess)
]).map(obj => ({ type: 'SWAP', target1: obj.target1, target2: obj.target2 }));

/**
 * Parses the ERASE statement used to clear arrays.
 * Syntax: ERASE arrayname [, arrayname]...
 */
export const eraseStmt = sequenceObj([
    keyword(Tokens.ERASE), ws,
    capture('targets', sepBy(identifier, sequenceOf([optWs, str(','), optWs])))
]).map(obj => ({ 
    type: 'ERASE', 
    targets: obj.targets.map(id => id.value) 
}));

export const outStmt = sequenceObj([
    keyword(Tokens.OUT), ws, capture('port', expression), optWs, str(','), optWs, capture('value', expression)
]).map(obj => ({ type: 'OUT', port: obj.port, value: obj.value }));

/**
 * Explicit CALL statement for subroutines with parentheses.
 */
export const callStmt = sequenceObj([
    keyword(Tokens.CALL), ws, capture('callee', identifier),
    capture('argsOpt', optional(sequenceObj([
        optWs, str('('), optWs,
        capture('args', optional(sequenceOf([
            expression, many(sequenceOf([optWs, str(','), optWs, expression]).map(arr => arr[3]))
        ]).map(arr => [arr[0], ...arr[1]]))),
        optWs, str(')')
    ]).map(obj => obj.args || [])))
]).map(obj => ({ type: 'CALL', callee: obj.callee, args: obj.argsOpt || [] }));

export const labelDef = sequenceObj([
    capture('name', identifier), optWs, str(':')
]).map(obj => ({ type: 'LABEL', name: obj.name.value }));

export const gotoStmt = sequenceObj([
    keyword(Tokens.GOTO), ws, capture('label', identifier)
]).map(obj => ({ type: 'GOTO', label: obj.label.value }));

export const gosubStmt = sequenceObj([
    keyword(Tokens.GOSUB), ws, capture('label', identifier)
]).map(obj => ({ type: 'GOSUB', label: obj.label.value }));

export const returnStmt = keyword(Tokens.RETURN).map(() => ({ type: 'RETURN' }));

// --- LEGACY EMULATION STATEMENTS (Nibbles Requirements) ---

export const randomizeStmt = sequenceObj([
    keyword(Tokens.RANDOMIZE), 
    capture('seed', optional(sequenceOf([ws, expression]).map(arr => arr[1])))
]).map(obj => ({ type: 'RANDOMIZE', seed: obj.seed || null }));

/**
 * SCREEN statement
 * Syntax: SCREEN [mode] [, [colorswitch]] [, [apage]] [, [vpage]]
 */
export const screenStmt = sequenceObj([
    keyword(Tokens.SCREEN),
    // Mode is optional, preceded by whitespace
    capture('mode', optional(sequenceOf([ws, expression]).map(arr => arr[1]))),
    // Use the existing commaArg helper for all optional trailing parameters
    capture('colorSwitch', commaArg),
    capture('activePage', commaArg),
    capture('visualPage', commaArg)
]).map(obj => ({ 
    type: 'SCREEN_STMT', 
    mode: obj.mode || null,
    colorSwitch: obj.colorSwitch || null,
    activePage: obj.activePage || null,
    visualPage: obj.visualPage || null
}));

export const widthStmt = sequenceObj([
    keyword(Tokens.WIDTH), ws, capture('col', expression),
    capture('rowOpt', optional(sequenceOf([optWs, str(','), optWs, expression]).map(arr => arr[3])))
]).map(obj => ({ type: 'WIDTH', col: obj.col, row: obj.rowOpt || null }));

/**
 * Parses generic unquoted text for DATA statements.
 * Stops cleanly at commas, colons (statement separator), line breaks, or comments (').
 */
const unquotedDataText = regex(/^[^,:\r\n']+/).map(val => ({ 
    type: 'STRING', 
    // QBasic natively trims leading and trailing spaces on unquoted DATA strings
    value: val.trim(), 
    raw: val 
}));

/**
 * Ultimate fallback for empty DATA entries (e.g. DATA 1, , 3 or trailing commas).
 * Matches without consuming characters.
 */
const emptyDataItem = str('').map(() => ({ 
    type: 'STRING', 
    value: "", 
    raw: "" 
}));

/**
 * Prioritized choice for a single DATA element.
 */
const dataItem = choice([
    stringLiteral,
    signedNumberLiteral,
    unquotedDataText,
    emptyDataItem
]);

/**
 * Parses DATA statements containing comma-separated values of mixed types.
 */
export const dataStmt = sequenceObj([
    keyword(Tokens.DATA), ws,
    capture('values', sepBy(dataItem, sequenceOf([optWs, str(','), optWs])))
]).map(obj => ({ type: 'DATA', values: obj.values }));

export const readStmt = sequenceObj([
    keyword(Tokens.READ), ws,
    capture('targets', sepBy(variableAccess, sequenceOf([optWs, str(','), optWs])))
]).map(obj => ({ type: 'READ', targets: obj.targets }));

export const restoreStmt = sequenceObj([
    keyword(Tokens.RESTORE), 
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
    keyword(Tokens.WINDOW), 
    // QBasic allows "WINDOW SCREEN" to invert the Y-axis mathematically
    capture('screenOpt', optional(sequenceOf([ws, keyword(Tokens.SCREEN)]))),
    ws,
    capture('coord1', coordParser), optWs, str('-'), optWs,
    capture('coord2', coordParser)
]).map(obj => ({
    type: 'WINDOW',
    invertY: obj.screenOpt !== null,
    x1: obj.coord1.x, y1: obj.coord1.y,
    x2: obj.coord2.x, y2: obj.coord2.y
}));

/**
 * PSET statement: PSET [STEP] (x,y) [, color]
 */
export const psetStmt = sequenceObj([
    keyword(Tokens.PSET), ws,
    capture('coord', stepCoordParser),
    capture('colorOpt', commaArg)
]).map(obj => ({
    type: 'PSET',
    isStep: obj.coord.isStep,
    x: obj.coord.x,
    y: obj.coord.y,
    color: obj.colorOpt || null
}));

/**
 * PRESET statement: PRESET [STEP] (x,y) [, color]
 * PSET's twin: Draws a pixel, defaulting to the background color if none is provided.
 */
export const presetStmt = sequenceObj([
    keyword(Tokens.PRESET), ws,
    capture('coord', stepCoordParser),
    capture('colorOpt', commaArg)
]).map(obj => ({
    type: 'PRESET',
    isStep: obj.coord.isStep,
    x: obj.coord.x,
    y: obj.coord.y,
    color: obj.colorOpt || null
}));

/**
 * LINE statement: LINE [[STEP] (x1,y1)] - [STEP] (x2,y2) [, color] [, B|BF]
 * Supports relative drawing from the last graphic cursor position (omitted start coordinate).
 */
export const lineStmt = sequenceObj([
    keyword(Tokens.LINE), ws,
    capture('start', optional(stepCoordParser)), optWs, str('-'), optWs,
    capture('end', stepCoordParser),
    capture('colorOpt', commaArg),
    capture('boxOpt', commaArg)
]).map(obj => {
    let box = null;
    if (obj.boxOpt && obj.boxOpt.type === 'IDENTIFIER') {
        const flag = obj.boxOpt.value.toUpperCase();
        if (flag === 'B' || flag === 'BF') box = flag;
    }
    return {
        type: 'LINE',
        startX: obj.start ? obj.start.x : null, 
        startY: obj.start ? obj.start.y : null, 
        startIsStep: obj.start ? obj.start.isStep : false,
        endX: obj.end.x, 
        endY: obj.end.y, 
        endIsStep: obj.end.isStep,
        color: obj.colorOpt || null,
        box: box
    };
});

/**
 * CIRCLE statement: CIRCLE [STEP] (x,y), radius [, color] [, start] [, end] [, aspect]
 */
export const circleStmt = sequenceObj([
    keyword(Tokens.CIRCLE), ws,
    capture('center', stepCoordParser), optWs, str(','), optWs,
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
    keyword(Tokens.PAINT), ws,
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
    keyword(Tokens.ON), ws, keyword(Tokens.ERROR), ws, keyword(Tokens.GOTO), ws,
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
    keyword(Tokens.RESUME),
    // The target is optional. It can be the keyword NEXT, or a label identifier.
    capture('targetOpt', optional(sequenceOf([
        ws, choice([keyword(Tokens.NEXT), identifier])
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
    keyword(Tokens.PALETTE),
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
    keyword(Tokens.PSET), keyword(Tokens.PRESET), 
    keyword(Tokens.XOR), keyword(Tokens.OR), keyword(Tokens.AND)
]);

export const putGraphicsStmt = sequenceObj([
    keyword(Tokens.PUT), ws,
    capture('coord', stepCoordParser), optWs, str(','), optWs,
    // The sprite data array (e.g., LBan& or bananaArray(0))
    capture('target', expression),
    // The blending mode is optional. If omitted, QBasic defaults to XOR
    capture('actionOpt', optional(sequenceObj([
        optWs, str(','), optWs,
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
    keyword(Tokens.GET), ws,
    capture('start', stepCoordParser), optWs, str('-'), optWs,
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
    keyword(Tokens.VIEW), ws, keyword(Tokens.PRINT),
    capture('rangeOpt', optional(sequenceObj([
        ws, capture('top', expression), 
        ws, keyword(Tokens.TO), ws, 
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
    keyword(Tokens.PLAY), ws, capture('music', expression)
]).map(obj => ({
    type: 'PLAY',
    music: obj.music
}));

/**
 * Parses the BEEP statement used for simple PC Speaker sounds.
 * Syntax: BEEP
 */
export const beepStmt = keyword(Tokens.BEEP).map(() => ({ type: 'BEEP' }));

/**
 * Parses the SOUND statement.
 * Syntax: SOUND frequency, duration
 * Note: duration is in DOS clock ticks (approx 18.2 ticks per second).
 */
export const soundStmt = sequenceObj([
    keyword(Tokens.SOUND), ws,
    capture('freq', expression), optWs, str(','), optWs,
    capture('duration', expression)
]).map(obj => ({
    type: 'SOUND',
    freq: obj.freq,
    duration: obj.duration
}));

/**
 * Parses the SLEEP statement.
 * Syntax: SLEEP [seconds]
 * If seconds is omitted, it halts until a key is pressed.
 */
export const sleepStmt = sequenceObj([
    keyword(Tokens.SLEEP),
    capture('duration', optional(sequenceOf([ws, expression]).map(arr => arr[1])))
]).map(obj => ({
    type: 'SLEEP',
    duration: obj.duration || null
}));

/**
 * Parses the LINE INPUT statement.
 * Used to read an entire line of text from the user, ignoring comma separators.
 * Syntax: LINE INPUT ["prompt";] stringVariable$
 */
export const lineInputStmt = sequenceObj([
    keyword(Tokens.LINE), ws, keyword(Tokens.INPUT), ws,
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
    keyword(Tokens.INPUT), ws,
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
    keyword(Tokens.END),
    regex(/^(?![ \t]*(?:IF|SUB|FUNCTION|TYPE|SELECT)\b)/i)
]).map(() => ({ type: 'END' }));

/**
 * Parses the EXIT statement used to break out of loops or subroutines.
 * Syntax: EXIT FOR | EXIT DO | EXIT SUB | EXIT FUNCTION
 */
export const exitStmt = sequenceObj([
    keyword(Tokens.EXIT), ws,
    capture('target', choice([keyword(Tokens.FOR), keyword(Tokens.DO), keyword(Tokens.SUB), keyword(Tokens.FUNCTION)]))
]).map(obj => ({
    type: 'EXIT',
    target: obj.target
}));