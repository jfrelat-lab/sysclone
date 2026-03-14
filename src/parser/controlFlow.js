// src/parser/controlFlow.js
import { choice, many, regex, optional, capture, sequenceObj, lazy, sequenceOf } from './monad.js';
import { identifier, keyword, optWs, ws, eos } from './lexers.js';
import { expression } from './expressions.js';
import { 
    labelDef, clsStmt, viewPrintStmt, playStmt, beepStmt, soundStmt, sleepStmt, printStmt, locateStmt, colorStmt, 
    defSegStmt, pokeStmt, outStmt, assignStmt, swapStmt, eraseStmt, callStmt,
    gotoStmt, gosubStmt, returnStmt, randomizeStmt, 
    screenStmt, widthStmt, dataStmt, readStmt, restoreStmt,
    windowStmt, psetStmt, lineStmt, circleStmt, paintStmt,
    onErrorStmt, resumeStmt, paletteStmt, putGraphicsStmt, getGraphicsStmt,
    inputStmt, lineInputStmt, endStmt, exitStmt, implicitCallStmt 
} from './statements.js';

// Import declarations and subroutines from previous milestones
import { dimDecl, redimDecl, typeDecl, defintDecl, constDecl } from './declarations.js';
import { subDef, functionDef, declareStmt, defFnStmt } from './subroutines.js';

/**
 * Consumes whitespace, line endings, and comments (the "noise" between statements).
 */
const skipEmpty = many(choice([ws, eos]));

/**
 * Represents a single, atomic instruction (no blocks, no control flow).
 * This aggregates all individual parsers from statements.js.
 */
const atomicStatement = lazy(() => choice([
    labelDef, clsStmt, printStmt, locateStmt, colorStmt, 
    defSegStmt, pokeStmt, outStmt, assignStmt, swapStmt, eraseStmt, callStmt,
    gotoStmt, gosubStmt, returnStmt, randomizeStmt, 
    lineInputStmt, // Before lineStmt
    viewPrintStmt, playStmt, beepStmt, soundStmt, sleepStmt,
    screenStmt, widthStmt, dataStmt, readStmt, restoreStmt,
    windowStmt, psetStmt, lineStmt, circleStmt, paintStmt,
    onErrorStmt, resumeStmt, paletteStmt, putGraphicsStmt, getGraphicsStmt,
    inputStmt, endStmt, exitStmt, implicitCallStmt
]));

/**
 * Parses one or more statements separated by colons (:) on a single line.
 */
const statementList = sequenceObj([
    capture('first', lazy(() => atomicStatement)),
    capture('rest', many(sequenceOf([optWs, regex(/^:/), optWs, lazy(() => atomicStatement)]).map(arr => arr[3])))
]).map(obj => [obj.first, ...obj.rest]);

/**
 * Parses a single item within a CASE statement.
 * Handles both exact values (CASE 5) and ranges (CASE 3 TO 5).
 */
const caseItem = sequenceObj([
    capture('low', expression),
    capture('highOpt', optional(sequenceObj([
        ws, keyword('TO'), ws, capture('high', expression)
    ]).map(obj => obj.high)))
]).map(obj => {
    // If 'TO' was found, return a range node
    if (obj.highOpt) {
        return { type: 'CASE_RANGE', low: obj.low, high: obj.highOpt };
    }
    return obj.low;
});

/**
 * SELECT CASE ... END SELECT
 * Handles multiple expressions per CASE, ranges (TO), and an optional CASE ELSE.
 */
export const selectCaseStmt = lazy(() => sequenceObj([
    keyword('SELECT'), ws, keyword('CASE'), optWs, capture('testExpr', expression), 
    skipEmpty,
    
    capture('cases', many(sequenceObj([
        keyword('CASE'), ws, 
        // Capture a comma-separated list of caseItems (values or ranges)
        capture('exprs', sequenceOf([
            caseItem,
            many(sequenceOf([optWs, regex(/^,/), optWs, caseItem]).map(arr => arr[3]))
        ]).map(arr => [arr[0], ...arr[1]])), 
        skipEmpty,
        capture('body', block), 
        skipEmpty
    ]).map(obj => ({ exprs: obj.exprs, body: obj.body })))),
    
    capture('caseElse', optional(sequenceObj([
        keyword('CASE'), ws, keyword('ELSE'), skipEmpty,
        capture('body', block), 
        skipEmpty
    ]).map(obj => obj.body))),
    
    keyword('END'), ws, keyword('SELECT')
]).map(obj => ({
    type: 'SELECT_CASE',
    testExpr: obj.testExpr,
    cases: obj.cases,
    caseElse: obj.caseElse || []
})));

/**
 * Master choice for any valid statement, declaration, or routine definition.
 */
const anyStatement = lazy(() => choice([
    defFnStmt,
    declareStmt,
    functionDef,
    subDef,
    typeDecl,
    dimDecl, redimDecl,
    defintDecl,
    constDecl,
    ifStmt,
    forStmt,
    doPreCondStmt,
    doPostCondStmt,
    selectCaseStmt,
    whileWendStmt,
    atomicStatement
]));

/**
 * A "line" consists of a statement preceded by optional whitespace
 * and followed by an optional End Of Statement (EOS).
 */
const line = sequenceObj([
    optWs, 
    capture('stmt', anyStatement),
    optional(eos) 
]).map(obj => obj.stmt);

/**
 * A "block" is a collection of lines. 
 * This is the primary entry point for recursive structures like SUB or IF.
 */
export const block = lazy(() => sequenceObj([
    optional(eos), // Clean up leading empty lines
    capture('lines', many(line))
]).map(obj => obj.lines));

// --- 1. IF STRUCTURES ---

/**
 * Parses an ELSEIF block.
 */
const elseIfBlock = sequenceObj([
    optWs, keyword('ELSEIF'), ws, capture('condition', expression), ws, keyword('THEN'), eos,
    capture('block', lazy(() => block))
]).map(obj => ({
    condition: obj.condition,
    block: obj.block
}));

/**
 * Classic multi-line IF.
 */
const multiLineIfStmt = sequenceObj([
    keyword('IF'), ws, capture('condition', expression), ws, keyword('THEN'), eos, 
    capture('thenBlock', block), 
    capture('elseIfBlocks', many(elseIfBlock)),
    capture('elseBlockOpt', optional(sequenceObj([
        optWs, keyword('ELSE'), eos, 
        capture('elseBlock', block)
    ]).map(obj => obj.elseBlock))),    
    optWs, keyword('END'), ws, keyword('IF')
]).map(obj => ({
    type: 'IF', 
    condition: obj.condition, 
    thenBlock: obj.thenBlock,
    elseIfBlocks: obj.elseIfBlocks,
    elseBlock: obj.elseBlockOpt || []
}));

/**
 * Single-line IF. Statements follow immediately on the same line.
 */
const singleLineIfStmt = sequenceObj([
    keyword('IF'), ws, capture('condition', expression), ws, keyword('THEN'), optWs,
    capture('thenBlock', statementList),
    capture('elseBlockOpt', optional(sequenceObj([
        optWs, keyword('ELSE'), optWs,
        capture('elseBlock', statementList)
    ]).map(obj => obj.elseBlock)))
]).map(obj => ({
    type: 'IF',
    condition: obj.condition,
    thenBlock: obj.thenBlock,
    elseBlock: obj.elseBlockOpt || []
}));

export const ifStmt = choice([multiLineIfStmt, singleLineIfStmt]);

// --- 2. FOR ... NEXT ---

export const forStmt = sequenceObj([
    keyword('FOR'), ws, capture('varName', identifier), optWs, regex(/^=/), optWs,
    capture('start', expression), ws, keyword('TO'), ws, capture('end', expression),
    capture('stepOpt', optional(sequenceObj([
        ws, keyword('STEP'), ws, capture('stepExpr', expression)
    ]))),
    capture('body', block), 
    keyword('NEXT'), optional(sequenceObj([ws, identifier]))
]).map(obj => ({
    type: 'FOR', 
    variable: obj.varName.value, 
    start: obj.start, 
    end: obj.end,
    step: obj.stepOpt ? obj.stepOpt.stepExpr : { type: 'NUMBER', value: 1 }, 
    body: obj.body
}));

// --- 3A. DO {WHILE | UNTIL} cond ... LOOP (Pre-Condition) ---

export const doPreCondStmt = sequenceObj([
    keyword('DO'), ws,
    capture('loopType', choice([keyword('UNTIL'), keyword('WHILE')])), ws,
    capture('condition', expression),
    capture('body', block),
    keyword('LOOP')
]).map(obj => ({
    type: 'DO_PRE_COND', 
    loopType: obj.loopType.toUpperCase(), 
    condition: obj.condition, 
    body: obj.body
}));

// --- 3B. DO ... LOOP [{WHILE | UNTIL} cond] (Post-Condition or Infinite) ---

export const doPostCondStmt = sequenceObj([
    keyword('DO'),
    capture('body', block),
    keyword('LOOP'),
    capture('condOpt', optional(sequenceObj([
        ws, capture('loopType', choice([keyword('UNTIL'), keyword('WHILE')])), ws, 
        capture('condition', expression)
    ])))
]).map(obj => ({
    type: 'DO_POST_COND', 
    loopType: obj.condOpt ? obj.condOpt.loopType.toUpperCase() : 'NONE', 
    condition: obj.condOpt ? obj.condOpt.condition : null, 
    body: obj.body
}));

// --- 4. WHILE ... WEND ---

export const whileWendStmt = sequenceObj([
    keyword('WHILE'), ws, capture('condition', expression),
    capture('body', block),
    keyword('WEND')
]).map(obj => ({
    type: 'WHILE_WEND',
    condition: obj.condition,
    body: obj.body
}));