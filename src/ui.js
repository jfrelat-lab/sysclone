// src/ui.js
import { QBasicTokenizer } from './parser/qbasic/qbasic_tokenizer.js';

export class WebUI {
    constructor() {
        // Core DOM
        this.speedSlider = document.getElementById('cpu-speed');
        this.speedDisplay = document.getElementById('speed-display');
        this.turboCheckbox = document.getElementById('cpu-turbo');
        this.romSelector = document.getElementById('rom-selector');
        this.vgaCanvas = document.getElementById('vga-display');

        // IDE Elements
        this.btnTogglePlay = document.getElementById('btn-toggle-play');
        this.iconPlay = document.getElementById('icon-play');
        this.iconPause = document.getElementById('icon-pause');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnScreenshot = document.getElementById('btn-screenshot');
        this.btnFullscreen = document.getElementById('btn-fullscreen');
        
        this.sourceViewer = document.getElementById('source-viewer');
        this.sourceFilename = document.getElementById('source-filename');

        // State & Dependencies
        this.cyclesPerFrame = this.speedSlider ? parseInt(this.speedSlider.value, 10) : 40;
        this.isTurboMode = this.turboCheckbox ? this.turboCheckbox.checked : false;
        this.isPlaying = true; // Auto-starts on load
        this.tokenizer = new QBasicTokenizer(); // Strategy injected here

        // Callbacks for the Orchestrator
        this.onRomLoadRequested = null;
        this.onActionRequested = null; // 'pause', 'play', 'restart'
        this.onScreenshotRequested = null;

        this._initEvents();
        this._updateSpeedDisplay();
    }

    async loadCatalog(defaultRom = 'nibbles.bas') {
        if (!this.romSelector) return;
        try {
            const response = await fetch('./examples/catalog.json');
            if (!response.ok) throw new Error("Catalog not found");
            const roms = await response.json();
            this.romSelector.innerHTML = '';
            roms.forEach(rom => {
                const option = document.createElement('option');
                option.value = rom;
                option.textContent = rom;
                if (rom.toLowerCase() === defaultRom.toLowerCase()) option.selected = true;
                this.romSelector.appendChild(option);
            });
        } catch (error) {
            console.warn("⚠️ Catalog failed to load.", error);
        }
    }

    /**
     * Safely injects the source code using the injected Strategy Tokenizer.
     * Groups tokens into logical lines to render a VS Code-style gutter.
     */
    setSourceCode(filename, code) {
        if (this.sourceFilename) this.sourceFilename.textContent = filename;
        if (!this.sourceViewer) return;

        const tokens = this.tokenizer.tokenize(code);
        
        let currentLineHtml = '';
        const linesHtml = [];

        for (const token of tokens) {
            // Split token value by newline to handle multiline tokens (like WHITESPACE)
            const parts = token.value.split(/\r?\n/);

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                
                if (part.length > 0) {
                    // Absolute XSS Prevention
                    const safeText = part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    
                    switch (token.type) {
                        case 'KEYWORD': currentLineHtml += `<span class="syn-kw">${safeText}</span>`; break;
                        case 'BUILTIN': currentLineHtml += `<span class="syn-built">${safeText}</span>`; break;
                        case 'COMMENT': currentLineHtml += `<span class="syn-com">${safeText}</span>`; break;
                        case 'STRING':  currentLineHtml += `<span class="syn-str">${safeText}</span>`; break;
                        case 'NUMBER':  currentLineHtml += `<span class="syn-num">${safeText}</span>`; break;
                        default:        currentLineHtml += safeText; break;
                    }
                }

                // If this is not the last part, a newline was consumed.
                // We wrap the accumulated HTML into a line div and start fresh.
                if (i < parts.length - 1) {
                    linesHtml.push(`<div class="editor-line">${currentLineHtml}</div>`);
                    currentLineHtml = '';
                }
            }
        }

        // Push the final line (even if empty, to show the last line number)
        linesHtml.push(`<div class="editor-line">${currentLineHtml}</div>`);

        // Join everything without extra spaces to preserve pure formatting
        this.sourceViewer.innerHTML = linesHtml.join('');
    }

    _togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.iconPlay.style.display = 'none';
            this.iconPause.style.display = 'block';
            this.onActionRequested?.('play');
        } else {
            this.iconPlay.style.display = 'block';
            this.iconPause.style.display = 'none';
            this.onActionRequested?.('pause');
        }
    }

    forcePlayState() {
        this.isPlaying = true;
        this.iconPlay.style.display = 'none';
        this.iconPause.style.display = 'block';
    }

    _takeScreenshot() {
        if (!this.vgaCanvas) return;
        this.vgaCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const romName = this.romSelector.value.replace(/\.bas$/i, '');
            a.download = `sysclone_${romName}_${Date.now()}.png`;
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    _initEvents() {
        if (this.speedSlider) this.speedSlider.addEventListener('input', (e) => { this.cyclesPerFrame = parseInt(e.target.value, 10); this._updateSpeedDisplay(); });
        if (this.turboCheckbox) this.turboCheckbox.addEventListener('change', (e) => { this.isTurboMode = e.target.checked; this.speedSlider.disabled = this.isTurboMode; this._updateSpeedDisplay(); });
        if (this.romSelector) this.romSelector.addEventListener('change', (e) => this.onRomLoadRequested?.(e.target.value));
        
        if (this.btnTogglePlay) this.btnTogglePlay.addEventListener('click', () => this._togglePlayPause());
        if (this.btnRestart) this.btnRestart.addEventListener('click', () => this.onActionRequested?.('restart'));
        if (this.btnScreenshot) this.btnScreenshot.addEventListener('click', () => this._takeScreenshot());
        
        if (this.btnFullscreen) {
            this.btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    this.vgaCanvas.requestFullscreen().catch(err => console.warn(err));
                } else {
                    document.exitFullscreen();
                }
            });
        }
    }

    _updateSpeedDisplay() {
        if (!this.speedDisplay) return;
        if (this.isTurboMode) {
            this.speedDisplay.innerText = "TURBO";
        } else {
            // Convert arbitrary cycles/frame to a realistic Retro MHz representation
            // e.g., 40 cycles -> 4.00 MHz (PC XT era), 200 cycles -> 20.00 MHz (386 era)
            const mhz = (this.cyclesPerFrame / 10).toFixed(2);
            this.speedDisplay.innerText = `${mhz} MHz`;
        }
    }
}