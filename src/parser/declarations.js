// src/parser/declarations.js

import { choice, sequenceObj, sequenceOf, capture, optional, many, regex, str, sepBy } from './monad.js';
import { identifier, keyword, ws, optWs, eos } from './lexers.js';
import { expression } from './expressions.js';

/**
 * Parses implicit integer type definitions.
 * Example: DEFINT A-Z
 */
export const defintDecl = sequenceObj([
    keyword('DEFINT'), ws,
    capture('range', regex(/^[A-Z]-[A-Z]/i))
]).map(obj => ({
    type: 'DEFINT',
    range: obj.range.toUpperCase()
}));

const singleConst = sequenceObj([
    capture('name', identifier), optWs, regex(/^=/), optWs,
    capture('value', expression)
]).map(obj => ({ name: obj.name.value, value: obj.value }));

/**
 * Parses constant definitions (supports multiple separated by commas).
 * Example: CONST MAX_LIVES = 3, SPEED = 10
 */
export const constDecl = sequenceObj([
    keyword('CONST'), ws,
    capture('declarations', sepBy(singleConst, sequenceOf([optWs, str(','), optWs])))
]).map(obj => ({
    type: 'CONST',
    declarations: obj.declarations
}));

/**
 * Parses User-Defined Type (UDT) structures.
 * Example: 
 * TYPE SnakeBody
 * x AS INTEGER
 * Bord AS STRING * 3
 * END TYPE
 */
export const typeDecl = sequenceObj([
    keyword('TYPE'), ws, capture('name', identifier), eos,
    capture('fields', many(sequenceObj([
        optWs, capture('field', identifier), ws, keyword('AS'), ws, capture('fieldType', identifier),
        capture('lengthOpt', optional(sequenceObj([
            optWs, str('*'), optWs, capture('len', expression)
        ]).map(obj => obj.len))),
        eos
    ]).map(obj => ({ 
        name: obj.field.value, 
        type: obj.fieldType.value,
        length: obj.lengthOpt || null
    })))),
    optWs, keyword('END'), ws, keyword('TYPE')
]).map(obj => ({
    type: 'TYPE_DECL',
    name: obj.name.value,
    fields: obj.fields
}));

// --- 4. ARRAY AND VARIABLE DIMENSIONING (DIM) ---

/**
 * Parses array bounds, supporting both "max" and "min TO max" syntax.
 */
const arrayBound = choice([
    sequenceObj([
        capture('min', expression), ws, keyword('TO'), ws, capture('max', expression)
    ]).map(obj => ({ min: obj.min, max: obj.max })),
    expression.map(expr => ({ min: { type: 'NUMBER', value: 0 }, max: expr }))
]);

/**
 * Parses the list of dimensions for an array within parentheses.
 */
const boundsList = sequenceObj([
    str('('), optWs,
    capture('bounds', sequenceOf([
        arrayBound, 
        many(sequenceOf([optWs, str(','), optWs, arrayBound]).map(arr => arr[3])) 
    ]).map(arr => [arr[0], ...arr[1]])),
    optWs, str(')')
]).map(obj => obj.bounds);

/**
 * Parses a single variable or array declaration within a DIM statement.
 */
const singleDim = sequenceObj([
    capture('nameId', identifier),
    capture('boundsOpt', optional(boundsList)),
    capture('typeOpt', optional(sequenceObj([
        ws, keyword('AS'), ws, capture('typeId', identifier),
        capture('lengthOpt', optional(sequenceObj([
            optWs, str('*'), optWs, capture('len', expression)
        ]).map(obj => obj.len)))
    ]).map(obj => ({
        type: obj.typeId.value,
        length: obj.lengthOpt || null
    })))) 
]).map(obj => ({
    name: obj.nameId.value,
    isArray: obj.boundsOpt !== null,
    bounds: obj.boundsOpt || [],
    varType: obj.typeOpt ? obj.typeOpt.type : 'VARIANT',
    length: obj.typeOpt ? obj.typeOpt.length : null
}));

/**
 * Main DIM parser. Handles multiple declarations and the SHARED attribute.
 * Example: DIM SHARED arena(1 TO 50, 1 TO 80) AS INTEGER
 */
export const dimDecl = sequenceObj([
    keyword('DIM'),
    capture('sharedOpt', optional(sequenceOf([ws, keyword('SHARED')]))),
    ws,
    capture('declarations', sequenceOf([
        singleDim,
        many(sequenceOf([optWs, str(','), optWs, singleDim]).map(arr => arr[3]))
    ]).map(arr => [arr[0], ...arr[1]]))
]).map(obj => ({
    type: 'DIM',
    shared: obj.sharedOpt !== null,
    declarations: obj.declarations 
}));

/**
 * Main REDIM parser. 
 * Dynamically reallocates array bounds. In QBasic, without PRESERVE, this clears the array.
 * Example: REDIM LBan&(8), RBan&(8)
 */
export const redimDecl = sequenceObj([
    keyword('REDIM'),
    capture('sharedOpt', optional(sequenceOf([ws, keyword('SHARED')]))),
    ws,
    capture('declarations', sequenceOf([
        singleDim,
        many(sequenceOf([optWs, str(','), optWs, singleDim]).map(arr => arr[3]))
    ]).map(arr => [arr[0], ...arr[1]]))
]).map(obj => ({
    type: 'REDIM',
    shared: obj.sharedOpt !== null,
    declarations: obj.declarations 
}));