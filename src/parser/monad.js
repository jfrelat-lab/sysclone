// src/parser/monad.js

/**
 * Represents the current state of the parsing process.
 */
export class ParserState {
    constructor(targetString, index = 0) {
        this.targetString = targetString;
        this.index = index;
    }
}

/**
 * The Parser Monad.
 * Encapsulates a function that transforms a ParserState into a new result.
 */
export class Parser {
    constructor(parserStateTransformer) {
        this.parserStateTransformer = parserStateTransformer;
    }

    run(targetString) {
        return this.parserStateTransformer(new ParserState(targetString));
    }

    /**
     * Transforms the encapsulated result if the parser succeeds.
     */
    map(fn) {
        return new Parser(state => {
            const nextState = this.parserStateTransformer(state);
            if (nextState.isError) return nextState;
            return { ...nextState, result: fn(nextState.result) };
        });
    }

    /**
     * Monadic "bind": chains parsers based on the result of the previous one.
     */
    chain(fn) {
        return new Parser(state => {
            const nextState = this.parserStateTransformer(state);
            if (nextState.isError) return nextState;
            const nextParser = fn(nextState.result);
            return nextParser.parserStateTransformer(nextState);
        });
    }
}

// --- CORE COMBINATORS ---

/**
 * Parses an exact string match.
 */
export const str = (matchStr) => new Parser(state => {
    const { targetString, index } = state;
    if (targetString.startsWith(matchStr, index)) {
        return { targetString, index: index + matchStr.length, result: matchStr, isError: false };
    }
    return { ...state, isError: true, error: `Expected: '${matchStr}' at index ${index}` };
});

/**
 * Parses an exact sequence of parsers (e.g., A then B then C).
 */
export const sequenceOf = (parsers) => new Parser(state => {
    let currentState = state;
    const results = [];
    for (let p of parsers) {
        currentState = p.parserStateTransformer(currentState);
        if (currentState.isError) return currentState;
        results.push(currentState.result);
    }
    return { ...currentState, result: results, isError: false };
});

/**
 * Tries several parsers and returns the first one that succeeds (Logical OR).
 */
export const choice = (parsers) => new Parser(state => {
    if (parsers.length === 0) return { ...state, isError: true, error: "Empty choice" };
    for (let p of parsers) {
        const nextState = p.parserStateTransformer(state);
        if (!nextState.isError) return nextState;
    }
    return { ...state, isError: true, error: `No valid choice at index ${state.index}` };
});

/**
 * Parses a parser zero or more times (Loop).
 */
export const many = (parser) => new Parser(state => {
    let currentState = state;
    const results = [];
    while (true) {
        const nextState = parser.parserStateTransformer(currentState);
        if (nextState.isError) break;
        currentState = nextState;
        results.push(currentState.result);
    }
    return { ...currentState, result: results, isError: false };
});

/**
 * Parses a parser at least once.
 */
export const manyOne = (parser) => new Parser(state => {
    const firstState = parser.parserStateTransformer(state);
    if (firstState.isError) return firstState;
    
    let currentState = firstState;
    const results = [currentState.result];
    
    while (true) {
        const nextState = parser.parserStateTransformer(currentState);
        if (nextState.isError) break;
        currentState = nextState;
        results.push(currentState.result);
    }
    return { ...currentState, result: results, isError: false };
});

/**
 * Parses using a regular expression.
 */
export const regex = (re) => new Parser(state => {
    const { targetString, index } = state;
    const rest = targetString.slice(index);
    const match = rest.match(re);
    
    if (match && match.index === 0) {
        return { 
            ...state, 
            index: index + match[0].length, 
            result: match[0], 
            isError: false 
        };
    }
    return { ...state, isError: true, error: `Lexical error at index ${index}` };
});

/**
 * Tries a parser; if it fails, succeeds anyway with a null result (Optional).
 */
export const optional = (parser) => new Parser(state => {
    const nextState = parser.parserStateTransformer(state);
    if (nextState.isError) {
        return { ...state, result: null, isError: false };
    }
    return nextState;
});

/**
 * Wraps a parser's result to tag it with a key.
 */
export const capture = (key, parser) => parser.map(result => ({ 
    _isCapture: true, 
    key, 
    result 
}));

/**
 * Similar to sequenceOf, but returns an object containing only 
 * results from parsers wrapped in capture().
 */
export const sequenceObj = (parsers) => new Parser(state => {
    let currentState = state;
    const finalObject = {};
    
    for (let p of parsers) {
        currentState = p.parserStateTransformer(currentState);
        if (currentState.isError) return currentState;
        
        const res = currentState.result;
        if (res && typeof res === 'object' && res._isCapture) {
            finalObject[res.key] = res.result;
        }
    }
    
    return { ...currentState, result: finalObject, isError: false };
});

/**
 * Allows defining recursive parsers by wrapping them in a thunk.
 */
export const lazy = (parserThunk) => new Parser(state => parserThunk().parserStateTransformer(state));

/**
 * Parses zero or more elements separated by a specific separator.
 */
export const sepBy = (parser, separator) => new Parser(state => {
    const results = [];
    let currentState = parser.parserStateTransformer(state);
    
    if (currentState.isError) return { ...state, result: [], isError: false };
    
    results.push(currentState.result);

    while (true) {
        const sepState = separator.parserStateTransformer(currentState);
        if (sepState.isError) break;
        
        const nextState = parser.parserStateTransformer(sepState);
        if (nextState.isError) break; 
        
        currentState = nextState;
        results.push(currentState.result);
    }
    
    return { ...currentState, result: results, isError: false };
});

/**
 * Parses: Element (Operator Element)* and associates them from the left.
 * Crucial for mathematical operator precedence.
 */
export const chainLeft = (elementParser, operatorParser, reducer) => new Parser(state => {
    let currentState = elementParser.parserStateTransformer(state);
    if (currentState.isError) return currentState;

    let leftValue = currentState.result;

    while (true) {
        const opState = operatorParser.parserStateTransformer(currentState);
        if (opState.isError) break;

        const rightState = elementParser.parserStateTransformer(opState);
        if (rightState.isError) return rightState; 

        currentState = rightState;
        leftValue = reducer(leftValue, opState.result, rightState.result);
    }

    return { ...currentState, result: leftValue, isError: false };
});

/**
 * Creates an optimized, order-independent parser from an array of strings.
 * Enforces whole-word matching (negative lookahead) to prevent partial matches 
 * (e.g., matching 'PRINT' inside 'PRINTER').
 * @param {Array<string>} words - The list of exact words to match.
 * @returns {Parser} A regex-based monadic parser.
 */
export const wordChoice = (words) => {
    // 1. Sort by descending length to prevent short words from shadowing longer ones
    // (e.g., 'ELSEIF' must be checked before 'ELSE').
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    
    // 2. Escape standard regex control characters
    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedWords = sortedWords.map(escapeRegExp);
    
    // 3. Build the highly optimized regular expression
    const regexString = `^(?:${escapedWords.join('|')})(?![a-zA-Z0-9_])`;
    
    // 4. Return our existing regex monadic parser
    return regex(new RegExp(regexString, 'i'));
};

/**
 * Matches exactly one character of any kind (including newlines).
 * Acts as an ultimate fallback in parser combinators to prevent infinite loops 
 * when encountering illegal or unexpected characters.
 */
export const anyChar = regex(/^[\s\S]/);