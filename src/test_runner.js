// src/test_runner.js

/**
 * Basic assertion utility for the Sysclone test suite.
 * Compares values using JSON serialization for deep comparison of objects and arrays.
 */
export function assertEqual(actual, expected, message = "Assertion failed") {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    
    if (actualStr !== expectedStr) {
        throw new Error(`${message}\n   Expected : ${expectedStr}\n   Actual   : ${actualStr}`);
    }
}

/**
 * Defines and executes a single test case.
 * Logs the result with color-coded status in the console.
 */
export function test(description, testFunction) {
    try {
        testFunction();
        console.log(`✅ %c[PASS]%c ${description}`, 'color: green; font-weight: bold;', 'color: inherit;');
    } catch (error) {
        console.error(`❌ %c[FAIL]%c ${description}\n   ${error.message}`, 'color: red; font-weight: bold;', 'color: inherit;');
    }
}

/**
 * Groups multiple tests into a named suite for organized console output.
 */
export function runSuite(suiteName, tests) {
    console.group(`🧪 Test Suite: ${suiteName}`);
    tests();
    console.groupEnd();
}