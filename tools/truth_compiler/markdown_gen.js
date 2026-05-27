// tools/truth_compiler/markdown_gen.js
import fs from 'fs';
import path from 'path';

/**
 * Formats JSON values into valid strings for the documentation.
 */
function formatValue(val, type) {
    if (type === 'string') return `"${val}"`;
    if (type === 'boolean') return val ? 'true' : 'false';
    if (val === null || type === 'nil') return 'nil';
    return val; 
}

// --- 1. Strategy Pattern (Documentation Metadata) ---
const MARKDOWN_STRATEGIES = {
    qbasic: {
        filename: 'QBASIC_REFERENCE.MD',
        label: 'QBasic',
        codeTag: 'basic'
    },
    pascal: {
        filename: 'PASCAL_REFERENCE.MD',
        label: 'Turbo Pascal',
        codeTag: 'pascal'
    }
};

/**
 * Generates the official Markdown documentation from the Truth Vectors.
 */
export function buildMarkdownDoc(suites, rootDir, target) {
    const strategy = MARKDOWN_STRATEGIES[target];
    if (!strategy) {
        throw new Error(`Unknown markdown strategy for target: ${target}`);
    }

    const OUT_MD = path.resolve(rootDir, `../docs/${strategy.filename}`);
    
    const lines = [
        `# Sysclone ${strategy.label} Compatibility Reference`,
        "",
        `> **Auto-generated** from Truth Vectors. This document serves as the absolute specification for ${strategy.label} behavior.`,
        "",
        "## Alphabetical Index",
        ""
    ];

    // Build the global alphabetical index
    const allVectors = [];
    suites.forEach(suite => {
        suite.vectors.forEach(vec => {
            allVectors.push({ 
                name: vec.name, 
                anchor: vec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
            });
        });
    });
    
    // Sort alphabetically
    allVectors.sort((a, b) => a.name.localeCompare(b.name));
    
    // Generate a compact inline list separated by bullets
    lines.push(allVectors.map(v => `[${v.name}](#${v.anchor})`).join(' • '), "", "---", "", "## Thematic Contents", "");

    // Build the categorized table of contents
    suites.forEach(suite => {
        lines.push(`- **${suite.suite}**`);
        suite.vectors.forEach(vec => {
            lines.push(`  - [${vec.name}](#${vec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})`);
        });
    });
    lines.push("", "---", "");

    // Variables to bypass conversational UI interception of markdown code blocks
    const mdCode = "```" + strategy.codeTag;
    const mdText = "```text";
    const mdClose = "```";

    // Build the core body content
    suites.forEach(suite => {
        lines.push(`## ${suite.suite}`, "");
        
        suite.vectors.forEach(vec => {
            lines.push(`### ${vec.name}`, "");
            
            if (vec.syntax) lines.push(`**Syntax:** \`${vec.syntax}\``, "");
            if (vec.description) lines.push(vec.description, "");
            
            // Restore the example block rendering
            if (vec.example) {
                lines.push(
                    "**Example:**",
                    mdCode,
                    ...vec.example.code,
                    mdClose,
                    "**Output:**",
                    mdText,
                    vec.example.output,
                    mdClose,
                    ""
                );
            }
            
            if (vec.quirks_and_tests) {
                lines.push("#### Hardware Quirks & Edge Cases", "");
                
                // Restore the pedagogical description of quirks
                if (vec.quirks_and_tests.description) {
                    lines.push(vec.quirks_and_tests.description, "");
                }
                
                lines.push(
                    mdCode, 
                    ...vec.quirks_and_tests.setup, 
                    mdClose, 
                    "**Memory State (End of Execution):**", 
                    mdText
                );
                
                // Dynamic alignment for clean variable display
                const maxVarLen = Math.max(...vec.quirks_and_tests.assertions.map(a => a.var.length));
                
                vec.quirks_and_tests.assertions.forEach(assert => {
                    const expected = formatValue(assert.val, assert.type);
                    const paddedVar = assert.var.padEnd(maxVarLen, ' ');
                    lines.push(`${paddedVar} = ${String(expected).padEnd(12, ' ')} (${assert.type})`);
                });
                
                lines.push(mdClose, "");
            }
            lines.push("---", "");
        });
    });

    // Ensure the docs directory exists before writing
    const dir = path.dirname(OUT_MD);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Write file, trim trailing newlines and guarantee a clean EOF
    fs.writeFileSync(OUT_MD, lines.join('\n').trim() + '\n', 'utf8');
}