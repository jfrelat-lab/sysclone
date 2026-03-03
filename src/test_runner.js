// src/test_runner.js

/**
 * Global registry for test suites.
 * Allows anonymous imports to register tests automatically.
 */
const registry = [];

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
 * Registers a suite in the global registry for organized execution.
 * Replaces the old runSuite to allow for generic automated imports.
 */
export function registerSuite(suiteName, tests) {
    registry.push({ name: suiteName, testFn: tests });
}

/**
 * Orchestrates the execution of all registered suites.
 * Logs the start of the quality harness to the console.
 */
export function runAllTests() {
    console.log("🚀 Starting Sysclone Quality Harness...");
    registry.forEach(suite => {
        console.group(`🧪 Test Suite: ${suite.name}`);
        suite.testFn();
        console.groupEnd();
    });
}