// src/test_runner.js

/**
 * Global registry for test suites.
 */
const registry = [];

/**
 * Internal state tracking for Test KPIs.
 */
const stats = {
    total: 0,
    passed: 0,
    failed: 0
};

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
 * Tracks execution time and updates global KPI metrics.
 */
export function test(description, testFunction) {
    stats.total++;
    // Fallback to Date.now() if performance.now is unavailable in older Node environments
    const now = typeof performance !== 'undefined' ? performance.now.bind(performance) : Date.now;
    const start = now();
    
    try {
        testFunction();
        const duration = (now() - start).toFixed(2);
        // Stripped the %c CSS hacks to ensure clean output in both Browser console and Node.js terminals
        console.log(`✅ [PASS] ${description} (${duration}ms)`);
        stats.passed++;
    } catch (error) {
        console.error(`❌ [FAIL] ${description}\n   ${error.message}`);
        stats.failed++;
    }
}

/**
 * Registers a suite in the global registry for organized execution.
 */
export function registerSuite(suiteName, tests) {
    registry.push({ name: suiteName, testFn: tests });
}

/**
 * Orchestrates the execution of all registered suites.
 * Outputs a professional KPI summary report at the end of the run.
 */
export function runAllTests() {
    console.log("🚀 Starting Sysclone Quality Harness...\n");
    
    // Reset stats for multiple runs (e.g., watch mode)
    stats.total = 0;
    stats.passed = 0;
    stats.failed = 0;
    
    const now = typeof performance !== 'undefined' ? performance.now.bind(performance) : Date.now;
    const globalStart = now();

    // Execute all suites
    registry.forEach(suite => {
        // Fallback for Node.js if console.group is not fully supported
        if (console.group) console.group(`\n🧪 Test Suite: ${suite.name}`);
        else console.log(`\n--- 🧪 Test Suite: ${suite.name} ---`);
        
        suite.testFn();
        
        if (console.groupEnd) console.groupEnd();
    });

    const globalDuration = (now() - globalStart).toFixed(2);
    const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;

    // --- KPI SUMMARY BLOCK ---
    console.log("\n=======================================");
    console.log("📊 SYSCLONE TEST EXECUTION SUMMARY");
    console.log("=======================================");
    console.log(`⏱️  Time:       ${globalDuration} ms`);
    console.log(`🎯 Rate:       ${successRate}%`);
    console.log(`🧪 Total:      ${stats.total}`);
    console.log(`✅ Passed:     ${stats.passed}`);
    console.log(`❌ Failed:     ${stats.failed}`);
    console.log("=======================================");

    if (stats.failed > 0) {
        console.error("⚠️  Some tests failed. Please review the logs above.");
        // If running in a pure Node CLI environment, this ensures CI/CD pipelines fail correctly
        if (typeof process !== 'undefined' && process.exit) {
            process.exitCode = 1;
        }
    } else {
        console.log("🎉 All tests passed successfully!");
    }
}