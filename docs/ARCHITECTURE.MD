# Sysclone Engine Architecture

This document outlines the core architectural principles of the **Sysclone** universal execution engine and details the specific implementation choices made for its first target: the QBasic/MS-DOS environment.

## 1. Global Vision: The Universal JIT Implementation

**Sysclone** is designed as a language-agnostic virtual machine. The architecture is strictly split into three decoupled layers:
* **Front-end (Language Specific):** Monadic parsers that transform raw source code into a standardized Abstract Syntax Tree (AST), and Tokenizers for UI syntax highlighting.
* **Middle-end (Virtual CPU):** An asynchronous "Tree-walking" evaluator that treats the AST as a stream of instructions, clocked to prevent browser UI freezing.
* **Back-end (Hardware Abstraction Layer):** A set of virtualized hardware components (VGA, RAM, I/O, Audio) that provide the necessary environment for legacy software to run without modifications.

---

## 2. Core Engine Architecture (Language-Agnostic)

This section details the universal mechanics that power Sysclone, regardless of the language being executed.

### 2.1. The Front-End: Monadic Parser Combinators
Rather than using heavy parser generators (ANTLR, PEG.js) or unreadable regular expressions, we opted for custom-built **monadic parser combinators** (`monad.js`).
* **Why?** This allows us to build a modular, composable, and unit-testable grammar (brick by brick) entirely in pure mathematical functions. It natively supports dynamic keyword dictionaries and lazy evaluation for recursive grammar trees.

### 2.2. The Front-End: UI Tokenization & Strategy Pattern
To provide real-time syntax highlighting without coupling the Web IDE to a specific language, the engine strictly separates AST compilation from visual presentation.
* **Architectural Choice:** We implemented a **Strategy Pattern** via a `BaseTokenizer` abstract class. The UI relies entirely on a universal semantic contract (`TokenTypes` like `KEYWORD`, `BUILTIN`, `NUMBER`), completely ignoring how the underlying text is parsed.
* **Declarative Mapping (DRY):** Language-specific implementations simply inject the compiler's pure monadic lexers into an array-based pipeline. This guarantees zero-dependency, lightning-fast syntax highlighting that evolves automatically alongside the language grammar.

### 2.3. The Middle-End: Generators (`function*`) & The Event Loop
The challenge on the Web is avoiding main thread blocking during infinite loops or hardware pauses.
* **Architectural Choice:** We use JavaScript Generators (`function*` and `yield*`) instead of Promises (`async/await`).
* **Why?** `async/await` floods the browser's Microtask Queue, destroying the framerate and overloading the Garbage Collector. Generators create an ultra-fast synchronous iterator where each `yield` acts as a clock "Tick". The browser controls the cycles allocated per frame.
* **Hardware Interrupts:** When the CPU hits a blocking instruction, the generator yields a `SYS_DELAY`. The Orchestrator safely exits the execution loop, allows the browser to render the frame, and schedules the resumption of the Virtual CPU seamlessly.

### 2.4. The Back-End: Hardware Abstraction Layer (HAL)
The system interacts with virtualized hardware via strict Dependency Injection. Memory, Video, and I/O controllers act as headless modules, meaning the entire Sysclone engine could run in a Node.js terminal or a Web Worker without any DOM dependencies.

---

## 3. Target Implementation 1: QBasic & MS-DOS

The following architectural choices were made to ensure a "purist" emulation of the QBasic 4.5 / DOS 5.0 environment, scaling from basic text mode to advanced graphics.

### 3.1. Parsing QBasic: Line-Based Syntax
QBasic does not use semicolons. Line breaks `\n` are semantic separators. The parser uses an optimized `eos` (End Of Statement) token to cleanly consume line breaks, comments (`'`), and colons (`:`), actively preventing Catastrophic Backtracking (ReDoS) on large legacy files.

### 3.2. Execution: Scoping, Vaults, and Native Types
* **3-Tier Flat Scoping:** Managed by a hierarchical chain of environments: Shared (Global Root), Main (Program execution), and Local (Subroutines). The engine strictly enforces MS-DOS **Flat Scoping**, actively blocking JavaScript's native lexical traversal.
* **Static Vault:** Subroutines utilize a decoupled `persistentVars` map (`STATIC`) to retain state across calls without leaking into the global tier.
* **Memory Aliasing & Variable Vaults:** MS-DOS allows accessing a typed variable (e.g., `DIM Name AS STRING`) with or without its type suffix (`Name$`). To prevent memory desynchronization, Sysclone internalizes a `VariableVault` class. This smart map intercepts all `DIM`, `STATIC`, and `SHARED` declarations to register an internal alias. The Virtual CPU traverses the 3-Tier scope strictly using base names, while the vault seamlessly routes reads and writes to the correct suffixed memory slot, preserving strict MS-DOS aliasing behavior without polluting the engine's core logic.
* **Memory Classes & In-Place Mutation:** * The `QArray` class flattens multi-dimensional bounds into a pure 1D mathematical array.
  * The `QFixedString` class implements locked-memory block allocations (`STRING * N`), explicitly designed for O(1) in-place mutations to shield the Garbage Collector.
* **Duck-Typed Deep Cloning:** User-Defined Types (UDTs) utilize an internal deep cloning mechanism during `ASSIGN` and `SWAP` instructions to ensure purist value-type behavior.

### 3.3. Memory and BIOS Data Area
Old DOS games use `POKE` to write directly into system RAM.
* **Architectural Choice:** We implemented a true **1 MB virtual RAM stick** (`memory.js`) addressable via Segment:Offset.
* **Memory-Mapped I/O:** The architecture intercepts writes to vital addresses (e.g., `&H41A` for the keyboard buffer) and drives the virtual peripherals accordingly.

### 3.4. I/O Encoding & The CP437 Bridge
* **Smart Heuristic Decoder:** Sysclone automatically detects whether a loaded file is Raw DOS binary (CP437) or corrupted GitHub Mojibake (Windows-1252), repairing the latter on the fly.
* **Architectural Boundary:** The AST and Virtual CPU operate entirely in standard JS Unicode. The strict translation to 8-bit CP437 bytes occurs *only* at the Hardware boundary (VGA VRAM), ensuring absolute block character fidelity.

### 3.5. Video Engine: Typography & Advanced Graphics
* **Hardware Typography Engine:** To emulate the VGA text mode (80x25), standard HTML canvas `fillText` was rejected to avoid anti-aliasing artifacts. Rendering uses bitwise operators to push directly to a raw `ImageData` buffer.
* **Multi-Mode Architecture:** The video routing uses a Strategy pattern delegating to a Template Method hierarchy (`TextModeDriver` and `GraphicsModeDriver`).
* **Algorithmic Purity:** The `PAINT` command utilizes a flat, stack-based Flood Fill algorithm to prevent Call Stack Overflow. The `CIRCLE` command employs a purist **4-Connected Midpoint Algorithm**, eradicating Moire pattern gaps.
* **Pixel Aspect Ratio (PAR):** The VGA router dynamically calculates the CSS canvas scaling against a fixed UI baseline, guaranteeing perfectly round circles regardless of the active QBasic `SCREEN` mode (e.g., Mode 9 at 640x350).
* **Coordinate Projection:** The engine faithfully implements Cartesian (`WINDOW`) vs Screen (`WINDOW SCREEN`) inversion logic and the MS-DOS auto-sorting quirk for bounding boxes.

### 3.6. Keyboard and Audio Engine
* **Anti-Ghosting Keyboard:** Implements an authentic 16-byte FIFO BIOS buffer that strictly filters browser `e.repeat` events, preventing fast-paced games from consuming trailing inputs.
* **PC Speaker:** Maps `SOUND` and `PLAY` commands to the native **Web Audio API** via a scheduled macro-language parser.

## 4. WebVM Shell & Tooling Architecture

### 4.1. URL Hash as State (Deep Linking)
To maintain a purist, backend-free architecture, the WebVM uses the browser's `window.location.hash` for the application state. Changing the hash automatically triggers the Virtual CPU to halt, flush VRAM, and load the corresponding interpreted program, enabling instant stateless sharing.

### 4.2. Zero-Dependency Media Encoding
Screen capturing and GIF recording (at 24 FPS to catch MS-DOS stroboscopic XOR sprites) are offloaded to a dedicated Web Worker. This ensures the heavy LZW compression algorithms do not block the Virtual CPU's `requestAnimationFrame` loop.

### 4.3. Truth-Driven Validation Pipeline (Zero Hallucination)
To guarantee absolute historical fidelity and prevent AI Agent hallucinations during development, Sysclone employs a "Truth Vectors" pipeline:
* **JSON Vectors:** Atomic definitions of legacy behaviors (inputs, outputs, memory states).
* **Code Generation:** A custom tool (`build_truth.js`) parses these vectors to simultaneously generate:
  1. A native QBasic auto-test framework (`compat.bas`) to verify behavior on real MS-DOS hardware.
  2. The JavaScript integration test suites for the JIT engine.
  3. The `QBASIC_REFERENCE.MD` documentation.

## 5. Multi-Language & JIT Evolution (Provisional Architecture)

> **⚠️ PROVISIONAL DRAFT:** This section details the architectural refactoring required to transition Sysclone from a monolithic QBasic interpreter to a language-agnostic execution engine (Milestone 2.5). This is the prerequisite for Turbo Pascal integration and future WebAssembly JIT compilation.

To support fundamentally different languages (e.g., QBasic's flat scoping vs. Pascal's lexical scoping and pointers) without creating a monolithic, unmaintainable core, the engine is strictly decoupled into an agnostic runner and language-specific plugins.

### 5.1. The Virtual CPU & The Visitor Pattern
The current `Evaluator` is refactored to separate the hardware execution mechanics from the language syntax rules.

* **The VirtualCPU (VCPU):** An entirely language-agnostic generator engine. It manages the fundamental execution lifecycle:
    * **The Tick Engine:** Yielding execution to the browser's `requestAnimationFrame` to prevent UI freezing.
    * **Hardware Interrupts:** Catching and processing `SYS_DELAY` signals (for `SLEEP`, `SOUND`, or asynchronous I/O).
    * **Control Flow Bubbling:** Handling low-level instruction pointer jumps (like `GOTO` or `EXIT`) across block boundaries.
* **The Interpreter Visitors (Inversion of Control):** The massive `switch(node.type)` statement is extracted into dedicated Visitor classes.
    * `QBasicInterpreterVisitor`: Contains the specific evaluation logic for MS-DOS quirks (e.g., `PRINT USING`, `PAINT`, `SWAP`).
    * `PascalInterpreterVisitor`: Contains the evaluation logic for Turbo Pascal semantics (e.g., `WRITELN`, `NEW`, `DISPOSE`).
* **JIT Readiness:** By isolating the node traversal into Visitors, Milestone 3 will simply require injecting a `WasmCompilerVisitor` that outputs binary opcodes instead of mutating state, leaving the `VirtualCPU` completely untouched.

### 5.2. Memory & State Decoupling (The Environment Split)
QBasic and Pascal have radically different memory management philosophies. A single `Environment` class would result in severe code bloat. We use inheritance to isolate these paradigms:

* **`BaseEnvironment`:** The abstract foundation. It holds a basic symbol table and the critical reference to the Hardware Abstraction Layer's `Memory` (the 1MB virtual RAM stick).
* **`QBasicEnvironment`:** Inherits from Base. Strictly implements:
    * **3-Tier Flat Scoping:** Forcing Global/Main/Local isolation and actively preventing JS lexical traversal.
    * **The VariableVault:** Handling the implicit memory aliasing between explicitly typed variables (e.g., `DIM A AS STRING`) and their suffixed counterparts (`A$`).
    * **Implicit Typing:** Handling the `DEFINT A-Z` first-letter routing rules.
* **`PascalEnvironment`:** Inherits from Base. Strictly implements:
    * **Lexical Scoping:** Native hierarchical traversal (`this.parent`) to support nested procedures.
    * **The Heap Allocator:** A memory manager that maps Turbo Pascal typed pointers (`^`) directly to physical addresses within the HAL's `Uint8Array` RAM, allowing authentic pointer arithmetic and legacy memory hacks.

### 5.3. WebVM Bootstrapping & Strategy Injection
The WebVM Orchestrator (`webvm.js`) acts as the dependency injector. Upon loading a file, it checks the extension (`.bas` vs `.pas`) and dynamically assembles the execution pipeline:
1.  **Frontend:** Injects the correct Monadic Parser and UI `Tokenizer` (`QBasicTokenizer` vs `PascalTokenizer`).
2.  **State:** Instantiates the correct environment (`QBasicEnvironment` vs `PascalEnvironment`).
3.  **Middle-end:** Injects the corresponding `Visitor` into the agnostic `VirtualCPU`.