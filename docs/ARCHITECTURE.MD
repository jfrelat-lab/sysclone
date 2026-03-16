# Sysclone Engine Architecture

This document outlines the core architectural principles of the **Sysclone** universal execution engine and details the specific implementation choices made for its first target: the QBasic/MS-DOS environment.

## 1. Global Vision: The Universal JIT Implementation

**Sysclone** is designed as a language-agnostic virtual machine. The architecture is split into three decoupled layers:
* **Front-end (Language Specific):** Monadic parsers that transform raw source code into a standardized Abstract Syntax Tree (AST).
* **Middle-end (Virtual CPU):** An asynchronous "Tree-walking" evaluator that treats the AST as a stream of instructions, clocked to prevent browser UI freezing.
* **Back-end (Hardware Abstraction Layer):** A set of virtualized hardware components (VGA, RAM, I/O, Audio) that provide the necessary environment for legacy software to run without modifications.

---

## 2. Legacy MS-DOS Implementation Details

The following architectural choices were made to ensure a "purist" emulation of the QBasic 4.5 / DOS 5.0 environment, scaling from basic text mode to advanced graphics.

### 2.1. The Parser: Monadic Combinators (Line-based)
Rather than using heavy parser generators (ANTLR, PEG.js) or unreadable regular expressions, we opted for custom-built **monadic parser combinators** (`monad.js`).
* **Why?** This allows us to build a modular, composable, and unit-testable grammar (brick by brick).
* **Line-Based Architecture:** QBasic does not use semicolons. Line breaks `\n` are semantic separators. The parser uses an optimized `eos` (End Of Statement) token to cleanly consume line breaks, comments (`'`), and colons (`:`), actively preventing Catastrophic Backtracking (ReDoS) on large legacy files.

### 2.2. The Execution Engine: Generators (`function*`) & Hardware Interrupts
The challenge on the Web is avoiding main thread blocking during infinite loops (`DO...LOOP`) or hardware pauses (`SLEEP`).
* **Architectural Choice:** We use JavaScript Generators (`function*` and `yield*`) instead of Promises (`async/await`).
* **Why?** `async/await` floods the browser's Microtask Queue, destroying the framerate and overloading the Garbage Collector. Generators create an ultra-fast synchronous iterator where each `yield` acts as a clock "Tick". The browser controls the cycles allocated per frame.
* **SYS_DELAY & Hardware Interrupts:** When the CPU hits a blocking instruction like `SLEEP`, `SOUND`, or an interactive read like `INPUT$`, the generator yields a `SYS_DELAY` (or simply yields) to the Orchestrator (`webvm.js`). The Orchestrator safely exits the execution loop, allows the browser to render the frame, and schedules a `setTimeout` or event listener to resume the Virtual CPU seamlessly.

### 2.3. The Video Engine & Dynamic Typography
To emulate the VGA text mode screen (80x25), standard HTML canvas `ctx.fillText()` was rejected.
* **Why?** Anti-aliased vector fonts create artifacts between block characters (CHR$ 219, 220, 223) used for "text-graphics".
* **Architectural Choice:** We implemented an authentic **Hardware Typography Engine**. Rendering uses bitwise operators (`&`, `>>`) to check each pixel of the character grid, pushing directly to a raw `ImageData` buffer via pure Dependency Injection (making the VGA component fully Headless-ready).
* **MS-DOS Print Formatting:** The Evaluator strictly implements the legacy `PRINT` number padding quirk (implicit leading space for positive signs, trailing space for all numbers), ensuring authentic alignment for games like *Reversi*.

### 2.4. Memory and BIOS Data Area (Mocking vs Purism)
Old DOS games use `POKE` to write directly into system RAM (e.g., address `&H41A` to clear the keyboard buffer).
* **Architectural Choice:** We implemented a true **1 MB virtual RAM stick** (`memory.js`) addressable via Segment:Offset.
* **Why?** This guarantees compatibility with low-level BIOS tricks. The architecture uses **Memory-Mapped I/O**: the `Memory` class intercepts writes to vital addresses and drives the virtual peripherals accordingly.

### 2.5. The Environment: Memory Vaults, Flat Scoping, and Types
* **3-Tier Flat Scoping:** Managed by a hierarchical chain of environments: Shared (Global Root), Main (Program execution), and Local (Subroutines). The engine strictly enforces MS-DOS **Flat Scoping**, actively blocking JavaScript's native lexical traversal. Local subroutine variables (`Tier 2`) never bleed into or mutate the Main Module's state, reserving hierarchical resolution exclusively for the Tier 1 Shared Environment.
* **Static Vault:** Subroutines utilize a decoupled `persistentVars` map (`STATIC`) to retain state across calls without leaking into the global tier.
* **Memory Classes & In-Place Mutation:** * The `QArray` class (abstracted into a standalone module) flattens multi-dimensional bounds into a pure 1D mathematical array.
  * The `QFixedString` class implements locked-memory block allocations (`STRING * N`), explicitly designed for O(1) in-place mutations. This prevents object destruction, preserving V8 hidden classes and shielding the Garbage Collector from high-frequency string assignments during Virtual CPU execution.
* **Duck-Typed Deep Cloning:** User-Defined Types (UDTs) utilize an internal deep cloning mechanism during `ASSIGN` and `SWAP` instructions to effectively sever JavaScript reference entanglements, ensuring purist value-type behavior for complex structures.

### 2.6. I/O Encoding & The CP437 Bridge
Modern web browsers fetch text files as UTF-8, which breaks legacy DOS games relying on extended ASCII characters for graphics.
* **Smart Heuristic Decoder:** Sysclone implements a content-sniffing layer (`autoDecodeSource`) that automatically detects whether a loaded file is Raw DOS binary (CP437), modern True Unicode, or corrupted GitHub Mojibake (Windows-1252 read as UTF-8), repairing the latter on the fly while meticulously preserving legacy control bytes (LF, CR, TAB).
* **Architectural Boundary:** The AST and Virtual CPU operate entirely in standard JS Unicode. The strict bidirectional translation to 8-bit Code Page 437 bytes occurs *only* at the Hardware Abstraction Layer boundary (e.g., when the `PRINT` statement sends data to the VGA VRAM), ensuring absolute block fidelity.

### 2.7. Advanced Graphics Engine (VGA/EGA/CGA)
Emulating legacy graphics modes (`SCREEN 7`, `9`, `13`) requires intensive memory manipulation and geometric calculations.
* **Multi-Mode Architecture (Template Method):** To maintain the DRY principle across wildly different hardware, the video routing uses a Strategy pattern delegating to a Template Method hierarchy (`TextModeDriver` and `GraphicsModeDriver`). Complex algorithms (Bresenham, Flood Fill) are shared, while concrete drivers only implement raw memory access primitives.
* **Planar vs Linear Blitting (`GET` / `PUT`):** The engine natively supports dual memory decoding for sprites. It dynamically extracts QBasic's Little-Endian array headers and processes bit-packing either as chunky bytes (Linear VGA Mode 13) or complex separated Bitplanes (EGA Mode 9) seamlessly.
* **Algorithmic Purity (Circles & Paint):** The `PAINT` command utilizes a flat, iterative stack-based Flood Fill algorithm rather than native recursion to prevent Call Stack Overflow. The `CIRCLE` command employs a mathematically purist **4-Connected Midpoint Algorithm**, eradicating Moire pattern gaps (bleeding backgrounds) in concentric animations, while natively supporting MS-DOS's default aspect ratios and undocumented negative inversions.
* **Pixel Aspect Ratio (PAR) Correction:** Legacy DOS resolutions rarely used square pixels (e.g., Mode 9 is 640x350). The `VGA` hardware router dynamically calculates the CSS canvas scaling against a fixed UI baseline (640px). This guarantees perfectly round circles and undistorted native rendering regardless of the active QBasic `SCREEN` mode.
* **Coordinate Projection (`WINDOW`):** The VGA router natively translates logical bounding boxes into physical pixels. It faithfully implements the MS-DOS auto-sorting quirk (normalizing inverted X/Y bounds) and discriminates between Cartesian (`WINDOW`) and Screen (`WINDOW SCREEN`) Y-axis inversion logic.

### 2.8. Keyboard and Audio Engine
* **Anti-Ghosting Keyboard:** The `IO` class implements an authentic 16-byte FIFO BIOS buffer that strictly filters browser `e.repeat` events. This provides input safety against "held-down" keys, preventing fast-paced games from instantly consuming trailing inputs in tight event loops.
* **PC Speaker:** Mapping `SOUND` and `PLAY` commands to the native browser **Web Audio API** (`AudioContext`), powered by a scheduled macro-language parser.