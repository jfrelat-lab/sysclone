# Roadmap: Sysclone - Milestone 1 (QBasic / Nibbles)

## Phase 1: Foundation and Tooling (Monadic Parsers)
*The objective is to implement the syntactic analysis engine in pure JavaScript.*

- [x] **1.1. Implement the core Monadic Parser:**
  - [x] Create the base structure (`Parser(state) -> { result, rest, error }`).
  - [x] Implement fundamental combinators: `sequence`, `sequenceObj`, `choice`, `many`, `optional`, `lazy`.
  - [x] Implement transformation combinators: `map` (for AST generation).
  - [x] Optimize token parsers (using strict `str` matching over `regex` for static symbols/keywords to boost performance).
- [x] **1.2. Create base Lexers (Primitives):**
  - [x] **Line-Based Architecture:** Create the strict `eos` (End Of Statement) token to rigorously handle line breaks `\n`, colons `:`, and empty lines.
  - [x] Horizontal spaces (`ws`, `optWs`) and comments (ignored until line break).
  - [x] Numbers (integers and floats, e.g., `100`, `.5`).
  - [x] Strings (`"..."`).
  - [x] Case-insensitive identifiers (variables, function names, including type suffixes like `$`, `%`).
- [x] **1.3. Custom Test Framework (Quality Harness):**
  - [x] Implement test orchestrator with performance KPIs (execution time per test) and global pass/fail summaries.
  - [x] Add V8 stack trace extraction to accurately map syntax/parse errors to specific source files during CI.

## Phase 2: QBasic Grammar and AST Generation
*Parse the Nibbles source code to build a typed Abstract Syntax Tree (AST).*

- [x] **2.1. Parse Declarations and Types:**
  - [x] Handle `DEFINT A-Z`.
  - [x] Handle structure creation with `TYPE ... END TYPE`.
  - [x] Handle array and global variable declarations `DIM [SHARED] array(x TO y) AS type`.
  - [x] Handle constants `CONST name = value`.
- [x] **2.2. Parse Control Flow:**
  - [x] Conditions: `IF ... THEN ... ELSE ... END IF`.
  - [x] Loops: `FOR ... TO ... STEP ... NEXT`, `DO ... LOOP UNTIL`.
  - [x] *To do (if necessary)*: `WHILE ... WEND`, `SELECT CASE ... END SELECT`.
- [x] **2.3. Parse Subroutines and Functions:**
  - [x] `DECLARE SUB / FUNCTION`.
  - [x] Definitions `SUB name (args) ... END SUB`.
- [x] **2.4. Parse Operators and Expressions:**
  - [x] Mathematical operators (`+`, `-`, `*`, `/`, `MOD`, `INT()`).
  - [x] Logical operators (`AND`, `OR`, `NOT`, `>`, `<`, `<>`).
  - [x] Complex access: array calls or type properties (`arena(r, c).sister`).

## Phase 3: Runtime Environment
*Create the state machine (Virtual Memory) that will store the program's state.*

- [x] **3.1. Memory and Scope Management:**
  - [x] Create a chained `Environment` manager to store global and local variables.
  - [x] **[CRITICAL]** Enforce MS-DOS "Flat Scoping" to prevent JS-style lexical bleeding, isolating the Main Module strictly from Subroutine scopes by restricting hierarchical traversal to the Tier 1 Global Environment.  
- [x] **3.2. QBasic Array Abstraction:**
  - [x] Implement the `QArray` class to flatten multi-dimensional arrays with custom bounds (e.g., `1 TO 50`).

## Phase 4: Web Artifact Emulation (DOS/VGA System)
*Bridge the gap between specific QBasic DOS commands and browser APIs.*

- [x] **4.1. VGA Text Mode Video Engine (80x25):**
  - [x] Implement *Pixel-Perfect* rendering via bitwise manipulation of an `ImageData` buffer on a `<canvas>`.
  - [x] Use the authentic DOSBox bitmapped ROM (Code Page 437) for absolute block fidelity (CHR$ 219, 220, 223).
  - [x] Wire commands: `COLOR` (text, background), `CLS`, `LOCATE`, `PRINT`.
- [x] **4.2. I/O Engine (Keyboard & Time):**
  - [x] Wire `INKEY$` to JavaScript `keydown`/`keyup` events with a FIFO keystroke buffer.
  - [x] Wire `TIMER` to local time (seconds since midnight).
  - [x] Add interactive console commands like `LINE INPUT`.
- [ ] **4.3. Basic Audio Engine (PC Speaker):**
  - [ ] Wire the `PLAY` command (e.g., `"MBT160O1L8CDEDCDL4ECC"`) using the Web Audio API (Macro Music Language).
- [x] **4.4. Motherboard and BIOS (Segmented Memory):**
  - [x] Purist wiring of a 1MB RAM space (Segment:Offset) for `DEF SEG`, `PEEK`, and `POKE`.
  - [x] Simulation of the BIOS Data Area (Equipment Word) and implementation of *Memory-Mapped I/O* (keyboard buffer flush hack via address `&H41A`).

## Phase 5: Dynamic Evaluation (Virtual CPU)
*Connect the AST to the hardware via a virtual processor.*

- [x] **5.1. Generator-Based Evaluation Engine (Anti-Freeze):**
  - [x] Transform the Evaluator into a synchronous iterator (`function*` and `yield*`) to avoid Promise (`async/await`) hell and guarantee performance.
- [x] **5.2. Parse Hardware Instructions:**
  - [x] Add instruction parsers (`statements.js`) for hardware: `CLS`, `PRINT`, `LOCATE`, `COLOR`, `POKE`, `ASSIGN`.
- [x] **5.3. CPU Loop (Runner):**
  - [x] Implement "Instruction Cycle" (Ticks) pacing limited by `requestAnimationFrame` (e.g., 5000 cycles / frame) allowing total control over execution speed.

## Phase 6: Advanced QBasic Features (Pre-Nibbles)
*Implement complex structures necessary for game logic.*

- [x] **6.1. Arrays and Types (UDT) at Runtime:**
  - [x] Teach the Evaluator to handle `TYPE_DECL` nodes (register the structure's "blueprint").
  - [x] Teach the Evaluator to instantiate `DIM` (and dynamically resize via `REDIM`), handling both array structures and single scalar variable declarations (`DIM x AS type`).
  - [x] Implement deep cloning for UDTs to prevent JavaScript object reference mutation during `SWAP` and `ASSIGN`.
- [x] **6.2. Subroutines (`SUB` and `FUNCTION`):**
  - [x] Handle `SUB` definition registration.
  - [x] Implement the `CALL` mechanism: creating a sub-scope (new memory "bubble") and passing arguments.
  - [x] **[CRITICAL]** Implement Pass-by-Reference for arguments.
  - [x] **[CRITICAL]** Handle `FUNCTION` return values (assignment to the function's name).
- [x] **6.3. Jumps and Advanced Control Flow:**
  - [x] Implement `GOSUB ... RETURN` (heavily used in Nibbles for screen/music mini-routines).
  - [x] **[CRITICAL]** Refactor AST to allow Single-Line IFs (`IF ... THEN statement` without `END IF`).
  - [x] **[CRITICAL]** Add `WHILE ... WEND` loop structure.
  - [x] Add support for conditions at the beginning of DO loops (`DO WHILE/UNTIL cond ... LOOP`).
- [ ] **6.4. Missing Operators and Literals:**
  - [x] Add integer division `\` with operand rounding, and `MOD` operator.
  - [x] Add logical operators `AND`, `OR`, `NOT`.
  - [ ] Add exponentiation `^` and bitwise operators `XOR`, `EQV`, `IMP`.
  - [ ] Add support for octal format (`&O`) and scientific notation (`E`, `D`).

## Phase 7: Trial by Fire - Nibbles.bas (Update)
*The final boss: Assemble everything to run the original game, correcting critical architectural flaws.*

- [x] **7.1. Source File Integration:**
  - [x] Fetch text loading of the original `NIBBLES.BAS` file.
  - [x] Full end-to-to parsing (requires prior patching of the `eos` regex against ReDoS).
- [ ] **7.2. Debugging and Structural Corrections:**
  - [ ] Scope Correction: Isolate `LABEL` tags by scope (Main vs Sub/Function) in `evaluator.js` to avoid collisions.
  - [x] Memory-Mapped VRAM: Link `POKE` instructions from the `&HB800` segment (Memory) to `VGA` engine cells.
- [x] **7.3. Engine Tweaks (Pre-JIT):**
  - [x] VGA Optimization (Memory): Implement rendering via `Uint32Array` for fast buffer manipulation and pure Dependency Injection (DOM decoupling).
  - [ ] VGA Optimization (CPU): Implement a "Dirty Rectangles" system to update only modified areas and secure framerate.
  - [x] CPU Lightening: Optimize Generator Tick frequency (per-statement instead of per-node) and implement Hybrid Runner (Retro/Turbo UI).
- [x] **7.4. Play Nibbles!**

## Phase 7.5: Architecture Refactoring (The Web Shell)
*Decouple the Virtual Machine core from the Web interface to ensure a clean architecture.*

- [x] **7.5.1. Entry Point Renaming:**
  - [x] Rename `main.js` to `webvm.js` to explicitly designate it as the browser orchestrator.
- [x] **7.5.2. UI Logic Extraction:**
  - [x] Create `src/ui.js` to encapsulate all DOM manipulations (Sliders, Checkboxes, Event Listeners).
  - [x] Establish a clean event-driven communication layer between `ui.js` and `webvm.js`.

## Phase 7.6: The WebVM Developer Experience (DX)
*Finalize the user experience with dynamic loading, emulator-standard controls, and source inspection.*

- [x] **7.6.1. Dynamic ROM Loader & Build System:**
  - [x] Implement VM reset capabilities (Clear RAM, Reset Environment, Cancel AnimationFrame) in `webvm.js`.
  - [x] Create `tools/build_catalog.js` with private draft filtering to statically generate the ROM index.
  - [x] Wire the `#rom-selector` to fetch the catalog and execute new `.bas` files on the fly.
- [x] **7.6.2. Fullscreen & Pixel-Perfect Scaling:**
  - [x] Implement the HTML5 Fullscreen API.
  - [x] Add CSS logic to maintain the original 4:3 aspect ratio and `image-rendering: pixelated` during viewport resizes.
- [x] **7.6.3. Split-Screen Pro IDE Layout:**
  - [x] Redesign the interface into a modern workspace (Editor on the left, Execution on the right).
  - [x] Display the raw, original `.bas` source code currently being executed.
  - [x] Upgrade the CPU speed visualizer to reflect realistic retro hardware frequencies (MHz).
- [x] **7.6.4. VM Execution Controls (State Management):**
  - [x] Implement a `Play / Pause` toggle to freeze/resume the Virtual CPU `requestAnimationFrame` loop.
  - [x] Implement `Restart` (halt execution, clear VRAM, and reboot the current ROM).
- [x] **7.6.5. Canvas Screenshot Tool:**
  - [x] Add a "Screenshot" button using native `canvas.toBlob`.
  - [x] Ensure the output is a clean, lossless PNG preserving the DOS pixel ratio.
- [X] **7.6.6. Native Syntax Highlighting (Dog Fooding):**
  - [X] Refactor `lexers.js` to explicitly yield `COMMENT` and `WHITESPACE` tokens instead of silently swallowing them in `eos`. (Included strict regex exclusion of `\r\n` in comments to fix UI line break rendering).
  - [X] Build a lightweight `Tokenizer` that processes the loaded source code through our Monadic Lexers.
  - [X] Render the token stream as colored HTML in the UI without external dependencies.
- [ ] **7.6.7. Source File Injection:**
  - [ ] Allow users to import or drag-and-drop local `.BAS` files directly into the WebVM for instant execution.
- [ ] **7.6.8. Execution Context Tracking:**
  - [ ] Implement a visual tracker in the IDE that highlights the exact line of code currently being executed when the VM is paused.

---

# Roadmap: Sysclone - Milestone 2 (Gorillas & Mandelbrot)

## Phase 8: I/O Encoding & Robust Loading
*Ensure safe and authentic loading of legacy source files.*

- [x] **8.1. CP437 / Unicode Translation Layer:**
  - [x] Create a bidirectional mapping table (`toCP437` / `fromCP437`).
  - [x] Update `main.js` to load standard UTF-8 raw files and transpile them into CP437 bytes, ensuring rigorous preservation of legacy control bytes.
  - [x] Implement debugging and CLI helpers (`convert_bas.js`) for legacy file restoration.

## Phase 9: Advanced QBasic Semantics (Gorillas Prep)
*Implement complex language features required by advanced Microsoft demos.*

- [x] **9.1. Static Data Structures:**
  - [x] Implement `DATA`, `READ`, and `RESTORE` with a global data pointer in the `Environment`.
  - [x] Handle unquoted strings and empty entries in `DATA`.
- [ ] **9.2. Exception Handling:**
  - [ ] Implement `ON ERROR GOTO`, `RESUME`, and `RESUME NEXT` to catch runtime hardware/software faults.
- [x] **9.3. Implicit Typing & Macros:**
  - [x] Support `DEFINT`, `DEFSNG`, etc., for default variable typing.
  - [x] Parse and evaluate single-line macros: `DEF FNname(args) = expr`.
  - [x] Support multiple `CONST` declarations and `STATIC` subroutine scoping.
  - [x] Support fixed-length string allocation (`AS STRING * N`).
  - [x] Support implicit function calls strictly by base name (without type suffix).
  - [x] Implement memory aliasing (`VariableVault`) to natively link explicitly typed variables (e.g., `AS STRING`) to their MS-DOS suffixed counterparts (`$`).
  - [x] Support empty parentheses `()` in array declarations for dynamic or shared arrays.
  - [x] Unify AST generation between `DIM`/`SHARED` statements and Subroutine parameter lists.
- [x] **9.4. Math, Strings & Built-ins:**
  - [x] Abstract all pure native functions into a `builtins.js` standard library.
  - [x] Implement strict `PRINT USING` formatting engine (variable-length string interception `&` and decimal precision `###.###`).
  - [x] Implement math: `INT`, `FIX`, `ABS`, `SQR`, `RND`, `SIN`, `COS`, `TAN`, `ATN`, `EXP`, `LOG`, `CINT`.
  - [x] Implement strings: `CHR$`, `ASC`, `STR$`, `HEX$`, `VAL` (including Hex `&H` and Octal `&O` prefixes), `LEN`, `MID$`, `LEFT$`, `RIGHT$`, `UCASE$`, `LTRIM$`, `RTRIM$`, `INSTR`, `STRING$`, `SPC`.
  - [x] Add memory/variable utilities: `SWAP`, `ERASE`.
  - [x] Add hardware intercepts: `TAB`, `INPUT$`.
- [ ] **9.5. The "Truth Vector" Compatibility Framework:**
  - [ ] Design a language-agnostic format (e.g., JSON/YAML) to strictly document QBasic/MS-DOS quirks and edge cases (the "Truth Vectors").
  - [ ] Build a generator that compiles these vectors into a native `.BAS` self-testing suite, runnable in DOSBox to prove hardware-accurate behavior.
  - [ ] Build a companion generator that translates these verified vectors into JavaScript unit tests for the Sysclone engine.
  - [ ] Generate comprehensive Markdown documentation automatically from the Truth Vectors to serve as a definitive guide to QBasic behavior.

## Phase 10: Advanced Graphics Engine (Gorillas & Mandelbrot)
*Expand the engine capabilities to support computationally and graphically intensive classics.*

- [ ] **10.1. Viewports & Coordinate Systems:**
  - [x] Support `WINDOW` to map logical coordinates to physical screen pixels natively in the VGA router.
  - [x] Support `STEP` relative coordinate tracking (Graphic Cursor) across all geometry primitives.
  - [ ] Support `VIEW PRINT` to restrict text rendering and scrolling to specific screen rows.
- [ ] **10.2. Palettes & Screen Modes:**
  - [x] Implement generic `setPalette` and default hardware palettes (CGA, EGA, MCGA/VGA).
  - [x] Implement high-resolution simplified `SCREEN 9` (EGA 640x350), `SCREEN 12` (VGA 640x480), alongside `SCREEN 13` (VGA 320x200).
  - [x] Load mode-specific, dynamic hardware typography (DOSBox 8x8 font for VGA, authentic 8x14 font for EGA block alignment).
  - [ ] Implement elegant, dynamic viewport resizing and CSS scaling to seamlessly transition between native hardware resolutions (e.g., SCREEN 0 Text Mode, SCREEN 12 VGA 640x480, SCREEN 13 VGA 320x200) without breaking the DOM layout or pixel aspect ratio.
  - [ ] Add `PALETTE` and `PALETTE USING` dynamic mapping support.
- [ ] **10.3. Geometry Primitives (SCREEN 7, 8, 9, 13):**
- [x] Implement `PSET`, `PRESET`, and `POINT` (Pixel Write/Read).
  - [x] Add geometry rendering: `LINE` (Bresenham, Box, Box Fill), including relative origin support `LINE - (x, y)`.
  - [x] Support `STEP` (Relative coordinates) dynamically across all geometric primitives.
  - [x] Implement advanced `CIRCLE` logic: accurately emulating QBasic's default screen aspect ratios, undocumented negative aspect inversions, arc drawing, and 4-connected Midpoint anti-aliasing to prevent Moire holes in concentric loops.
  - [x] Add algorithmic drawing: `PAINT` (Iterative Stack-based Flood Fill algorithm).
- [ ] **10.4. Hardware Blitting (`GET` / `PUT`):**
  - [x] Emulate legacy QBasic sprite array formats (Little-Endian Header + Pixel data).
  - [x] Implement generic `GET` and `PUT` with bitwise operations (`PSET`, `XOR`, `AND`, `OR`, `PRESET`).
  - [x] Implement intelligent formatting logic: processing EGA Planar bit-packing (Bitplanes) vs VGA Linear chunk packing seamlessly based on the active hardware driver.

## Phase 11: Hardware Interrupts & Advanced Input
- [x] **11.1. Advanced Keyboard Controller:**
  - [x] Upgrade state tracking with a strict 16-byte FIFO buffer.
  - [x] Implement deep anti-ghosting safeties (filtering `e.repeat` held-down keys) to prevent input flooding and game logic corruption (e.g., Gorillas 0-velocity bugs).
- [ ] **11.2. Time & Audio Engine:**
  - [x] Wire `SLEEP` and `SOUND` to trigger a `SYS_DELAY` hardware interrupt, yielding execution control asynchronously to the Orchestrator without freezing the browser UI.
  - [x] Implement preliminary `BEEP` instruction.
  - [ ] Wire the full `PLAY` command to the Web Audio API (`AudioContext`).

## Phase 12: The Grand Playtest
- [x] **12.1. Rosetta Code Mandelbrot:**
  - [x] Execute math-heavy visual rendering (`WINDOW`, `PSET`, MCGA).
- [x] **12.2. Gorillas.bas:**
  - [x] Full execution (projectile math, explosive `PAINT` rendering, `XOR` sprite blitting, sound effects).
- [x] **12.3. SortDemo.bas & Reversi.bas:**
  - [x] 100% Parsing achieved.
  - [x] Full execution of board logic (Reversi) and preliminary sorting algorithms (SortDemo).

---

# Roadmap: Sysclone - Milestone 3 (JIT Compilation)

## Phase 13: JIT Evolution and Advanced Optimizations
*Transform the interpreter into a true Just-In-Time compiler to fulfill the project's vision.*

- [ ] **13.1. Strict Memory Typing:**
  - [ ] Replace standard JS arrays in `QArray` with *Typed Arrays* (`Int16Array`, `Float32Array`) based on the defined QBasic type.
- [ ] **13.2. AST to JS Compilation (Level 1 JIT):**
  - [ ] Create an AST visitor that generates pure JavaScript code instead of evaluating it dynamically.
- [ ] **13.3. WebAssembly Compilation (Level 2 JIT):**
  - [ ] Translate the intermediate code (IR) into WASM binary for near-native performance.

---

# Roadmap: Sysclone - Milestone 4 (Headless & CLI)

## Phase 14: Headless Execution (Node.js Integration)
*Bring the Sysclone engine to the backend, allowing QBasic scripts to be executed or compiled as standalone CLI applications.*

- [ ] **14.1. Core CLI Orchestrator:**
  - [ ] Create `tools/nodevm.js` (or a compiler CLI) to load, parse, and execute `.bas` files directly from the terminal.
  - [ ] Implement command-line argument handling (e.g., `node tools/nodevm.js script.bas`).
- [ ] **14.2. Headless Hardware Abstraction (HAL):**
  - [ ] Implement `ConsoleVGA`: A headless display driver that maps basic `PRINT` statements to `process.stdout` and ignores graphical commands (`PSET`, `WINDOW`).
  - [ ] Implement `NodeIO`: A headless input driver mapping `INKEY$` and `INPUT` to `process.stdin`.
- [ ] **14.3. Backend Math & Logic:**
  - [ ] Validate the execution of heavy computational scripts (e.g., algorithmic math, text-based data processing) without browser overhead.
- [ ] **14.4. Universal Syntax Linter:**
  - [ ] Leverage the decoupled front-end to create `tools/lint.js`.
  - [ ] Provide a strict, headless diagnostic tool capable of parsing any legacy `.bas` file and reporting syntax errors, unmatched blocks, or unhoisted labels directly to the terminal.