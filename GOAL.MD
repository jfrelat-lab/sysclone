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
  * Implementation of isolated components: addressable RAM, VGA text mode (bitmap ROM), Keyboard I/O, and system clock.

## Key Objectives & Target Languages
* **Multi-Language Support:**
  * "Oldschool" Languages: QBasic, Pascal, C.
  * "Modern" Languages: Java, Python, C#, Rust, etc.
* **Iterative Methodology:**
  * Develop incrementally, language by language, feature by feature.
  * Use source code snippets from *Rosetta Code* to rigorously validate the grammars and execution of each new language.

## Milestones
* **Milestone 1 (Proof of Concept - QBasic):** Perfectly execute the original source code of the game *Nibbles* (Microsoft QBasic DOS 5) in a fluid and playable manner, including direct memory management (`PEEK/POKE`) and VGA rendering.