// tests/orchestrator.js
import { runAllTests } from '../src/test_runner.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

/**
 * Sysclone Test Orchestrator
 * Automatically discovers and executes all .test.js files within the src directory.
 * Supports optional substring filtering via CLI argument.
 */

// --- Absolute Path Resolution ---
// Ensures the script works perfectly regardless of the user's terminal CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

const FILTER = process.argv[2] ? process.argv[2].toLowerCase() : '';

/**
 * Recursively scans a directory for test files and imports them.
 * This triggers the auto-registration mechanism in the test runner.
 * @param {string} dir - The starting directory for the scan.
 */
async function discoverAndImportTests(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            // Recursive call for subdirectories
            await discoverAndImportTests(fullPath);
        } else if (entry.name.endsWith('.test.js')) {
            if (FILTER && !fullPath.toLowerCase().includes(FILTER)) {
                continue;
            }

            const fileURL = pathToFileURL(fullPath).href;
            
            try {
                // The V8 Engine compiles and evaluates the file here
                await import(fileURL);
            } catch (error) {
                console.error(`\n❌ [FATAL PARSE ERROR] Cannot load test suite: ${entry.name}`);
                
                // --- SMART SYNTAX & IMPORT ERROR DETECTOR ---
                if (error instanceof SyntaxError) {
                    console.error(`   ⚠️  Syntax Error! (Missing backticks \` \`, unclosed brackets, etc.)`);
                    console.error(`   📝 Message: ${error.message}`);
                } else {
                    console.error(`   💥 V8 Reference/Import Error: ${error.message}`);
                }
                
                // Expose the raw stack trace to immediately pinpoint the file and line number
                console.error(`\n📍 Stack Trace:\n${error.stack}`);
                
                // Hard exit: Stop the orchestrator, don't pretend everything is fine
                process.exit(1);
            }
        }
    }
}

async function main() {
    try {
        console.log(`🔍 Scanning for test suites in: ${SRC_DIR}${FILTER ? ` (Filter: '${FILTER}')` : ''}`);
        
        // 1. Scan the src directory for all test suites using the absolute path
        await discoverAndImportTests(SRC_DIR);

        // 2. Execute the global registry once all suites are loaded
        runAllTests();
    } catch (error) {
        console.error("❌ Failed to orchestrate tests:", error.message);
        process.exit(1);
    }
}

// Execute the test harness
main();