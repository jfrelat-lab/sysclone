// src/parser/controlFlow.js
import { choice, many, regex, optional, capture, sequenceObj, lazy, sequenceOf } from '../monad.js';
import { Tokens } from './tokens.js';
import { identifier, keyword, optWs, ws, eos, signedNumberLiteral } from './lexers.js';
import { expression } from './expressions.js';
import { 
    labelDef, clsStmt, viewPrintStmt, playStmt, beepStmt, soundStmt, sleepStmt, printStmt, locateStmt, colorStmt, 
    defSegStmt, pokeStmt, outStmt, assignStmt, swapStmt, eraseStmt, callStmt,
    gotoStmt, gosubStmt, returnStmt, randomizeStmt, 
    screenStmt, widthStmt, dataStmt, readStmt, restoreStmt,
    windowStmt, psetStmt, presetStmt, lineStmt, circleStmt, paintStmt,
    onErrorStmt, resumeStmt, paletteStmt, putGraphicsStmt, getGraphicsStmt,
    inputStmt, lineInputStmt, endStmt, exitStmt, implicitCallStmt 
} from './statements.js';

// Import declarations and subroutines from previous milestones
import { dimDecl, redimDecl, staticDecl, sharedDecl, typeDecl, defintDecl, defsngDecl, constDecl } from './declarations.js';
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
    windowStmt, psetStmt, presetStmt, lineStmt, circleStmt, paintStmt,
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
 * 1. Relational Matching (e.g., CASE IS >= 90)
 * Unambiguous because it explicitly starts with the 'IS' keyword.
 */
const caseIs = sequenceObj([
    keyword(Tokens.IS), optWs, 
    capture('operator', regex(/^(>=|<=|<>|>|<|=)/)), optWs, 
    capture('value', expression)
]).map(obj => ({ 
    type: 'CASE_IS', 
    operator: obj.operator, 
    value: obj.value 
}));

/**
 * 2. Range Matching (e.g., CASE 4 TO 6)
 * Must be checked BEFORE caseExact, otherwise the first expression is consumed prematurely!
 */
const caseRange = sequenceObj([
    capture('low', expression), ws, 
    keyword(Tokens.TO), ws, 
    capture('high', expression)
]).map(obj => ({ 
    type: 'CASE_RANGE', 
    low: obj.low, 
    high: obj.high 
}));

/**
 * 3. Exact Matching (e.g., CASE 5 or CASE "Hello")
 * The ultimate fallback. It simply consumes a single expression.
 */
const caseExact = expression; // No mapping needed, the expression parser already returns a valid AST node

/**
 * Parses a single item within a CASE statement list.
 * Order matters: Most specific patterns first, generic fallbacks last.
 */
const caseItem = choice([
    caseIs,
    caseRange,
    caseExact
]);

/**
 * SELECT CASE ... END SELECT
 * Handles multiple expressions per CASE, ranges (TO), and an optional CASE ELSE.
 */
export const selectCaseStmt = lazy(() => sequenceObj([
    keyword(Tokens.SELECT), ws, keyword(Tokens.CASE), optWs, capture('testExpr', expression), 
    skipEmpty,
    
    capture('cases', many(sequenceObj([
        keyword(Tokens.CASE), ws, 
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
        keyword(Tokens.CASE), ws, keyword(Tokens.ELSE), skipEmpty,
        capture('body', block), 
        skipEmpty
    ]).map(obj => obj.body))),
    
    keyword(Tokens.END), ws, keyword(Tokens.SELECT)
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
    dimDecl, redimDecl, staticDecl, sharedDecl,
    defintDecl, defsngDecl,
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
    optWs, keyword(Tokens.ELSEIF), ws, capture('condition', expression), ws, keyword(Tokens.THEN), eos,
    capture('block', lazy(() => block))
]).map(obj => ({
    condition: obj.condition,
    block: obj.block
}));

/**
 * Classic multi-line IF.
 */
const multiLineIfStmt = sequenceObj([
    keyword(Tokens.IF), ws, capture('condition', expression), ws, keyword(Tokens.THEN), eos, 
    capture('thenBlock', block), 
    capture('elseIfBlocks', many(elseIfBlock)),
    capture('elseBlockOpt', optional(sequenceObj([
        optWs, keyword(Tokens.ELSE), eos, 
        capture('elseBlock', block)
    ]).map(obj => obj.elseBlock))),    
    optWs, keyword(Tokens.END), ws, keyword(Tokens.IF)
]).map(obj => ({
    type: 'IF', 
    condition: obj.condition, 
    thenBlock: obj.thenBlock,
    elseIfBlocks: obj.elseIfBlocks,
    elseBlock: obj.elseBlockOpt || []
}));

/**
 * Parses an implicit GOTO when a line number is provided directly after THEN or ELSE.
 * Wraps the result in an array to perfectly mimic a standard statementList.
 */
const implicitGotoLine = signedNumberLiteral.map(node => [{ type: 'GOTO', label: String(node.value) }]);

/**
 * Defines the valid payload for a THEN or ELSE clause on a single line.
 * Evaluated lazily to allow mutual recursion with singleLineIfStmt.
 */
const singleLineClause = lazy(() => choice([
    implicitGotoLine,
    singleLineIfStmt.map(ast => [ast]), // Clean recursion for nested IFs (e.g., ELSE IF)
    statementList
]));

/**
 * Single-line IF. Statements follow immediately on the same line.
 * Supports archaic implicit GOTO jumps (e.g., IF X THEN 10) 
 * and recursive nested IFs (e.g., IF A THEN B ELSE IF C THEN D).
 */
const singleLineIfStmt = sequenceObj([
    keyword(Tokens.IF), ws, capture('condition', expression), ws, keyword(Tokens.THEN), optWs,
    capture('thenBlock', singleLineClause),
    capture('elseBlockOpt', optional(sequenceObj([
        optWs, keyword(Tokens.ELSE), optWs,
        capture('elseBlock', singleLineClause)
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
    keyword(Tokens.FOR), ws, capture('varName', identifier), optWs, regex(/^=/), optWs,
    capture('start', expression), ws, keyword(Tokens.TO), ws, capture('end', expression),
    capture('stepOpt', optional(sequenceObj([
        ws, keyword(Tokens.STEP), ws, capture('stepExpr', expression)
    ]))),
    capture('body', block), 
    keyword(Tokens.NEXT), optional(sequenceObj([ws, identifier]))
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
    keyword(Tokens.DO), ws,
    capture('loopType', choice([keyword(Tokens.UNTIL), keyword(Tokens.WHILE)])), ws,
    capture('condition', expression),
    capture('body', block),
    keyword(Tokens.LOOP)
]).map(obj => ({
    type: 'DO_PRE_COND', 
    loopType: obj.loopType.toUpperCase(), 
    condition: obj.condition, 
    body: obj.body
}));

// --- 3B. DO ... LOOP [{WHILE | UNTIL} cond] (Post-Condition or Infinite) ---

export const doPostCondStmt = sequenceObj([
    keyword(Tokens.DO),
    capture('body', block),
    keyword(Tokens.LOOP),
    capture('condOpt', optional(sequenceObj([
        ws, capture('loopType', choice([keyword(Tokens.UNTIL), keyword(Tokens.WHILE)])), ws, 
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
    keyword(Tokens.WHILE), ws, capture('condition', expression),
    capture('body', block),
    keyword(Tokens.WEND)
]).map(obj => ({
    type: 'WHILE_WEND',
    condition: obj.condition,
    body: obj.body
}));