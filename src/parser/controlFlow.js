// src/parser/controlFlow.js
import { choice, many, regex, optional, capture, sequenceObj, lazy, sepBy, sequenceOf, Parser } from './monad.js';
import { identifier, keyword, optWs, ws, eos } from './lexers.js';
import { expression } from './expressions.js';
import { statement } from './statements.js';

// Import declarations and subroutines from previous milestones
import { dimDecl, typeDecl, defintDecl, constDecl } from './declarations.js';
import { subDef, functionDef, declareStmt } from './subroutines.js';

/**
 * Consumes whitespace, line endings, and comments (the "noise" between statements).
 */
const skipEmpty = many(choice([ws, eos]));

/**
 * Parses one or more statements separated by colons (:) on a single line.
 */
const statementList = sequenceObj([
    capture('first', lazy(() => statement)),
    capture('rest', many(sequenceOf([optWs, regex(/^:/), optWs, lazy(() => statement)]).map(arr => arr[3])))
]).map(obj => [obj.first, ...obj.rest]);

/**
 * SELECT CASE ... END SELECT
 * Handles multiple expressions per CASE and an optional CASE ELSE.
 */
export const selectCaseStmt = lazy(() => sequenceObj([
    keyword('SELECT'), ws, keyword('CASE'), optWs, capture('testExpr', expression), 
    skipEmpty,
    
    // Capture all 'CASE val1, val2...' blocks
    capture('cases', many(sequenceObj([
        keyword('CASE'), ws, 
        // Force at least one expression so it doesn't accidentally match 'CASE ELSE'
        capture('exprs', sequenceOf([
            expression,
            many(sequenceOf([optWs, regex(/^,/), optWs, expression]).map(arr => arr[3]))
        ]).map(arr => [arr[0], ...arr[1]])), 
        skipEmpty,
        capture('body', block), 
        skipEmpty
    ]).map(obj => ({ exprs: obj.exprs, body: obj.body })))),
    
    // Capture optional 'CASE ELSE'
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
    declareStmt,
    functionDef,
    subDef,
    typeDecl,    
    dimDecl,     
    defintDecl,
    constDecl,
    ifStmt, 
    forStmt, 
    doLoopStmt, 
    selectCaseStmt,
    whileWendStmt,
    statement 
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
 * Classic multi-line IF. Requires a newline after THEN and ELSE.
 */
const multiLineIfStmt = sequenceObj([
    keyword('IF'), ws, capture('condition', expression), ws, keyword('THEN'), 
    eos, 
    capture('thenBlock', block), 
    capture('elseBlockOpt', optional(sequenceObj([
        keyword('ELSE'), 
        eos, 
        capture('elseBlock', block)
    ]).map(obj => obj.elseBlock))),
    keyword('END'), ws, keyword('IF')
]).map(obj => ({
    type: 'IF', 
    condition: obj.condition, 
    thenBlock: obj.thenBlock,
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

// --- 3. DO ... LOOP ---

export const doLoopStmt = sequenceObj([
    keyword('DO'),
    capture('body', block),
    keyword('LOOP'), ws, 
    capture('loopType', choice([keyword('UNTIL'), keyword('WHILE')])), ws, 
    capture('condition', expression)
]).map(obj => ({
    type: 'DO_LOOP', 
    loopType: obj.loopType.toUpperCase(), 
    condition: obj.condition, 
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