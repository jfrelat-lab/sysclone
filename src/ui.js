// src/ui.js

/**
 * Handles all Web DOM interactions, decoupling the UI from the Virtual Machine.
 */
export class WebUI {
    constructor() {
        // DOM Elements
        this.speedSlider = document.getElementById('cpu-speed');
        this.speedDisplay = document.getElementById('speed-display');
        this.turboCheckbox = document.getElementById('cpu-turbo');
        this.romSelector = document.getElementById('rom-selector');
        this.fullscreenBtn = document.getElementById('btn-fullscreen');
        this.vgaCanvas = document.getElementById('vga-display');

        // State
        this.cyclesPerFrame = this.speedSlider ? parseInt(this.speedSlider.value, 10) : 40;
        this.isTurboMode = this.turboCheckbox ? this.turboCheckbox.checked : false;

        // Callbacks (Injected by the Orchestrator)
        this.onRomLoadRequested = null;

        this._initEvents();
        this._updateSpeedDisplay();
    }

    /**
     * Fetches the statically generated ROM catalog and populates the dropdown.
     */
    async loadCatalog(defaultRom = 'nibbles.bas') {
        if (!this.romSelector) return;

        try {
            const response = await fetch('./examples/catalog.json');
            if (!response.ok) throw new Error("Catalog not found");
            
            const roms = await response.json();
            
            // Clear existing options
            this.romSelector.innerHTML = '';

            // Populate from JSON
            roms.forEach(rom => {
                const option = document.createElement('option');
                option.value = rom;
                // Beautify the name (e.g., "mandel.bas" -> "Mandel")
                option.textContent = rom.replace(/\.bas$/i, '').charAt(0).toUpperCase() + rom.slice(1, -4);
                if (rom.toLowerCase() === defaultRom.toLowerCase()) {
                    option.selected = true;
                }
                this.romSelector.appendChild(option);
            });

            console.log(`📚 Loaded ${roms.length} ROMs into the UI.`);
        } catch (error) {
            console.warn("⚠️ Could not load ROM catalog. Using fallback UI options.", error);
        }
    }

    _initEvents() {
        if (this.speedSlider && this.turboCheckbox) {
            this.speedSlider.addEventListener('input', (e) => {
                this.cyclesPerFrame = parseInt(e.target.value, 10);
                this._updateSpeedDisplay();
            });

            this.turboCheckbox.addEventListener('change', (e) => {
                this.isTurboMode = e.target.checked;
                this.speedSlider.disabled = this.isTurboMode;
                this._updateSpeedDisplay();
            });
        }

        if (this.romSelector) {
            this.romSelector.addEventListener('change', (e) => {
                const filename = e.target.value;
                if (this.onRomLoadRequested) this.onRomLoadRequested(filename);
            });
        }

        if (this.fullscreenBtn && this.vgaCanvas) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
    }

    _updateSpeedDisplay() {
        if (!this.speedDisplay) return;
        if (this.isTurboMode) {
            this.speedDisplay.innerText = "MAX Speed";
            return;
        }
        const hz = this.cyclesPerFrame * 60; 
        this.speedDisplay.innerText = `${this.cyclesPerFrame} cycles/frame (~${hz} Hz)`;
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.vgaCanvas.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
}