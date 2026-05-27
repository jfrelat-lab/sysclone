// tools/run_truth.js
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// --- 1. Configuration ---
const args = process.argv.slice(2);
const targetArg = args.find(arg => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1].toLowerCase() : 'qbasic';

const DOSBOX_PATH = process.env.DOSBOX_PATH || '"/Applications/DOSBox.app/Contents/MacOS/DOSBox"';
const EXAMPLES_PATH = path.resolve('./examples');

// --- 2. Execution Environments ---

/**
 * Handles legacy MS-DOS environments by mounting a virtual drive in DOSBox
 * and executing a dynamically generated batch file.
 */
function runInDOSBox(batContent) {
    const runnerBatPath = path.join(EXAMPLES_PATH, '_runner.bat');
    try {
        fs.writeFileSync(runnerBatPath, batContent, 'utf8');
        const commands = [
            `-c "mount c '${EXAMPLES_PATH}'"`,
            `-c "c:"`,
            `-c "_runner.bat"`
        ].join(' ');

        console.log(`📂 Mounted directory: ${EXAMPLES_PATH}`);
        console.log(`⚙️  Executing via DOSBox... Please check the DOSBox window.`);
        execSync(`${DOSBOX_PATH} ${commands}`, { stdio: 'inherit' });
    } finally {
        if (fs.existsSync(runnerBatPath)) {
            fs.unlinkSync(runnerBatPath);
        }
    }
}

// --- 3. Strategy Pattern (Runners) ---

const runners = {
    qbasic: () => {
        const batContent = [
            "@ECHO OFF",
            "CLS",
            "QB45\\QB.EXE /run compat.bas",
            "EXIT"
        ].join('\r\n');
        runInDOSBox(batContent);
    },
    pascal: () => {
        const batContent = [
            "@ECHO OFF",
            "CLS",
            "ECHO Compiling compat.pas...",
            "TP7\\TPC.EXE compat.pas",
            "IF ERRORLEVEL 1 GOTO error",
            "CLS",
            "compat.exe",
            "GOTO end",
            ":error",
            "ECHO.",
            "ECHO [!] Compilation failed. Please check compat.pas.",
            "PAUSE",
            ":end",
            "EXIT"
        ].join('\r\n');
        runInDOSBox(batContent);
    }
};

// --- 4. Orchestration ---

console.log(`🚀 Starting Truth Viewer for target: [${target.toUpperCase()}]`);

if (!runners[target]) {
    console.error(`❌ Unknown target: ${target}. Valid targets: ${Object.keys(runners).join(', ')}`);
    process.exit(1);
}

try {
    runners[target]();
    console.log("✅ Execution finished cleanly.");
} catch (error) {
    console.error(`❌ Execution failed: ${error.message}`);
    process.exit(1);
}