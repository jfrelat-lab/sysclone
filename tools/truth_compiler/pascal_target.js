// tools/truth_compiler/pascal_target.js
import fs from 'fs';
import path from 'path';

/**
 * Formats JSON values into valid Pascal literals.
 */
function formatValue(val, type) {
    if (type === 'string' || type === 'char') return `'${val}'`;
    if (type === 'boolean') return val ? 'True' : 'False';
    return val; 
}

/**
 * Builds Turbo Pascal specific Truth Vectors.
 * Generates a complete .pas file to be compiled by TPC.EXE in DOSBox.
 */
export function buildPascal(suites, rootDir) {
    const OUT_PAS = path.resolve(rootDir, '../examples/compat.pas');
    
    // 1. Gather variables and track used types to inject only necessary Assert procedures
    const varMaps = {
        'Longint': new Set(),
        'Integer': new Set(),
        'Real': new Set(),
        'String': new Set(),
        'Char': new Set(),
        'Boolean': new Set()
    };
    const customTypeVars = new Map();
    const globalDeclarations = [];
    const usedAsserts = new Set(); // Tracks which Assert methods are actually needed

    suites.forEach(suite => {
        suite.vectors.forEach(vec => {
            if (vec.quirks_and_tests) {
                if (vec.quirks_and_tests.declarations) {
                    globalDeclarations.push(...vec.quirks_and_tests.declarations);
                }
                vec.quirks_and_tests.assertions.forEach(assert => {
                    if (assert.type === 'string') {
                        varMaps['String'].add(assert.var);
                        usedAsserts.add('Str');
                    } else if (assert.type === 'char') {
                        varMaps['Char'].add(assert.var);
                        usedAsserts.add('Str'); // Char can be implicitly cast to string in our assert
                    } else if (assert.type === 'boolean') {
                        varMaps['Boolean'].add(assert.var);
                        usedAsserts.add('Bool');
                    } else if (assert.type.startsWith('^')) {
                        if (!customTypeVars.has(assert.type)) customTypeVars.set(assert.type, new Set());
                        customTypeVars.get(assert.type).add(assert.var);
                        usedAsserts.add('Ptr');
                    } else if (assert.type === 'float' || (assert.type === 'number' && assert.val.toString().includes('.'))) {
                        varMaps['Real'].add(assert.var);
                        usedAsserts.add('Real');
                    } else if (assert.type === 'integer') {
                        varMaps['Integer'].add(assert.var);
                        usedAsserts.add('Int');
                    } else {
                        varMaps['Longint'].add(assert.var);
                        usedAsserts.add('Int');
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

    // 2. Write Variable Declarations
    for (const [typeName, varSet] of Object.entries(varMaps)) {
        lines.push(...getVarDeclarationLines(varSet, typeName));
    }
    for (const [customType, varSet] of customTypeVars.entries()) {
        lines.push(...getVarDeclarationLines(varSet, customType));
    }

    // 3. Inject Global Declarations (from Truth Vectors)
    if (globalDeclarations.length > 0) {
        lines.push('');
        lines.push(...globalDeclarations);
    }

    // 4. Inject "SyscloneUnit" Test Framework Procedures
    lines.push('', '{ --- SYSCLONE TEST FRAMEWORK --- }');
    
    if (usedAsserts.has('Int')) {
        lines.push(
            "PROCEDURE AssertInt(TestName: String; Expected, Actual: Longint);",
            "BEGIN",
            "  Inc(TotalTests);",
            "  IF Expected = Actual THEN Inc(PassedTests)",
            "  ELSE BEGIN",
            "    Inc(FailedTests);",
            "    WriteLn('FAIL: [', TestName, '] expected ', Expected, ' but got ', Actual);",
            "  END;",
            "END;"
        );
    }
    if (usedAsserts.has('Real')) {
        lines.push(
            "PROCEDURE AssertReal(TestName: String; Expected, Actual: Real);",
            "BEGIN",
            "  Inc(TotalTests);",
            "  IF Abs(Expected - Actual) < 0.0001 THEN Inc(PassedTests)",
            "  ELSE BEGIN",
            "    Inc(FailedTests);",
            "    WriteLn('FAIL: [', TestName, '] expected ', Expected:0:2, ' but got ', Actual:0:2);",
            "  END;",
            "END;"
        );
    }
    if (usedAsserts.has('Str')) {
        lines.push(
            "PROCEDURE AssertStr(TestName: String; Expected, Actual: String);",
            "BEGIN",
            "  Inc(TotalTests);",
            "  IF Expected = Actual THEN Inc(PassedTests)",
            "  ELSE BEGIN",
            "    Inc(FailedTests);",
            "    WriteLn('FAIL: [', TestName, '] expected ''', Expected, ''' but got ''', Actual, '''');",
            "  END;",
            "END;"
        );
    }
    if (usedAsserts.has('Bool')) {
        lines.push(
            "PROCEDURE AssertBool(TestName: String; Expected, Actual: Boolean);",
            "BEGIN",
            "  Inc(TotalTests);",
            "  IF Expected = Actual THEN Inc(PassedTests)",
            "  ELSE BEGIN",
            "    Inc(FailedTests);",
            "    Write('FAIL: [', TestName, '] expected ');",
            "    IF Expected THEN Write('True') ELSE Write('False');",
            "    Write(' but got ');",
            "    IF Actual THEN WriteLn('True') ELSE WriteLn('False');",
            "  END;",
            "END;"
        );
    }
    if (usedAsserts.has('Ptr')) {
        lines.push(
            "PROCEDURE AssertPtr(TestName: String; Expected, Actual: Pointer);",
            "BEGIN",
            "  Inc(TotalTests);",
            "  IF Expected = Actual THEN Inc(PassedTests)",
            "  ELSE BEGIN",
            "    Inc(FailedTests);",
            "    WriteLn('FAIL: [', TestName, '] expected ', Longint(Expected), ' but got ', Longint(Actual));",
            "  END;",
            "END;"
        );
    }

    // 5. Main Program Body
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

    // 6. Generate the logic execution and assert calls
    suites.forEach(suite => {
        lines.push("", `  { --- SUITE: ${suite.suite} --- }`);
        
        suite.vectors.forEach(vec => {
            if (!vec.quirks_and_tests) return;

            lines.push(`  { Vector: ${vec.name} }`);
            
            // Add indentation to setup lines
            vec.quirks_and_tests.setup.forEach(line => {
                lines.push(`  ${line}`);
            });

            vec.quirks_and_tests.assertions.forEach(assert => {
                let expected = formatValue(assert.val, assert.type);
                const isReal = varMaps['Real'].has(assert.var);
                const isPointer = assert.type.startsWith('^');
                
                if (isReal && !String(expected).includes('.')) expected = `${expected}.0`;
                
                // Determine which Assert procedure to call based on type
                let assertCall = "";

                // Format the test name to avoid MS-DOS 126 char limit
                let safeName = vec.name.replace(/'/g, "''");
                if (safeName.length > 60) {
                    safeName = safeName.substring(0, 57) + '...';
                }

                if (isReal) {
                    assertCall = `  AssertReal('${safeName}', ${expected}, ${assert.var});`;
                } else if (isPointer) {
                    // Cast the variables to raw Pointer type to pass them to our generic AssertPtr
                    assertCall = `  AssertPtr('${safeName}', Pointer(${expected}), Pointer(${assert.var}));`;
                } else if (varMaps['Boolean'].has(assert.var)) {
                    assertCall = `  AssertBool('${safeName}', ${expected}, ${assert.var});`;
                } else if (varMaps['String'].has(assert.var) || varMaps['Char'].has(assert.var)) {
                    assertCall = `  AssertStr('${safeName}', ${expected}, ${assert.var});`;
                } else {
                    assertCall = `  AssertInt('${safeName}', ${expected}, ${assert.var});`;
                }

                lines.push(assertCall);
            });
            lines.push(""); // Spacing between vectors
        });
    });

    lines.push(
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