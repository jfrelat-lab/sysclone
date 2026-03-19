# Sysclone Project: Universal JIT / Web Interpreter (JS/WASM)

## Global Vision
The primary objective is to create a universal execution engine running directly in the browser (via JavaScript and WebAssembly). This engine must be capable of executing programs written in a multitude of historical and modern programming languages, *without any modification* to the original source code, and with high performance.

## Architecture and Core Principles
## Architecture and Core Principles
* **Frontend (Lexical and Syntactic Analysis & UI):** * Systematic use of **monadic parsers** implemented in pure JavaScript. This allows for building composable, modular, and unit-testable grammars (brick by brick) tailored to handle the specificities of each target language (e.g., line-based for QBasic, bracket-based for C/Java).
  * **Decoupled Presentation:** Implementation of a **Strategy Pattern** for tokenization, allowing the Web IDE to provide lightning-fast, zero-dependency syntax highlighting that is strictly separated from the AST compilation logic.
* **Backend (Asynchronous Execution Engine):** * Implementation of a **Virtual Processor (CPU Runner)** based on JS Generators (`function*` / `yield*`).
  * This model enables execution paced by instruction cycles (Ticks), guaranteeing a non-blocking loop for the browser (anti-freeze) and a perfectly controlled framerate. 
  * Advanced handling of hardware pauses (like `SLEEP` or audio durations) via `SYS_DELAY` yield interrupts, granting total control over execution pauses without ever blocking the UI thread.
  * *JIT Evolution:* Ultimately, translating the AST/IR into WebAssembly instructions for native performance.
* **Hardware Abstraction Layer (HAL):** * Purist emulation of original hardware subsystems using modern Web APIs (Canvas, Web Audio).
  * Implementation of isolated components: addressable RAM, VGA/CGA/EGA rendering (bitmap ROMs, hardware palettes, Bitplane/Linear memory decoding), Keyboard I/O with rigid anti-ghosting buffers, and system clock.
  * **Robust I/O Translation:** An intelligent, heuristic decoding layer that automatically bridges 1990s MS-DOS binary files (CP437) and modern UTF-8 environments. It actively detects and repairs corrupted text (e.g., GitHub Mojibake) on the fly, ensuring absolute visual fidelity for legacy text-graphics.
* **Zero-Hallucination Fidelity (Truth Vectors):** * Use of a strict JSON-based documentation system to capture unit behaviors and hardware quirks of the 1990s.
  * This Single Source of Truth (SSOT) automatically generates native MS-DOS test ROMs, JavaScript integration tests, and reference documentation, permanently securing legacy knowledge and preventing AI architectural drift.

## Key Objectives & Target Languages
* **Multi-Language Support:**
  * "Oldschool" Languages: QBasic, Pascal, C.
  * "Modern" Languages: Java, Python, C#, Rust, etc.
* **Iterative Methodology:**
  * Develop incrementally, language by language, feature by feature.
  * Use source code snippets from *Rosetta Code* and official Microsoft DOS demos to rigorously validate the grammars and execution.

## Milestones
* **Milestone 1 (Proof of Concept - Completed):** Perfectly parse and execute the original source code of the game *Nibbles.bas* (Microsoft QBasic DOS 5) using basic text-mode VGA and memory-mapped I/O.
* **Milestone 2 (Advanced Emulation - Active):** Execute graphically and computationally intensive classics like *Gorillas.bas*, *Reversi.bas*, *Sortdemo.bas* and *Mandelbrot.bas*. This requires complex geometric algorithms, rigid scope 3-tier architecture, asynchronous hardware interrupts (`SLEEP`), and pure DOM-decoupled VGA injection.
* **Milestone 3 (JIT Compilation - Next):** Translate the AST directly into JavaScript or WebAssembly to achieve near-native performance for heavy computational loops and strict fixed-length memory blocks.