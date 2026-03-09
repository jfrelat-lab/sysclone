// src/parser/expressions.js
import { choice, capture, sequenceObj, lazy, chainLeft, sepBy, many, str } from './monad.js';
import { identifier, numberLiteral, stringLiteral, optWs, keyword } from './lexers.js';

/**
 * Main expression parser. Uses lazy evaluation to handle recursive structures
 * like nested parentheses and complex logic.
 */
export const expression = lazy(() => logicExpr);

const parensExpr = sequenceObj([
    str('('), optWs, capture('expr', expression), optWs, str(')')
]).map(obj => obj.expr);

// --- 1. Function Calls and Property Access ---
const commaSep = sequenceObj([optWs, str(','), optWs]);

// a. Call modifier: ( arg1, arg2 )
const argList = sequenceObj([
    str('('), optWs,
    capture('args', sepBy(expression, commaSep)),
    optWs, str(')')
]).map(obj => ({ type: 'MOD_CALL', args: obj.args }));

// b. Property access modifier: .property
const propAccess = sequenceObj([
    str('.'), capture('prop', identifier)
]).map(obj => ({ type: 'MOD_PROP', property: obj.prop.value }));

// c. Postfix modifiers (Subscripts or Members)
const postfixModifier = choice([argList, propAccess]);

/**
 * Handles variable access, which can be followed by zero or more modifiers
 * like array indices arena(r, c) or UDT fields arena.sister.
 */
export const variableAccess = sequenceObj([
    capture('id', identifier),
    capture('modifiers', many(postfixModifier))
]).map(obj => {
    let expr = obj.id; // e.g., { type: 'IDENTIFIER', value: 'ARENA' }
    for (let mod of obj.modifiers) {
        if (mod.type === 'MOD_CALL') {
            expr = { type: 'CALL', callee: expr, args: mod.args };
        } else if (mod.type === 'MOD_PROP') {
            expr = { type: 'MEMBER_ACCESS', object: expr, property: mod.property };
        }
    }
    return expr;
});

const primaryExpr = choice([
    numberLiteral,
    stringLiteral,
    parensExpr,
    variableAccess 
]);

// Helper to assemble Binary AST nodes
const astReducer = (left, op, right) => ({
    type: 'BINARY_OP', operator: typeof op === 'string' ? op : op.value, left, right
});

// Helper to handle whitespace around operators
const opSurroundedByWs = (opParser) => sequenceObj([optWs, capture('op', opParser), optWs]).map(obj => obj.op);


// --- 2. Unary Mathematical Operator (-) ---
const unaryMathOp = opSurroundedByWs(str('-'));
const unaryMathExpr = choice([
    sequenceObj([
        capture('op', unaryMathOp), 
        capture('expr', lazy(() => unaryMathExpr)) // Allows nested unaries like ---5
    ]).map(obj => ({ type: 'UNARY_OP', operator: '-', argument: obj.expr })),
    primaryExpr
]);


// --- 3. Operator Precedence Cascade ---

// Level 5: Exponentiation (Highest binary precedence)
const powerOp = opSurroundedByWs(str('^'));
const powerExpr = chainLeft(unaryMathExpr, powerOp, astReducer);

// Level 4: Multiplication, Division, Integer Division, Modulo
const mulOp = opSurroundedByWs(choice([str('*'), str('/'), str('\\'), keyword('MOD')]));
const mulExpr = chainLeft(powerExpr, mulOp, astReducer);

// Level 3: Addition, Subtraction
const addOp = opSurroundedByWs(choice([str('+'), str('-')]));
const addExpr = chainLeft(mulExpr, addOp, astReducer);

// Level 2: Comparisons
// CRITICAL: Two-character operators must be matched before single-character ones
const compOp = opSurroundedByWs(choice([
    str('<='), str('>='), str('<>'), 
    str('<'), str('>'), str('=')
]));
const compExpr = chainLeft(addExpr, compOp, astReducer);


// --- 4. Unary Logical Operator (NOT) ---
const notOp = opSurroundedByWs(keyword('NOT'));
const unaryLogicExpr = choice([
    sequenceObj([
        capture('op', notOp), 
        capture('expr', lazy(() => unaryLogicExpr))
    ]).map(obj => ({ type: 'UNARY_OP', operator: 'NOT', argument: obj.expr })),
    compExpr
]);

// Level 1: Logical Operators (Root of expression tree)
const logicOp = opSurroundedByWs(choice([keyword('AND'), keyword('OR')]));
const logicExpr = chainLeft(unaryLogicExpr, logicOp, astReducer);