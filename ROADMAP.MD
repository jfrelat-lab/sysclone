# Roadmap: Sysclone - Milestone 1 (QBasic / Nibbles)

## Phase 1: Foundation and Tooling (Monadic Parsers)
*The objective is to implement the syntactic analysis engine in pure JavaScript.*

- [x] **1.1. Implement the core Monadic Parser:**
  - [x] Create the base structure (`Parser(state) -> { result, rest, error }`).
  - [x] Implement fundamental combinators: `sequence`, `sequenceObj`, `choice`, `many`, `optional`, `lazy`.
  - [x] Implement transformation combinators: `map` (for AST generation).
- [x] **1.2. Create base Lexers (Primitives):**
  - [x] **Line-Based Architecture:** Create the strict `eos` (End Of Statement) token to rigorously handle line breaks `\n`, colons `:`, and empty lines.
  - [x] Horizontal spaces (`ws`, `optWs`) and comments (ignored until line break).
  - [x] Numbers (integers and floats, e.g., `100`, `.5`).
  - [x] Strings (`"..."`).
  - [x] Case-insensitive identifiers (variables, function names, including type suffixes like `$`, `%`).

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
  - [x] Teach the Evaluator to instantiate `DIM` by creating `QArray` and composite objects in memory.
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
  - [ ] Add integer division `\`, exponentiation `^`, and logical operators `XOR`, `EQV`, `IMP`.
  - [ ] Add support for octal format (`&O`) and scientific notation (`E`, `D`).

## Phase 7: Trial by Fire - Nibbles.bas (Update)
*The final boss: Assemble everything to run the original game, correcting critical architectural flaws.*

- [x] **7.1. Source File Integration:**
  - [x] Fetch text loading of the original `NIBBLES.BAS` file.
  - [x] Full end-to-to parsing (requires prior patching of the `eos` regex against ReDoS).
- [ ] **7.2. Debugging and Structural Corrections:**
  - [ ] Scope Correction: Isolate `LABEL` tags by scope (Main vs Sub/Function) in `evaluator.js` to avoid collisions.
  - [x] Memory-Mapped VRAM: Link `POKE` instructions from the `&HB800` segment (Memory) to `VGA` engine cells.
- [ ] **7.3. Engine Tweaks (Pre-JIT):**
  - [x] VGA Optimization (Memory): Implement rendering via `Uint32Array` for fast buffer manipulation.
  - [ ] VGA Optimization (CPU): Implement a "Dirty Rectangles" system to update only modified areas and secure framerate.
  - [x] CPU Lightening: Optimize Generator Tick frequency (per-statement instead of per-node) and implement Hybrid Runner (Retro/Turbo UI).
- [x] **7.4. Play Nibbles!**

---

# Roadmap: Sysclone - Milestone 2 (Gorillas & Mandelbrot)

## Phase 8: I/O Encoding & Robust Loading
*Ensure safe and authentic loading of legacy source files.*

- [x] **8.1. CP437 / Unicode Translation Layer:**
  - [x] Create a bidirectional mapping table (`toCP437` / `fromCP437`).
  - [x] Update `main.js` to load standard UTF-8 raw files from GitHub and transpile them into CP437 bytes for virtual RAM.
  - [x] Implement debugging and CLI helpers (`convert_bas.js`) for legacy file restoration.

## Phase 9: Advanced QBasic Semantics (Gorillas Prep)
*Implement complex language features required by advanced Microsoft demos.*

- [ ] **9.1. Static Data Structures:**
  - [ ] Implement `DATA`, `READ`, and `RESTORE` with a global data pointer in the `Environment`.
- [ ] **9.2. Exception Handling:**
  - [ ] Implement `ON ERROR GOTO`, `RESUME`, and `RESUME NEXT` to catch runtime hardware/software faults.
- [ ] **9.3. Implicit Typing & Macros:**
  - [ ] Support `DEFINT`, `DEFSNG`, etc., for default variable typing.
  - [ ] Parse and evaluate single-line macros: `DEF FNname(args) = expr`.
- [x] **9.4. Math & Randomness:**
  - [x] Implement `RANDOMIZE (TIMER)`, `RND`, `ATN`, `COS`, `SIN`, `ABS`.

## Phase 10: Advanced Graphics Engine (Gorillas & Mandelbrot)
*Expand the engine capabilities to support computationally and graphically intensive classics.*

- [ ] **10.1. Viewports & Coordinate Systems:**
  - [x] Support `WINDOW` to map logical coordinates to physical screen pixels.
  - [ ] Support `VIEW PRINT` to restrict text rendering and scrolling to specific screen rows.
- [ ] **10.2. Palettes & Screen Modes:**
  - [x] Implement default hardware palettes (CGA 4-color, EGA 16-color, MCGA/VGA 256-color).
  - [ ] Add `PALETTE` and `PALETTE USING` mapping support.
- [ ] **10.3. Geometry Primitives (SCREEN 7, 8, 13):**
  - [x] Implement `PSET` (Pixel Set).
  - [ ] Implement `POINT` (Pixel Read - critical for collision detection).
  - [ ] Add geometry rendering: `LINE`, `CIRCLE`.
  - [ ] Add algorithmic drawing: `PAINT` (Flood Fill algorithm).
- [ ] **10.4. Hardware Blitting (`GET` / `PUT`):**
  - [ ] Reverse-engineer QBasic sprite array formats (Header + Pixel data).
  - [ ] Implement `GET` to capture screen regions into arrays.
  - [ ] Implement `PUT` with bitwise operations (`PSET`, `XOR`, `AND`, `OR`).

## Phase 11: Hardware Interrupts & Advanced Input
- [ ] **11.1. Advanced Keyboard Controller:**
  - [ ] Upgrade state tracking to support multiple simultaneous keys (crucial for Gorillas/Nibbles gameplay).
- [ ] **11.2. The PC Speaker (Macro Music Language):**
  - [ ] Wire `BEEP` and `SOUND` to the Web Audio API (`AudioContext`).
  - [ ] Build a micro-parser for the `PLAY` command syntax.

## Phase 12: The Grand Playtest
- [ ] **12.1. Rosetta Code Mandelbrot:**
  - [ ] Execute math-heavy visual rendering (`WINDOW`, `PSET`, MCGA).
- [ ] **12.2. Gorillas.bas:**
  - [ ] Full execution (projectile math, explosive `PAINT` rendering, `XOR` sprite blitting, sound effects).

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