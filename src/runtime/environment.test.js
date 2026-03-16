// src/runtime/environment.test.js

import { Environment } from './environment.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for the Environment, Scoping (3-Tier), and Memory allocation systems.
 */
registerSuite('Environment and Scoping (Runtime)', () => {

    test('1. Environment should handle global (Tier 1) and local (Tier 2) scoping', () => {
        const globalEnv = new Environment();
        globalEnv.define('score', 100);

        // Create a sub-scope (simulating entering a standard SUB or FUNCTION)
        const localEnv = new Environment(globalEnv);
        localEnv.define('lives', 3);

        // localEnv should be able to read 'score' from its parent (Tier 1)
        assertEqual(localEnv.lookup('score'), 100, "Local environment must fall back to global scope for reads");
        
        // localEnv can update 'score' globally
        localEnv.assign('score', 200);
        assertEqual(globalEnv.lookup('score'), 200, "Local environment must update existing global variables instead of shadowing");

        // An undefined QBasic variable defaults to 0 and is scoped locally
        assertEqual(localEnv.lookup('new_score'), 0, "Unknown variables must initialize to 0");
        assertEqual(globalEnv.lookup('new_score'), 0, "Global lookup of locally initialized variable should act as unknown (init to 0)");
    });

    test('2. Environment should handle persistent STATIC vaults (Tier 3)', () => {
        const globalEnv = new Environment();
        const persistentVault = new Map();
        
        // Emulate a SUB STATIC call: The local env is bound to a persistent memory map
        const localEnv = new Environment(globalEnv, persistentVault);
        
        // Emulate the first execution of a static variable assignment
        persistentVault.set('CALL_COUNT', 1);
        
        // Assigning to it should update the vault directly, bypassing local and global variables
        localEnv.assign('CALL_COUNT', 2);
        
        assertEqual(persistentVault.get('CALL_COUNT'), 2, "Assignment must strictly update the STATIC vault if the variable exists there");
        assertEqual(localEnv.variables.has('CALL_COUNT'), false, "STATIC variable must NOT leak into the standard local variables map");
        assertEqual(globalEnv.variables.has('CALL_COUNT'), false, "STATIC variable must NOT leak into the global scope");
    });

    test('3. Environment should allocate purist Fixed-Length Strings automatically', () => {
        const env = new Environment();
        
        // 1. Standard dynamic string (DIM A AS STRING)
        const dynamicStr = env.createDefaultValue('STRING');
        assertEqual(dynamicStr, "", "Standard string should initialize as an empty primitive");
        
        // 2. Fixed-Length String (DIM A AS STRING * 5)
        // We pass a mock AST node representing the length
        const fixedStr = env.createDefaultValue('STRING', { value: 5 });
        
        assertEqual(typeof fixedStr, 'object', "Fixed string must be instantiated as a memory block object");
        assertEqual(fixedStr.isFixedString, true, "Fixed string object must bear the fast identification flag");
        assertEqual(fixedStr.toString(), "     ", "Fixed string must auto-pad with spaces upon allocation");
    });

});