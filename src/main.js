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

// 1. Hardware Initialization (Order matters!)
const io = new IO();
const memory = new Memory(io);
// Inject Memory into VGA so it can map its VRAM to 0xB8000
const screen = new VGA(memory, { canvasId: 'vga-display' });

// 2. Runtime System Initialization
const env = new Environment();
const evaluator = new Evaluator(env, { vga: screen, io: io, memory: memory });

// ============================================================================
// UX & CPU CLOCK MANAGEMENT
// ============================================================================
const speedSlider = document.getElementById('cpu-speed');
const speedDisplay = document.getElementById('speed-display');
const turboCheckbox = document.getElementById('cpu-turbo');

// Valeurs par défaut (sécurisées si le HTML n'est pas encore chargé)
let currentCyclesPerFrame = speedSlider ? parseInt(speedSlider.value, 10) : 40;
let isTurboMode = turboCheckbox ? turboCheckbox.checked : false;

function updateSpeedDisplay(cycles) {
    if (!speedDisplay) return;
    if (isTurboMode) {
        speedDisplay.innerText = "MAX Speed";
        return;
    }
    const hz = cycles * 60; 
    speedDisplay.innerText = `${cycles} cycles/frame (~${hz} Hz)`;
}

// Câblage des événements UI
if (speedSlider && turboCheckbox) {
    updateSpeedDisplay(currentCyclesPerFrame);

    speedSlider.addEventListener('input', (e) => {
        currentCyclesPerFrame = parseInt(e.target.value, 10);
        updateSpeedDisplay(currentCyclesPerFrame);
    });

    turboCheckbox.addEventListener('change', (e) => {
        isTurboMode = e.target.checked;
        speedSlider.disabled = isTurboMode;
        updateSpeedDisplay(currentCyclesPerFrame);
    });
}
// ============================================================================

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

            /**
             * Virtual CPU clock loop using Generators for non-blocking execution.
             * Features a Hybrid Core: Strict Cycle Counting (Retro) or Time Budgeting (Turbo).
             */
            function cpuLoop() {
                try {
                    if (isTurboMode) {
                        // --- TURBO MODE (Maximum Math/Graphics Output) ---
                        const frameStart = performance.now();
                        // Allow CPU to run freely for 12ms per 16.6ms frame
                        while (performance.now() - frameStart < 12) {
                            const state = process.next();
                            if (state.done) {
                                console.log("🏁 Program execution finished.");
                                screen.render();
                                return;
                            }
                        }
                    } else {
                        // --- RETRO MODE (Strict Deterministic Speed) ---
                        let cycles = currentCyclesPerFrame;
                        while (cycles > 0) {
                            const state = process.next(); 
                            if (state.done) {
                                console.log("🏁 Program execution finished.");
                                screen.render(); // Ensure final render
                                return; 
                            }
                            cycles--;
                        }
                    }
                } catch (e) {
                    console.error("💥 CPU Crash:", e.message);
                    screen.render(); // Draw current state before crash to help debug
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