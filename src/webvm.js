// src/webvm.js
import { VGA } from './hardware/vga.js';
import { IO } from './hardware/io.js';
import { Memory } from './hardware/memory.js';
import { Environment } from './runtime/environment.js';
import { Evaluator } from './runtime/evaluator.js';
import { block } from './parser/controlFlow.js';
import { autoDecodeSource } from './hardware/encoding.js';
import { WebUI } from './ui.js';

/**
 * Sysclone Web Orchestrator
 * Connects the UI shell to the Hardware Abstraction Layer and CPU.
 */

console.log("🔥 Powering up the Sysclone WebVM...");

// 1. Initialize the UI Shell
const ui = new WebUI();

// 2. Global Hardware State
let io, memory, screen, env, evaluator, currentAnimationFrame;

/**
 * Initializes or resets the hardware and runtime environment.
 */
function initHardware() {
    // Kill any running CPU loop to prevent duplicate execution
    if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
        currentAnimationFrame = null;
    }

    io = new IO();
    memory = new Memory(io);
    screen = new VGA(memory, { canvasId: 'vga-display' });
    
    env = new Environment();
    evaluator = new Evaluator(env, { vga: screen, io: io, memory: memory });
}

/**
 * Downloads a script, parses the AST, and initiates the CPU loop.
 * @param {string} filename 
 */
async function boot(filename) {
    console.log(`📥 Fetching ROM: ${filename}...`);
    initHardware(); // Clean slate

    try {
        const response = await fetch(`./examples/${filename}`);
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const sourceCode = autoDecodeSource(bytes);
        
        console.log(`✅ File loaded and auto-decoded. Starting Parser...`);
        const parsed = block.run(sourceCode);

        if (parsed.isError) {
            console.error("❌ Parser failed at index:", parsed.index);
            return;
        } 
        
        console.log("🤯 Success! AST generated. Initializing CPU...");
        const process = evaluator.evaluate(parsed.result);

        function cpuLoop() {
            try {
                if (ui.isTurboMode) {
                    // MODE TURBO: Time Budgeting (12ms max)
                    const frameStart = performance.now();
                    while (performance.now() - frameStart < 12) {
                        const state = process.next();
                        if (state.done) {
                            console.log("🏁 Program terminated.");
                            screen.render();
                            return;
                        }
                    }
                } else {
                    // MODE RETRO: Cycle Counting
                    let cycles = ui.cyclesPerFrame;
                    while (cycles > 0) {
                        const state = process.next(); 
                        if (state.done) {
                            console.log("🏁 Program terminated.");
                            screen.render();
                            return; 
                        }
                        cycles--;
                    }
                }
            } catch (e) {
                console.error("💥 CPU Crash:", e.message);
                screen.render();
                return;
            }
            
            screen.render();
            currentAnimationFrame = requestAnimationFrame(cpuLoop);
        }

        // Start the clock
        cpuLoop();
        
    } catch (error) {
        console.error(`❌ Failed to boot ${filename}:`, error);
    }
}

// 3. Wire the UI ROM selector to the boot sequence
ui.onRomLoadRequested = (filename) => {
    boot(filename);
};

// 4. Power On Sequence
async function startSystem() {
    // Wait for the UI to fetch the JSON catalog
    await ui.loadCatalog('nibbles.bas');
    
    // Boot the engine with whatever the selector ended up on
    const initialRom = document.getElementById('rom-selector').value || 'nibbles.bas';
    boot(initialRom);
}

startSystem();