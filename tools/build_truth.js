// tools/build_truth.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the decoupled generator functions
import { buildQBasic, buildJSTests } from './truth_compiler/qbasic_target.js';
import { buildPascal } from './truth_compiler/pascal_target.js';
import { buildMarkdownDoc } from './truth_compiler/markdown_gen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI Argument parsing (Default to qbasic if no target is specified)
const args = process.argv.slice(2);
const targetArg = args.find(arg => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1].toLowerCase() : 'qbasic';

// Dynamic path based on the selected target language
const VECTORS_DIR = path.resolve(__dirname, `../tests/truth_vectors/${target}`);

try {
    console.log(`🚀 Starting Truth Vector Compiler for target: [${target.toUpperCase()}]`);
    
    if (!fs.existsSync(VECTORS_DIR)) {
        throw new Error(`Vector directory not found: ${VECTORS_DIR}. Please create it and add JSON files.`);
    }
    
    // Load and parse all JSON suites for the target
    const files = fs.readdirSync(VECTORS_DIR).filter(f => f.endsWith('.json'));
    const suites = files.map(f => JSON.parse(fs.readFileSync(path.join(VECTORS_DIR, f), 'utf8')));
    
    if (suites.length === 0) {
        console.log(`⚠️ No JSON truth vectors found in ${VECTORS_DIR}`);
        process.exit(0);
    }

    // Route the data to the appropriate language generator
    if (target === 'qbasic') {
        buildQBasic(suites, __dirname);
        buildJSTests(suites, __dirname);
    } else if (target === 'pascal') {
        buildPascal(suites, __dirname);
    } else {
        throw new Error(`Unknown target: ${target}. Use --target=qbasic or --target=pascal`);
    }

    // Build the shared Markdown documentation
    buildMarkdownDoc(suites, __dirname, target);

    console.log(`✅ Build completed successfully for ${target.toUpperCase()}!`);

} catch (error) {
    console.error(`❌ Build Error: ${error.message}`);
    process.exit(1);
}