// src/runtime/types.test.js

import { QFixedString } from './qfixedstring.js';
import { QArray } from './qarray.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

registerSuite('Virtual Memory Types (QArray & QFixedString)', () => {

    test('1. QFixedString should auto-pad with spaces upon creation and update', () => {
        const fixedStr = new QFixedString(10);
        
        // Initial state: Must be exactly 10 spaces
        assertEqual(fixedStr.toString(), "          ", "Should initialize with exactly 10 spaces");
        
        // Assignment shorter than length
        fixedStr.update("HELLO");
        assertEqual(fixedStr.toString(), "HELLO     ", "Should auto-pad right with spaces to act as a visual eraser");
        
        // JS Coercion check (Duck typing compatibility)
        assertEqual(fixedStr + "WORLD", "HELLO     WORLD", "Should concatenate naturally with standard JS strings");
    });

    test('2. QFixedString should truncate overflow strictly', () => {
        const fixedStr = new QFixedString(5);
        
        // Attempt to overflow the fixed memory block
        fixedStr.update("123456789");
        assertEqual(fixedStr.toString(), "12345", "Should strictly truncate string to length 5");
    });

    test('3. QArray should flatten 1D and 2D bounds correctly', () => {
        // 1D Array: DIM arr(5 TO 10) -> Size = 6
        const arr1D = new QArray([{ min: 5, max: 10 }]);
        arr1D.set([5], "First");
        arr1D.set([10], "Last");
        
        assertEqual(arr1D.get([5]), "First", "1D Array lower bound must index correctly");
        assertEqual(arr1D.get([10]), "Last", "1D Array upper bound must index correctly");
        
        // 2D Array: DIM arr(1 TO 2, 0 TO 1) -> Size = 4
        const arr2D = new QArray([{ min: 1, max: 2 }, { min: 0, max: 1 }]);
        arr2D.set([2, 1], "Matrix");
        assertEqual(arr2D.get([2, 1]), "Matrix", "2D Array multi-indexing must resolve to correct flat index");
    });

    test('4. QArray should execute smart in-place assignment for QFixedStrings', () => {
        // Create an array that initializes slots with a Fixed String of length 4
        // Emulates: DIM stringArray(1 TO 3) AS STRING * 4
        const stringArray = new QArray([{ min: 1, max: 3 }], () => new QFixedString(4));
        
        // Grab the actual memory reference of slot 2 BEFORE assignment
        const memoryRef = stringArray.get([2]);
        
        // Assign a new value through the standard array interface
        stringArray.set([2], "HI");
        
        // 1. Check if the fixed string logic (padding) triggered inside the array
        assertEqual(stringArray.get([2]).toString(), "HI  ", "Array setter should trigger FixedString padding update");
        
        // 2. Check if the memory reference is identical (In-place update success!)
        const newMemoryRef = stringArray.get([2]);
        assertEqual(memoryRef === newMemoryRef, true, "Array MUST update fixed strings IN-PLACE without destroying the V8 object reference");
    });
});