#!/usr/bin/env node
// convert_bas.js
import fs from 'fs';
import path from 'path';
import { autoDecodeSource } from './src/hardware/encoding.js';

/**
 * Sysclone - Legacy MS-DOS QBasic File Converter
 * * Automatically detects and repairs MS-DOS CP437 files or 
 * Windows-1252/ISO-8859-1 Mojibake downloaded from modern web platforms.
 * Outputs a clean, standard UTF-8 file.
 */

const args = process.argv.slice(2);

if (args.length < 2) {
    console.error("🧰 Sysclone MS-DOS Code Converter");
    console.error("Usage: node convert_bas.js <input_file.bas> <output_file_utf8.bas>");
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = path.resolve(args[1]);

try {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`File not found: ${inputPath}`);
    }

    console.log(`📥 Reading raw bytes from: ${args[0]}...`);
    
    // Read the file as raw bytes (No encoding parameter!)
    const buffer = fs.readFileSync(inputPath);
    const bytes = new Uint8Array(buffer);

    console.log(`🧠 Analyzing encoding for ${bytes.length} bytes...`);
    const cleanUnicodeText = autoDecodeSource(bytes);

    console.log(`💾 Writing clean UTF-8 source to: ${args[1]}...`);
    // Write the pristine string natively as UTF-8
    fs.writeFileSync(outputPath, cleanUnicodeText, 'utf8');

    console.log("✅ Conversion successful! Ready for Sysclone.");

} catch (error) {
    console.error(`❌ Conversion failed: ${error.message}`);
    process.exit(1);
}