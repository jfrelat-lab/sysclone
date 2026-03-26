// tools/truth_compiler/pascal_target.js
import fs from 'fs';
import path from 'path';

/**
 * Formats JSON values into valid Pascal literals.
 */
function formatValue(val, type) {
    if (type === 'string') return `'${val}'`; // Turbo Pascal uses single quotes for strings
    return val; 
}

/**
 * Builds Turbo Pascal specific Truth Vectors.
 * Generates a complete .pas file to be compiled by TPC.EXE in DOSBox.
 */
export function buildPascal(suites, rootDir) {
    const OUT_PAS = path.resolve(rootDir, '../examples/compat.pas');
    
    // 1. Gather all variables to declare them dynamically in the VAR block
    const longintVars = new Set();
    const integerVars = new Set(); 
    const realVars = new Set();
    const stringVars = new Set();

    suites.forEach(suite => {
        suite.vectors.forEach(vec => {
            if (vec.quirks_and_tests) {
                vec.quirks_and_tests.assertions.forEach(assert => {
                    // Type Routing
                    if (assert.type === 'string') {
                        stringVars.add(assert.var);
                    } else if (assert.type === 'float' || (assert.type === 'number' && assert.val.toString().includes('.'))) {
                        realVars.add(assert.var);
                    } else if (assert.type === 'integer') {
                        // Catch explicit 16-bit integers
                        integerVars.add(assert.var);
                    } else {
                        // Default fallback for numbers without decimals (32-bit integer)
                        longintVars.add(assert.var);
                    }
                });
            }
        });
    });

    /**
     * Helper function to safely wrap variable declarations to avoid 
     * the MS-DOS Turbo Pascal 126-character line limit.
     */
    function getVarDeclarationLines(varSet, typeName) {
        if (varSet.size === 0) return [];
        const vars = Array.from(varSet);
        const declarationLines = [];
        let currentLine = "  ";
        
        for (let i = 0; i < vars.length; i++) {
            // If adding the next variable exceeds 100 characters, close the current line
            if (currentLine.length + vars[i].length + 10 > 100) {
                declarationLines.push(`${currentLine}: ${typeName};`);
                currentLine = `  ${vars[i]}`;
            } else {
                if (currentLine === "  ") currentLine += vars[i];
                else currentLine += `, ${vars[i]}`;
            }
        }
        // Push any remaining variables in the buffer
        if (currentLine !== "  ") {
            declarationLines.push(`${currentLine}: ${typeName};`);
        }
        return declarationLines;
    }

    const lines = [
        "{ ============================================================================== }",
        "{ SYSCLONE COMPATIBILITY HARNESS (Auto-Generated)                                }",
        "{ Runs silently. Only prints failures and the final score.                       }",
        "{ ============================================================================== }",
        "PROGRAM SyscloneCompat;",
        "USES Crt;",
        "",
        "VAR",
        "  TotalTests, PassedTests, FailedTests: Integer;"
    ];

    // 2. Write Variable Declarations cleanly with chunking
    lines.push(...getVarDeclarationLines(integerVars, 'Integer'));
    lines.push(...getVarDeclarationLines(longintVars, 'Longint'));
    lines.push(...getVarDeclarationLines(realVars, 'Real'));
    lines.push(...getVarDeclarationLines(stringVars, 'String'));

    lines.push(
        "",
        "BEGIN",
        "  ClrScr;",
        "  TotalTests := 0;",
        "  PassedTests := 0;",
        "  FailedTests := 0;",
        "  WriteLn('Running Sysclone Truth Vectors...');",
        "  WriteLn('---------------------------------');"
    );

    // 3. Generate the logic
    suites.forEach(suite => {
        lines.push("", `  { --- SUITE: ${suite.suite} --- }`);
        
        suite.vectors.forEach(vec => {
            if (!vec.quirks_and_tests) return;

            lines.push("", `  { Vector: ${vec.name} }`);
            
            // Add indentation to setup lines
            vec.quirks_and_tests.setup.forEach(line => {
                lines.push(`  ${line}`);
            });

            vec.quirks_and_tests.assertions.forEach(assert => {
                let expected = formatValue(assert.val, assert.type);
                const isReal = realVars.has(assert.var);
                
                // CRITICAL: Force the expected value to become a floating literal
                // for Pascal if it lacks a decimal point (e.g., transform "2" into "2.0")
                if (isReal && !String(expected).includes('.')) {
                    expected = `${expected}.0`;
                }
                
                // Real number equality check in Pascal needs a small epsilon due to IEEE 754 precision limitations
                const condition = isReal 
                    ? `Abs(${assert.var} - ${expected}) < 0.0001`
                    : `${assert.var} = ${expected}`;

                // Pascal formatting for WriteLn floats: Variable:Width:Decimals
                const printVar = isReal ? `${assert.var}:0:2` : assert.var;
                const printExpected = isReal ? `${expected}:0:2` : expected;

                lines.push(
                    `  Inc(TotalTests);`,
                    `  IF ${condition} THEN`,
                    `    Inc(PassedTests)`,
                    `  ELSE BEGIN`,
                    `    Inc(FailedTests);`,
                    `    WriteLn('FAIL: [${vec.name}] ${assert.var} expected ', ${printExpected}, ' but got ', ${printVar});`,
                    `  END;`
                );
            });
        });
    });

    lines.push(
        "",
        "  { --- FINAL REPORT --- }",
        "  WriteLn('---------------------------------');",
        "  IF FailedTests = 0 THEN TextColor(LightGreen) ELSE TextColor(LightRed);",
        "  WriteLn('PASSED: ', PassedTests, ' / ', TotalTests);",
        "  TextColor(LightGray);",
        "  WriteLn;",
        "  WriteLn('Press ENTER to exit DOSBox...');",
        "  ReadLn;",
        "END."
    );

    // Write the visual target file
    fs.writeFileSync(OUT_PAS, lines.join('\n'), 'utf8');
    
    // Build JS Unit Tests (Stubbed until runtime implementation)
    buildJSTests(suites, rootDir);
}

/**
 * Builds the JavaScript Unit Tests for the Sysclone Evaluator (Pascal Runtime).
 */
export function buildJSTests(suites, rootDir) {
    const OUT_JS = path.resolve(rootDir, '../src/runtime/pascal/compatibility.test.js');
    const relativeJSPath = path.relative(path.resolve(rootDir, '..'), OUT_JS).replace(/\\/g, '/');

    const lines = [
        `// ${relativeJSPath}`,
        "// ==============================================================================",
        "// AUTO-GENERATED BY tools/build_truth.js - DO NOT EDIT MANUALLY",
        "// ==============================================================================",
        "// Note: Imports and test runner logic will be activated when Pascal runtime is ready.",
        "/*",
        "import { PascalEnvironment } from './pascal_environment.js';",
        "import { pascalProgram } from '../../parser/pascal/program.js';",
        "import { test, assertEqual, registerSuite } from '../../test_runner.js';",
        "*/"
    ];

    lines.push("", "/*");
    suites.forEach(suite => {
        lines.push(`// registerSuite('Pascal Truth Vector: ${suite.suite}', () => {`);
        suite.vectors.forEach(vec => {
            if (!vec.quirks_and_tests) return;
            const safeName = vec.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
            lines.push(`//     test('${safeName}', () => { ... });`);
        });
        lines.push("// });");
    });
    lines.push("*/");

    const dir = path.dirname(OUT_JS);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUT_JS, lines.join('\n') + '\n', 'utf8');
}