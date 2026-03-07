// src/parser/subroutines.js
import { choice, sequenceObj, sequenceOf, capture, optional, many, regex, lazy } from './monad.js';
import { identifier, keyword, ws, optWs, eos } from './lexers.js';
import { block } from './controlFlow.js';

/**
 * Robust parameter parser.
 * Handles signatures like "sammy() AS snaketype" or "snake() AS ANY".
 */
const paramParser = sequenceObj([
    capture('id', identifier),
    optional(sequenceOf([optWs, regex(/^\(\)/)])), // Handles array parentheses in signatures
    optional(sequenceObj([
        optWs, keyword('AS'), optWs, 
        choice([identifier, keyword('ANY')])
    ]))
]).map(obj => obj.id.value); // Currently, we only need the variable name for the AST

/**
 * Parses the optional parameter list for declarations and definitions.
 * Safely handles omitted parentheses, empty parentheses '()', and populated lists.
 */
const parameterList = optional(sequenceObj([
    optWs, regex(/^\(/), optWs,
    // The actual list of variables inside the parentheses is strictly optional
    capture('args', optional(sequenceOf([
        paramParser,
        many(sequenceOf([optWs, regex(/^,/), optWs, paramParser]).map(arr => arr[3]))
    ]).map(arr => [arr[0], ...arr[1]]))),
    optWs, regex(/^\)/)
]).map(obj => obj.args || [])).map(res => res || []); // Ensure we always return an array, even if no parens exist

/**
 * Parses DECLARE statements used at the top of legacy files.
 * Example: DECLARE SUB InitSnake (length%, speed!)
 */
export const declareStmt = sequenceObj([
    keyword('DECLARE'), ws,
    capture('subType', choice([keyword('SUB'), keyword('FUNCTION')])), ws,
    capture('name', identifier),
    capture('params', parameterList) // Replaced with DRY parser
]).map(obj => ({
    type: 'DECLARE',
    subType: obj.subType, 
    name: obj.name.value,
    params: obj.params
}));

/**
 * Parses SUB definition blocks.
 * Supports static scope declarations and QBasic syntax quirks.
 */
export const subDef = lazy(() => sequenceObj([
    keyword('SUB'), ws, capture('name', identifier),
    capture('params', parameterList), // Replaced with DRY parser
    capture('isStatic', optional(sequenceOf([optWs, keyword('STATIC')]))),
    eos,
    capture('body', block),
    keyword('END'), ws, keyword('SUB')
]).map(obj => ({
    type: 'SUB_DEF',
    name: obj.name.value,
    params: obj.params,
    body: obj.body
})));

/**
 * Parses FUNCTION definition blocks.
 * Supports static scope declarations and QBasic syntax quirks.
 */
export const functionDef = lazy(() => sequenceObj([
    keyword('FUNCTION'), ws, capture('name', identifier),
    capture('params', parameterList), // Replaced with DRY parser
    capture('isStatic', optional(sequenceOf([optWs, keyword('STATIC')]))),
    eos,
    capture('body', block),
    keyword('END'), ws, keyword('FUNCTION')
]).map(obj => ({
    type: 'FUNCTION_DEF',
    name: obj.name.value,
    params: obj.params,
    body: obj.body
})));