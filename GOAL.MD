# Sysclone Project: Universal JIT / Web Interpreter (JS/WASM)

## Global Vision
The primary objective is to create a universal execution engine running directly in the browser (via JavaScript and WebAssembly). This engine must be capable of executing programs written in a multitude of historical and modern programming languages, *without any modification* to the original source code, and with high performance.

## Architecture and Core Principles
* **Frontend (Lexical and Syntactic Analysis):** * Systematic use of **monadic parsers** implemented in pure JavaScript. 
  * This allows for building composable, modular, and unit-testable grammars (brick by brick) tailored to handle the specificities of each target language (e.g., line-based for QBasic, bracket-based for C/Java).
* **Backend (Asynchronous Execution Engine):** * Implementation of a **Virtual Processor (CPU Runner)** based on JS Generators (`function*` / `yield*`).
  * This model enables execution paced by instruction cycles (Ticks), guaranteeing a non-blocking loop for the browser (anti-freeze) and a perfectly controlled framerate (`requestAnimationFrame`).
  * *JIT Evolution:* Ultimately, translating the AST/IR into WebAssembly instructions for native performance.
* **Hardware Abstraction Layer (HAL):** * Purist emulation of original hardware subsystems using modern Web APIs (Canvas, Web Audio).
  * Implementation of isolated components: addressable RAM, VGA/CGA/EGA rendering (bitmap ROM, hardware palettes), Keyboard I/O, and system clock.
  * **Robust I/O Translation**: A strict CP437 to Unicode translation layer to allow execution of modern UTF-8 text files as if they were running on a 1990s MS-DOS machine.

## Key Objectives & Target Languages
* **Multi-Language Support:**
  * "Oldschool" Languages: QBasic, Pascal, C.
  * "Modern" Languages: Java, Python, C#, Rust, etc.
* **Iterative Methodology:**
  * Develop incrementally, language by language, feature by feature.
  * Use source code snippets from *Rosetta Code* and official Microsoft DOS demos to rigorously validate the grammars and execution.

## Milestones
* **Milestone 1 (Proof of Concept - Completed):** Perfectly parse and execute the original source code of the game *Nibbles.bas* (Microsoft QBasic DOS 5) using basic text-mode VGA and memory-mapped I/O.
* **Milestone 2 (Advanced Emulation - Current):** Execute graphically and computationally intensive classics like *Gorillas.bas* and *Mandelbrot (Rosetta Code)*. This requires EGA/VGA graphic primitives (`PSET`, `PAINT`), sprite blitting (`GET`/`PUT`), PC Speaker audio (`PLAY`), and robust exception handling.
* **Milestone 3 (JIT Compilation - Planned):** Translate the AST directly into JavaScript or WebAssembly to achieve near-native performance for heavy computational loops.