// src/main.js
import { VGA } from './hardware/vga.js';
import { IO } from './hardware/io.js';
import { Memory } from './hardware/memory.js';
import { Environment } from './runtime/environment.js';
import { Evaluator } from './runtime/evaluator.js';
import { block } from './parser/controlFlow.js';
import { autoDecodeSource } from './hardware/encoding.js';

/**
 * Sysclone - Universal JIT Web
 * Main entry point: Orchestrates hardware, runtime, and CPU execution.
 */

console.log("🔥 Powering up the Sysclone Virtual Machine...");

// 1. Hardware Initialization
const screen = new VGA('vga-display');
const io = new IO();
const memory = new Memory(io);

// 2. Runtime System Initialization
const env = new Environment();
const evaluator = new Evaluator(env, { vga: screen, io: io, memory: memory });

/**
 * Downloads the source code, parses the AST, and initiates the execution loop.
 */
async function loadAndRunGame() {
    console.log("📥 Fetching source: NIBBLES.BAS...");
    
    try {
        const response = await fetch('./examples/nibbles.bas');
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        
        // 1. Read file as raw byte stream (preserves legacy encoding)
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        // 2. Smart auto-decoding (handles Raw DOS or GitHub Mojibake magically)
        const sourceCode = autoDecodeSource(bytes);
        
        console.log(`✅ File loaded and auto-decoded (${sourceCode.length} chars). Starting Parser...`);
        
        // The core parsing logic
        const parsed = block.run(sourceCode);

        if (parsed.isError) {
            console.error("❌ Parser failed at index:", parsed.index);
            
            // Display context around the error for debugging
            const errorContext = sourceCode.substring(Math.max(0, parsed.index - 30), parsed.index + 70);
            console.error("Error context:\n", errorContext);
        } else {
            console.log("🤯 Success! Full AST generated. Initializing CPU...");
            
            const process = evaluator.evaluate(parsed.result);
            const CYCLES_PER_FRAME = 200; 

            /**
             * Virtual CPU clock loop using Generators for non-blocking execution.
             */
            function cpuLoop() {
                let cycles = CYCLES_PER_FRAME;
                
                // CPU execution safety net
                try {
                    while (cycles > 0) {
                        const state = process.next(); 
                        if (state.done) {
                            console.log("🏁 Program execution finished.");
                            screen.render(); // Ensure final render
                            return; 
                        }
                        cycles--;
                    }
                } catch (e) {
                    console.error("💥 CPU Crash:", e.message);
                    screen.render(); // Draw current state before crash
                    return;
                }
                
                // Video Phase: Render once per frame to maintain performance
                screen.render();
                
                // Yield to browser and schedule next tick
                requestAnimationFrame(cpuLoop);
            }

            // Start the clock
            cpuLoop();
        }
    } catch (error) {
        console.error("❌ Failed to initialize Sysclone. Check local server and examples folder.", error);
    }
}

// Ignition
loadAndRunGame();

/**
 * Global input monitor for background debugging.
 */
window.addEventListener('keydown', () => {
    // console.log("Input detected in IO Buffer:", io.keyBuffer);
});