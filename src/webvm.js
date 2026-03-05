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
 * Sysclone WebVM Orchestrator
 * Pure lifecycle management: Connects the UI shell to the HAL and Virtual CPU.
 */

const ui = new WebUI();
let io, memory, screen, env, evaluator, currentAnimationFrame;
let currentProcess = null;
let isPaused = false;

function resetHardware() {
    if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
        currentAnimationFrame = null;
    }
    isPaused = false;
    currentProcess = null;

    io = new IO();
    memory = new Memory(io);
    screen = new VGA(memory, { canvasId: 'vga-display' });
    env = new Environment();
    evaluator = new Evaluator(env, { vga: screen, io: io, memory: memory });
    
    ui.forcePlayState(); // Ensure UI reflects the running state
}

function cpuLoop() {
    if (isPaused || !currentProcess) return;

    try {
        if (ui.isTurboMode) {
            const frameStart = performance.now();
            while (performance.now() - frameStart < 12) {
                const state = currentProcess.next();
                if (state.done) { finalizeExecution(); return; }
            }
        } else {
            let cycles = ui.cyclesPerFrame;
            while (cycles > 0) {
                const state = currentProcess.next(); 
                if (state.done) { finalizeExecution(); return; }
                cycles--;
            }
        }
    } catch (e) {
        console.error("💥 CPU Execution Error:", e.message);
        return;
    }
    
    screen.render();
    currentAnimationFrame = requestAnimationFrame(cpuLoop);
}

function finalizeExecution() {
    console.log("🏁 Program terminated normally.");
    currentProcess = null;
    if (screen) screen.render();
}

async function boot(filename) {
    console.log(`📥 Booting ROM: ${filename}...`);
    resetHardware();

    try {
        const response = await fetch(`./examples/${filename}`);
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        
        const buffer = await response.arrayBuffer();
        const sourceCode = autoDecodeSource(new Uint8Array(buffer));
        
        ui.setSourceCode(filename, sourceCode);
        
        const parsed = block.run(sourceCode);
        if (parsed.isError) throw new Error(`Parser failed at index ${parsed.index}`);
        
        currentProcess = evaluator.evaluate(parsed.result);
        cpuLoop();
    } catch (error) {
        console.error(`❌ Boot Failure: ${error.message}`);
    }
}

// --- UI LIFECYCLE HOOKS ---

ui.onRomLoadRequested = (filename) => boot(filename);

ui.onActionRequested = (action) => {
    if (action === 'pause') {
        isPaused = true;
        if (currentAnimationFrame) cancelAnimationFrame(currentAnimationFrame);
    } 
    else if (action === 'play') {
        if (isPaused && currentProcess) {
            isPaused = false;
            cpuLoop();
        }
    }
    else if (action === 'restart') {
        // Hard reboot of the current ROM
        boot(ui.romSelector.value);
    }
};

// --- SYSTEM IGNITION ---
async function start() {
    await ui.loadCatalog('nibbles.bas');
    boot(ui.romSelector.value || 'nibbles.bas');
}

start();