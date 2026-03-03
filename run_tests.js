// run_tests.js
import { runAllTests } from './src/test_runner.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Sysclone Test Orchestrator
 * Automatically discovers and executes all .test.js files within the src directory.
 */

/**
 * Recursively scans a directory for test files and imports them.
 * This triggers the auto-registration mechanism in the test runner.
 * * @param {string} dir - The starting directory for the scan.
 */
async function discoverAndImportTests(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            // Recursive call for subdirectories
            await discoverAndImportTests(fullPath);
        } else if (entry.name.endsWith('.test.js')) {
            // Convert system path to File URL for ES Module compatibility
            // This ensures cross-platform support (Windows/macOS/Linux)
            const fileURL = pathToFileURL(fullPath).href;
            await import(fileURL);
        }
    }
}

async function main() {
    try {
        // 1. Scan the src directory for all test suites
        // This eliminates the need for manual imports in this file.
        await discoverAndImportTests('./src');

        // 2. Execute the global registry once all suites are loaded
        runAllTests();
    } catch (error) {
        console.error("❌ Failed to orchestrate tests:", error.message);
        process.exit(1);
    }
}

// Execute the test harness
main();