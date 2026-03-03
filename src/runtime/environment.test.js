// src/runtime/environment.test.js
import { Environment, QArray } from './environment.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for the Environment and Memory management systems of the Sysclone Runtime.
 */
registerSuite('Environment and Memory (Runtime)', () => {

    test('Environment should handle global and local scoping', () => {
        const globalEnv = new Environment();
        globalEnv.define('score', 100);

        // Create a sub-scope (simulating entering a function or sub)
        const localEnv = new Environment(globalEnv);
        localEnv.define('lives', 3);

        // localEnv should be able to read 'score' from its parent
        assertEqual(localEnv.lookup('score'), 100);
        
        // localEnv can update 'score' globally
        localEnv.assign('score', 200);
        assertEqual(globalEnv.lookup('score'), 200);

        // An undefined QBasic variable defaults to 0
        assertEqual(localEnv.lookup('new_score'), 0);
    });

    test('QArray should handle custom indices and multidimensional mapping', () => {
        // Equivalent to: DIM arena(1 TO 50, 1 TO 80)
        const arenaBounds = [
            { min: 1, max: 50 },
            { min: 1, max: 80 }
        ];
        const arena = new QArray(arenaBounds);

        // Place a value at (row 25, col 40)
        arena.set([25, 40], "SNAKE_HEAD");
        
        assertEqual(arena.get([25, 40]), "SNAKE_HEAD");
        assertEqual(arena.get([1, 1]), 0); // Default initialization value
        
        // Should throw an error if indices are out of bounds
        try {
            arena.get([51, 10]);
            assertEqual(true, false, "Should have thrown an error!");
        } catch (e) {
            // Check if the error message mentions "out of bounds"
            assertEqual(e.message.includes("out of bounds"), true);
        }
    });

});
