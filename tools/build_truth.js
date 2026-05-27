// tools/build_truth.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the decoupled generator functions
import { buildQBasic, buildJSTests as buildQBasicJSTests } from './truth_compiler/qbasic_target.js';
import { buildPascal } from './truth_compiler/pascal_target.js';
import { buildMarkdownDoc } from './truth_compiler/markdown_gen.js';

// --- 1. Configuration & Path Resolution ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const targetArg = args.find(arg => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1].toLowerCase() : 'qbasic';

const VECTORS_DIR = path.resolve(__dirname, `../tests/truth_vectors/${target}`);

// --- 2. Strategy Pattern (Compilers) ---
// Maps each language target to its specific ROM and JS Test generators.
const compilers = {
    qbasic: (suites, baseDir) => {
        buildQBasic(suites, baseDir);
        buildQBasicJSTests(suites, baseDir);
    },
    pascal: (suites, baseDir) => {
        buildPascal(suites, baseDir);
        // Note: Pascal JS tests are currently stubbed inside buildPascal directly.
        // Once the Pascal evaluator is ready, we will extract it here to match the pattern.
    }
};

// --- 3. Orchestration ---
try {
    console.log(`🚀 Starting Truth Vector Compiler for target: [${target.toUpperCase()}]`);

    // Validate Strategy
    if (!compilers[target]) {
        throw new Error(`Unknown target: ${target}. Valid targets: ${Object.keys(compilers).join(', ')}`);
    }
    
    // Ensure the vectors directory exists
    if (!fs.existsSync(VECTORS_DIR)) {
        throw new Error(`Vector directory not found: ${VECTORS_DIR}. Please create it and add JSON files.`);
    }
    
    // Load and parse all JSON suites for the requested target
    const files = fs.readdirSync(VECTORS_DIR).filter(f => f.endsWith('.json'));
    const suites = files.map(f => JSON.parse(fs.readFileSync(path.join(VECTORS_DIR, f), 'utf8')));
    
    if (suites.length === 0) {
        console.log(`⚠️ No JSON truth vectors found in ${VECTORS_DIR}`);
        process.exit(0);
    }

    // Execute the specific compilation strategy
    compilers[target](suites, __dirname);

    // Build the shared Markdown documentation (Universal post-compilation step)
    buildMarkdownDoc(suites, __dirname, target);

    console.log(`✅ Build completed successfully for ${target.toUpperCase()}!`);

} catch (error) {
    console.error(`❌ Build Error: ${error.message}`);
    process.exit(1);
}