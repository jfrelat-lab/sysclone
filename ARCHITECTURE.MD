# Sysclone Engine Architecture

This document outlines the core architectural principles of the **Sysclone** universal execution engine and details the specific implementation choices made for its first target: the QBasic/MS-DOS environment.

## 1. Global Vision: The Universal JIT Implementation

**Sysclone** is designed as a language-agnostic virtual machine. The architecture is split into three decoupled layers:
* **Front-end (Language Specific):** Monadic parsers that transform raw source code into a standardized Abstract Syntax Tree (AST).
* **Middle-end (Virtual CPU):** An asynchronous "Tree-walking" evaluator that treats the AST as a stream of instructions, clocked to prevent browser UI freezing.
* **Back-end (Hardware Abstraction Layer):** A set of virtualized hardware components (VGA, RAM, I/O) that provide the necessary environment for legacy software to run without modifications.



---

## 2. Milestone 1: QBasic & MS-DOS Implementation Details

The following architectural choices were made to ensure a "purist" emulation of the QBasic 4.5 / DOS 5.0 environment.

### 2.1. The Parser: Monadic Combinators (Line-based)
Rather than using heavy parser generators (ANTLR, PEG.js) or unreadable regular expressions, we opted for custom-built **monadic parser combinators** (`monad.js`).
* **Why?** This allows us to build a modular, composable, and unit-testable grammar (brick by brick).
* **Line-Based Architecture:** QBasic does not use semicolons. Line breaks `\n` are semantic separators. The parser uses a strict `eos` (End Of Statement) token to cleanly consume line breaks, comments (`'`), and colons (`:`), preventing accidental statement merging.

### 2.2. The Execution Engine: Generators (`function*`) vs Async/Await
The challenge on the Web is avoiding main thread blocking during infinite loops (`DO...LOOP`).
* **Architectural Choice:** We use JavaScript Generators (`function*` and `yield*`) instead of Promises (`async/await`).
* **Why?** `async/await` floods the browser's Microtask Queue, destroying the framerate and overloading the Garbage Collector. Generators create an ultra-fast synchronous iterator where each `yield` acts as a clock "Tick". The browser controls the cycles allocated per frame (e.g., 5000 cycles / 60 FPS), creating a true **Virtual Processor (CPU Runner)** with adjustable speed.

### 2.3. The Video Engine: VRAM Access and DOSBox ROM
To emulate the VGA text mode screen (80x25), standard HTML canvas `ctx.fillText()` was rejected.
* **Why?** Anti-aliased vector fonts create artifacts between block characters (CHR$ 219, 220, 223) used for "text-graphics" like the Nibbles snake.
* **Architectural Choice:** 1.  We use the authentic **DOSBox binary ROM** (Code Page 437) containing the 8x16 bitmapped definition of each character.
    2.  Rendering uses bitwise operators (`&`, `>>`) to check each pixel of the character.
    3.  The output is pushed to a raw `ImageData` buffer for pixel-perfect rendering.

### 2.4. Memory and BIOS Data Area (Mocking vs Purism)
Old DOS games use `POKE` to write directly into system RAM (e.g., address `&H41A` to clear the keyboard buffer).
* **Architectural Choice:** We implemented a true **1 MB virtual RAM stick** (`memory.js`) addressable via Segment:Offset.
* **Why?** This guarantees compatibility with low-level BIOS tricks. The architecture uses **Memory-Mapped I/O**: the `Memory` class intercepts writes to vital addresses and drives the virtual peripherals accordingly.

### 2.5. The Environment: Scopes and Arrays (QArray)
* **Scope:** Managed by a chain of environments (Parent -> Child) to simulate global scope and local variables of subroutines.
* **Arrays:** QBasic allows arbitrary bounds (e.g., `DIM a(10 TO 50)`). The `QArray` class flattens these into a pure 1D mathematical array while natively handling index offsets.