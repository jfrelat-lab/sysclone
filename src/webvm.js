// src/webvm.js
import { VGA } from './hardware/vga.js';
import { IO } from './hardware/io.js';
import { Memory } from './hardware/memory.js';
import { Environment } from './runtime/environment.js';
import { Evaluator } from './runtime/evaluator.js';
import { block } from './parser/qbasic/controlFlow.js';
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

// --- GIF RECORDING STATE ---
let gifEncoder = null;
let lastCaptureTime = 0;

// 24 FPS : The cinematic sweet spot. 
// Fast enough to catch XOR sprites, slow enough to save file size.
const GIF_FPS = 24; 
const GIF_DELAY_MS = 1000 / GIF_FPS;

function resetHardware() {
    if (currentAnimationFrame) {
        cancelAnimationFrame(currentAnimationFrame);
        currentAnimationFrame = null;
    }
    isPaused = false;
    currentProcess = null;

    io = new IO();
    memory = new Memory(io);
    
    // --- VGA Dependency Injection ---
    // The WebVM orchestrator handles all DOM interactions.
    // The Virtual Card (VGA) only cares about the pixel buffer it receives.
    screen = new VGA(memory, { 
        createDisplay: (width, height) => {
            const canvas = document.getElementById('vga-display');
            canvas.width = width;
            canvas.height = height;
            
            // Dynamic CSS height calculation to maintain square pixels
            // We fix the physical CSS width to 640px (standard emulator UI width)
            const scale = 640 / width;
            const physicalHeight = Math.floor(height * scale);
            
            canvas.style.width = "640px";
            canvas.style.height = `${physicalHeight}px`;
            canvas.style.imageRendering = "pixelated";
            
            const ctx = canvas.getContext('2d', { alpha: false });
            // Recreate ImageData when the underlying resolution changes
            const imageData = ctx.createImageData(width, height);
            
            return {
                width: width,
                height: height,
                pixelBuffer32: new Uint32Array(imageData.data.buffer),
                commit: () => ctx.putImageData(imageData, 0, 0)
            };
        }
    });
    
    env = new Environment();
    evaluator = new Evaluator(env, { vga: screen, io: io, memory: memory });
    
    ui.forcePlayState(); // Ensure UI reflects the running state
}

/**
 * Captures a frame natively from the VGA Canvas.
 * No spatial downscaling to preserve crisp MS-DOS pixel art fonts.
 */
function captureGifFrame() {
    if (!ui.isRecording || !gifEncoder) return;
    
    const now = performance.now();
    if (now - lastCaptureTime >= GIF_DELAY_MS) {
        const sourceCanvas = document.getElementById('vga-display');
        if (sourceCanvas) {
            gifEncoder.addFrame(sourceCanvas, { delay: GIF_DELAY_MS, copy: true });
            lastCaptureTime = now;
        }
    }
}

/**
 * Main execution loop for the Virtual CPU.
 * Manages instruction budget (Turbo vs. Normal) and intercepts hardware delays.
 */
function cpuLoop() {
    if (isPaused || !currentProcess) return;

    try {
        if (ui.isTurboMode) {
            const frameStart = performance.now();
            // Execute instructions for up to 12ms per frame
            while (performance.now() - frameStart < 12) {
                const state = currentProcess.next();
                
                if (state.done) { 
                    finalizeExecution(); 
                    return; 
                }
                
                // --- HARDWARE INTERRUPT AWAIT ---
                if (state.value && state.value.type === 'SYS_DELAY') {
                    handleSysDelay(state.value.ms);
                    return; // Freeze the CPU loop entirely
                }
            }
        } else {
            let cycles = ui.cyclesPerFrame;
            // Execute a fixed number of instructions per frame
            while (cycles > 0) {
                const state = currentProcess.next(); 
                
                if (state.done) { 
                    finalizeExecution(); 
                    return; 
                }
                
                // --- HARDWARE INTERRUPT AWAIT ---
                if (state.value && state.value.type === 'SYS_DELAY') {
                    handleSysDelay(state.value.ms);
                    return; // Freeze the CPU loop entirely
                }
                cycles--;
            }
        }
    } catch (e) {
        console.error("💥 CPU Execution Error:", e.message);
        return;
    }
    
    // Render graphics at the end of the time slice
    if (screen) {
        screen.render();
        captureGifFrame(); // Push frame to the GIF encoder if active
    }
    currentAnimationFrame = requestAnimationFrame(cpuLoop);
}

/**
 * Handles asynchronous hardware pauses (SLEEP, PLAY, SOUND).
 * Yields control back to the browser and resumes execution later.
 * @param {number} ms - Delay in milliseconds (-1 for indefinite key wait)
 */
function handleSysDelay(ms) {
    // Force an immediate render before sleeping to display pending graphics/text.
    // Without this, the screen would remain blank during the sleep duration.
    if (screen) {
        screen.render();
        captureGifFrame(); // Ensure visual feedback is captured before pausing
    }

    if (ms > 0) {
        // Timed delay (e.g., SLEEP n, PLAY, SOUND)
        setTimeout(() => {
            // Only resume if the VM wasn't paused or reset by the user during the sleep
            if (!isPaused && currentProcess) {
                currentAnimationFrame = requestAnimationFrame(cpuLoop);
            }
        }, ms);
    } else if (ms === -1) {
        // Indefinite delay (SLEEP without arguments) -> Wait for any keypress
        const onKey = (e) => {
            window.removeEventListener('keydown', onKey);
            if (!isPaused && currentProcess) {
                currentAnimationFrame = requestAnimationFrame(cpuLoop);
            }
        };
        window.addEventListener('keydown', onKey);
    } else {
        // Edge case: 0ms delay, yield to browser and resume immediately
        currentAnimationFrame = requestAnimationFrame(cpuLoop);
    }
}

function finalizeExecution() {
    console.log("🏁 Program terminated normally.");
    currentProcess = null;
    if (screen) {
        screen.render();
        captureGifFrame(); // Capture the final state
    }
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

// --- DYNAMIC GIF SCRIPT LOADER ---
async function loadGifLibrary() {
    if (window.GIF) return true; // Already loaded
    
    return new Promise((resolve, reject) => {
        console.log("⏳ [WebVM] Injecting gif.js library from CDN...");
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
        
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error("Failed to load gif.js from CDN. Check your network."));
        
        document.head.appendChild(script);
    });
}

// --- UI LIFECYCLE HOOKS ---

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
        boot(getFilenameFromHash());
    }
};

ui.onRecordRequested = async (startRecording) => {
    if (startRecording) {
        try {
            ui.setRecordButtonState('loading');
            await loadGifLibrary();
            
            console.log("🔴 [WebVM] Starting GIF recording...");
            ui.setRecordButtonState('recording');
            
            // Fetch Web Worker to bypass CORS
            const workerResponse = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
            if (!workerResponse.ok) throw new Error("Failed to fetch Web Worker script");
            const workerCode = await workerResponse.text();
            const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(workerBlob);

            // Instantiate at native 1:1 scale
            gifEncoder = new window.GIF({
                workers: 2,
                quality: 10, // NeuQuant neural-net color quantization
                workerScript: workerUrl
            });

            gifEncoder.on('finished', (blob) => {
                console.log("✅ [WebVM] GIF processed successfully.");
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const romName = getFilenameFromHash().replace(/\.bas$/i, '');
                a.download = `sysclone_${romName}_recording.gif`;
                a.href = url;
                a.click();
                
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(workerUrl); 
                
                ui.setRecordButtonState('idle'); 
                gifEncoder = null;
            });
            
        } catch (error) {
            console.error(error);
            ui.setRecordButtonState('idle'); 
            alert("Could not load the GIF encoder.");
        }
    } else {
        if (gifEncoder) {
            console.log("⏹️ [WebVM] Stopping capture, encoding GIF...");
            ui.setRecordButtonState('encoding');
            gifEncoder.render();
        }
    }
};

// --- ROUTING & DEEP LINKING ---

function getFilenameFromHash() {
    const hash = window.location.hash.substring(1);
    return hash ? `${hash}.bas` : 'nibbles.bas'; 
}

window.addEventListener('hashchange', () => {
    const filename = getFilenameFromHash();
    ui.setRomSelection(filename); 
    boot(filename);
});

// --- SYSTEM IGNITION ---
async function start() {
    const initialRom = getFilenameFromHash();
    await ui.loadCatalog(initialRom); 
    boot(initialRom);
}

start();