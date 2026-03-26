// tools/run_truth.js
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// 1. Configuration and Argument Parsing
const args = process.argv.slice(2);
const targetArg = args.find(arg => arg.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1].toLowerCase() : 'qbasic';

// Allow environment variable override for CI/CD or cross-platform usage.
// Defaults to the standard macOS DOSBox application path.
const DOSBOX_PATH = process.env.DOSBOX_PATH || '"/Applications/DOSBox.app/Contents/MacOS/DOSBox"';

// Resolve absolute paths for mounting and temporary files
const examplesPath = path.resolve('./examples');
const runnerBatPath = path.join(examplesPath, '_runner.bat');

console.log(`🚀 Starting DOSBox Truth Viewer for target: [${target.toUpperCase()}]`);

// 2. Dynamic MS-DOS Batch Script Generation
// We use a temporary .bat file to handle complex execution flows (like compilation errors)
// directly within the DOS environment without relying on fragile chained DOSBox commands.
let batContent = "";

if (target === 'qbasic') {
    batContent = [
        "@ECHO OFF",
        "CLS",
        "QB45\\QB.EXE /run compat.bas",
        "EXIT" // Cleans up the batch execution (QBasic stays open if no SYSTEM command is used)
    ].join('\r\n');
} else if (target === 'pascal') {
    batContent = [
        "@ECHO OFF",
        "CLS",
        "ECHO Compiling compat.pas...",
        "TP7\\TPC.EXE compat.pas",
        "IF ERRORLEVEL 1 GOTO error", // Halt execution if the compiler throws an error
        "CLS",
        "compat.exe",
        "GOTO end",
        ":error",
        "ECHO.",
        "ECHO [!] Compilation failed. Please check compat.pas.",
        "PAUSE", // Keep the window open so the developer can read the compiler error
        ":end",
        "EXIT" // Return control to DOSBox/Node.js
    ].join('\r\n');
} else {
    console.error(`❌ Unknown target: ${target}. Use --target=qbasic or --target=pascal`);
    process.exit(1);
}

try {
    // 3. Write the temporary batch script to the mounted directory
    fs.writeFileSync(runnerBatPath, batContent, 'utf8');

    // 4. Construct DOSBox launch commands
    // We mount the directory, switch to it, and execute the generated batch file.
    const commands = [
        `-c "mount c '${examplesPath}'"`,
        `-c "c:"`,
        `-c "_runner.bat"`
    ].join(' ');

    console.log(`📂 Mounted directory: ${examplesPath}`);
    console.log(`⚙️  Executing... Please check the DOSBox window.`);
    
    // Execute DOSBox synchronously. 
    // stdio: 'inherit' binds DOSBox console output (warnings) to the Node terminal.
    execSync(`${DOSBOX_PATH} ${commands}`, { stdio: 'inherit' });
    
    console.log("✅ Execution finished. DOSBox was closed cleanly.");

} catch (error) {
    console.error("❌ DOSBox process failed:", error.message);
} finally {
    // 5. Cleanup Phase
    // Ensure the temporary batch file is deleted even if DOSBox crashes,
    // keeping the examples/ directory clean.
    if (fs.existsSync(runnerBatPath)) {
        fs.unlinkSync(runnerBatPath);
    }
}