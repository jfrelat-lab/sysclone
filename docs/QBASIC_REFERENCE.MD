# Sysclone QBasic Compatibility Reference

> **Auto-generated** from Truth Vectors. This document serves as the absolute specification for MS-DOS QBasic behavior.

## 🔠 Alphabetical Index

[/ (Floating-Point Division)](#-floating-point-division-) • [\ (Integer Division)](#-integer-division-) • [ABS Function](#abs-function) • [ASC Function](#asc-function) • [ATN Function](#atn-function) • [CALL Statement](#call-statement) • [CHR$ Function](#chr-function) • [CINT Function](#cint-function) • [COS Function](#cos-function) • [Default Implicit Typing (SINGLE)](#default-implicit-typing-single-) • [DEFINT Statement](#defint-statement) • [DEFSNG Statement](#defsng-statement) • [DO...LOOP Statement (Post-test)](#do-loop-statement-post-test-) • [DO...LOOP Statement (Pre-test)](#do-loop-statement-pre-test-) • [ERASE Statement](#erase-statement) • [EXIT FOR Statement](#exit-for-statement) • [EXP Function](#exp-function) • [Explicit Type Suffix Override](#explicit-type-suffix-override) • [FIX Function](#fix-function) • [Fixed-Length String Padding](#fixed-length-string-padding) • [Fixed-Length String Truncation](#fixed-length-string-truncation) • [FOR...NEXT Statement](#for-next-statement) • [GOSUB...RETURN Statement](#gosub-return-statement) • [HEX$ Function](#hex-function) • [INSTR Function](#instr-function) • [INT Function](#int-function) • [LCASE$ Function](#lcase-function) • [LEFT$ Function](#left-function) • [LEN Function](#len-function) • [LOG Function](#log-function) • [LTRIM$ Function](#ltrim-function) • [Memory Aliasing (DIM AS STRING)](#memory-aliasing-dim-as-string-) • [MID$ Function](#mid-function) • [MOD Operator](#mod-operator) • [RIGHT$ Function](#right-function) • [RTRIM$ Function](#rtrim-function) • [SELECT CASE Statement](#select-case-statement) • [SIN Function](#sin-function) • [SPACE$ Function](#space-function) • [SQR Function](#sqr-function) • [STR$ Function](#str-function) • [STRING$ Function](#string-function) • [SWAP Statement](#swap-statement) • [TAN Function](#tan-function) • [UCASE$ Function](#ucase-function) • [VAL Function](#val-function) • [WHILE...WEND Statement](#while-wend-statement)

---

## 📚 Thematic Contents

- **STDLIB: Math & Floating-Point Unit**
  - [INT Function](#int-function)
  - [FIX Function](#fix-function)
  - [CINT Function](#cint-function)
  - [/ (Floating-Point Division)](#-floating-point-division-)
  - [\ (Integer Division)](#-integer-division-)
  - [MOD Operator](#mod-operator)
  - [ABS Function](#abs-function)
  - [SQR Function](#sqr-function)
  - [SIN Function](#sin-function)
  - [COS Function](#cos-function)
  - [TAN Function](#tan-function)
  - [ATN Function](#atn-function)
  - [EXP Function](#exp-function)
  - [LOG Function](#log-function)
- **STDLIB: Strings & Type Casting**
  - [STR$ Function](#str-function)
  - [HEX$ Function](#hex-function)
  - [VAL Function](#val-function)
  - [LEFT$ Function](#left-function)
  - [RIGHT$ Function](#right-function)
  - [MID$ Function](#mid-function)
  - [SPACE$ Function](#space-function)
  - [STRING$ Function](#string-function)
  - [LEN Function](#len-function)
  - [UCASE$ Function](#ucase-function)
  - [LCASE$ Function](#lcase-function)
  - [LTRIM$ Function](#ltrim-function)
  - [RTRIM$ Function](#rtrim-function)
  - [CHR$ Function](#chr-function)
  - [ASC Function](#asc-function)
  - [INSTR Function](#instr-function)
- **CORE: Control Flow & Jumps**
  - [FOR...NEXT Statement](#for-next-statement)
  - [EXIT FOR Statement](#exit-for-statement)
  - [DO...LOOP Statement (Pre-test)](#do-loop-statement-pre-test-)
  - [DO...LOOP Statement (Post-test)](#do-loop-statement-post-test-)
  - [GOSUB...RETURN Statement](#gosub-return-statement)
  - [SELECT CASE Statement](#select-case-statement)
  - [WHILE...WEND Statement](#while-wend-statement)
- **CORE: Memory, Types & Structures**
  - [Default Implicit Typing (SINGLE)](#default-implicit-typing-single-)
  - [DEFINT Statement](#defint-statement)
  - [DEFSNG Statement](#defsng-statement)
  - [Explicit Type Suffix Override](#explicit-type-suffix-override)
  - [Memory Aliasing (DIM AS STRING)](#memory-aliasing-dim-as-string-)
  - [Fixed-Length String Padding](#fixed-length-string-padding)
  - [Fixed-Length String Truncation](#fixed-length-string-truncation)
  - [SWAP Statement](#swap-statement)
  - [ERASE Statement](#erase-statement)
- **CORE: Procedures & Functions**
  - [CALL Statement](#call-statement)

---

## STDLIB: Math & Floating-Point Unit

### INT Function

**Syntax:** `INT(numeric_expression)`

Returns the largest integer less than or equal to a numeric expression.

**Example:**
```basic
PRINT INT(2.8)
```
**Output:**
```text
 2 
```

#### 🔬 Hardware Quirks & Edge Cases

For negative numbers, it mathematically floors downwards (e.g., -2.2 becomes -3).

```basic
IntPos = INT(2.8)
IntNeg = INT(-2.2)
```
**Memory State (End of Execution):**
```text
IntPos = 2            (number)
IntNeg = -3           (number)
```

---

### FIX Function

**Syntax:** `FIX(numeric_expression)`

Returns the truncated integer part of a numeric expression.

**Example:**
```basic
PRINT FIX(-2.8)
```
**Output:**
```text
-2 
```

#### 🔬 Hardware Quirks & Edge Cases

Unlike INT, it strictly removes the fractional part towards zero without flooring downwards.

```basic
FixPos = FIX(2.8)
FixNeg = FIX(-2.8)
```
**Memory State (End of Execution):**
```text
FixPos = 2            (number)
FixNeg = -2           (number)
```

---

### CINT Function

**Syntax:** `CINT(numeric_expression)`

Rounds a numeric expression to the nearest integer.

**Example:**
```basic
PRINT CINT(2.6)
```
**Output:**
```text
 3 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRK: QBasic employs 'Banker\'s Rounding'. If the fractional part is exactly .5, it rounds to the nearest EVEN integer.

```basic
CintUp = CINT(2.6)
CintHalfEven = CINT(2.5)
CintHalfOdd = CINT(3.5)
```
**Memory State (End of Execution):**
```text
CintUp       = 3            (number)
CintHalfEven = 2            (number)
CintHalfOdd  = 4            (number)
```

---

### / (Floating-Point Division)

**Syntax:** `expression1 / expression2`

Divides two numbers and returns a floating-point result.

**Example:**
```basic
PRINT 5 / 2
```
**Output:**
```text
 2.5 
```

#### 🔬 Hardware Quirks & Edge Cases

Operands are not rounded before the operation, and the result retains fractional precision.

```basic
FloatDiv! = 5 / 2
```
**Memory State (End of Execution):**
```text
FloatDiv! = 2.5          (number)
```

---

### \ (Integer Division)

**Syntax:** `expression1 \ expression2`

Divides two numbers and returns an integer result.

**Example:**
```basic
PRINT 5 \ 2
```
**Output:**
```text
 2 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRK: Both operands are rounded to integers (Banker's Rounding) BEFORE the division occurs. Using float suffix (!) prevents DEFINT masking during tests. Evaluates rounding of .5 to the nearest even integer.

```basic
IntDiv! = 5 \ 2
IntDivRound! = 5.6 \ 1.9
IntDivBankerEven! = 2.5 \ 1
IntDivBankerOdd! = 3.5 \ 1
```
**Memory State (End of Execution):**
```text
IntDiv!           = 2            (number)
IntDivRound!      = 3            (number)
IntDivBankerEven! = 2            (number)
IntDivBankerOdd!  = 4            (number)
```

---

### MOD Operator

**Syntax:** `expression1 MOD expression2`

Divides two numbers and returns the integer remainder.

**Example:**
```basic
PRINT 10 MOD 3
```
**Output:**
```text
 1 
```

#### 🔬 Hardware Quirks & Edge Cases

Like the backslash operator, MOD rounds its operands to integers BEFORE performing the operation. The result inherits the sign of the first operand. Using float suffix (!) prevents DEFINT masking during tests.

```basic
ModNorm! = 10 MOD 3
ModNeg! = -10 MOD 3
ModRound! = 10.6 MOD 3
```
**Memory State (End of Execution):**
```text
ModNorm!  = 1            (number)
ModNeg!   = -1           (number)
ModRound! = 2            (number)
```

---

### ABS Function

**Syntax:** `ABS(numeric_expression)`

Returns the absolute value of a numeric expression.

**Example:**
```basic
PRINT ABS(-42)
```
**Output:**
```text
 42 
```

#### 🔬 Hardware Quirks & Edge Cases

Standard arithmetic absolute conversion.

```basic
AbsVal = ABS(-42)
```
**Memory State (End of Execution):**
```text
AbsVal = 42           (number)
```

---

### SQR Function

**Syntax:** `SQR(numeric_expression)`

Returns the square root of a numeric expression.

**Example:**
```basic
PRINT SQR(16)
```
**Output:**
```text
 4 
```

#### 🔬 Hardware Quirks & Edge Cases

Passing a negative number natively throws an 'Illegal function call' exception.

```basic
SqrVal = SQR(16)
```
**Memory State (End of Execution):**
```text
SqrVal = 4            (number)
```

---

### SIN Function

**Syntax:** `SIN(angle)`

Returns the trigonometric sine of an angle (in radians).

**Example:**
```basic
PRINT SIN(0)
```
**Output:**
```text
 0 
```

#### 🔬 Hardware Quirks & Edge Cases

To avoid floating-point precision mismatch assertions between MS-DOS x87 architecture and modern V8 IEEE-754, the test result is multiplied by 1000 and clamped to an integer.

```basic
SinZero = CINT(SIN(0) * 1000)
```
**Memory State (End of Execution):**
```text
SinZero = 0            (number)
```

---

### COS Function

**Syntax:** `COS(angle)`

Returns the trigonometric cosine of an angle (in radians).

**Example:**
```basic
PRINT COS(0)
```
**Output:**
```text
 1 
```

#### 🔬 Hardware Quirks & Edge Cases

To avoid floating-point precision mismatch assertions between MS-DOS x87 architecture and modern V8 IEEE-754, the test result is multiplied by 1000 and clamped to an integer.

```basic
CosZero = CINT(COS(0) * 1000)
```
**Memory State (End of Execution):**
```text
CosZero = 1000         (number)
```

---

### TAN Function

**Syntax:** `TAN(angle)`

Returns the trigonometric tangent of an angle (in radians).

**Example:**
```basic
PRINT TAN(0)
```
**Output:**
```text
 0 
```

#### 🔬 Hardware Quirks & Edge Cases

To avoid floating-point precision mismatch assertions between MS-DOS x87 architecture and modern V8 IEEE-754, the test result is multiplied by 1000 and clamped to an integer.

```basic
TanZero = CINT(TAN(0) * 1000)
```
**Memory State (End of Execution):**
```text
TanZero = 0            (number)
```

---

### ATN Function

**Syntax:** `ATN(numeric_expression)`

Returns the arctangent of a numeric expression (in radians).

**Example:**
```basic
PRINT ATN(0)
```
**Output:**
```text
 0 
```

#### 🔬 Hardware Quirks & Edge Cases

To avoid floating-point precision mismatch assertions between MS-DOS x87 architecture and modern V8 IEEE-754, the test result is multiplied by 1000 and clamped to an integer.

```basic
AtnZero = CINT(ATN(0) * 1000)
```
**Memory State (End of Execution):**
```text
AtnZero = 0            (number)
```

---

### EXP Function

**Syntax:** `EXP(numeric_expression)`

Returns 'e' (the base of natural logarithms) raised to the power of the specified expression.

**Example:**
```basic
PRINT EXP(0)
```
**Output:**
```text
 1 
```

#### 🔬 Hardware Quirks & Edge Cases

To avoid floating-point precision mismatch assertions between MS-DOS x87 architecture and modern V8 IEEE-754, the test result is multiplied by 1000 and clamped to an integer.

```basic
ExpZero = CINT(EXP(0) * 1000)
```
**Memory State (End of Execution):**
```text
ExpZero = 1000         (number)
```

---

### LOG Function

**Syntax:** `LOG(numeric_expression)`

Returns the natural logarithm of a numeric expression.

**Example:**
```basic
PRINT LOG(1)
```
**Output:**
```text
 0 
```

#### 🔬 Hardware Quirks & Edge Cases

To avoid floating-point precision mismatch assertions between MS-DOS x87 architecture and modern V8 IEEE-754, the test result is multiplied by 1000 and clamped to an integer.

```basic
LogOne = CINT(LOG(1) * 1000)
```
**Memory State (End of Execution):**
```text
LogOne = 0            (number)
```

---

## STDLIB: Strings & Type Casting

### STR$ Function

**Syntax:** `STR$(numeric_expression)`

Returns a string representation of the value of a numeric expression.

**Example:**
```basic
PRINT STR$(42)
```
**Output:**
```text
 42
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRK: Positive numbers and zero are strictly prefixed with a leading space (acting as an implicit '+' sign). Negative numbers are prefixed by '-' without a leading space.

```basic
PosStr$ = STR$(42)
ZeroStr$ = STR$(0)
NegStr$ = STR$(-15)
```
**Memory State (End of Execution):**
```text
PosStr$  = " 42"        (string)
ZeroStr$ = " 0"         (string)
NegStr$  = "-15"        (string)
```

---

### HEX$ Function

**Syntax:** `HEX$(numeric_expression)`

Returns a string that represents the hexadecimal value of the decimal argument.

**Example:**
```basic
PRINT HEX$(255)
```
**Output:**
```text
FF
```

#### 🔬 Hardware Quirks & Edge Cases

QBasic rounds floats to the nearest integer before conversion (Banker's rounding). Standard numbers are treated as 16-bit integers (FFFF for -1), while Long integers (&) or values exceeding -32768 fallback to 32-bit two's complement. Output is always uppercase.

```basic
NormHex$ = HEX$(255)
RoundDownHex$ = HEX$(12.4)
RoundUpHex$ = HEX$(12.6)
NegTwosComp$ = HEX$(-1)
LargeNegTwosComp$ = HEX$(-100000)
ZeroHex$ = HEX$(0)
```
**Memory State (End of Execution):**
```text
NormHex$          = "FF"         (string)
RoundDownHex$     = "C"          (string)
RoundUpHex$       = "D"          (string)
NegTwosComp$      = "FFFF"       (string)
LargeNegTwosComp$ = "FFFE7960"   (string)
ZeroHex$          = "0"          (string)
```

---

### VAL Function

**Syntax:** `VAL(stringexpression$)`

Returns the numeric value of a string of characters.

**Example:**
```basic
PRINT VAL("123.45")
```
**Output:**
```text
123.45
```

#### 🔬 Hardware Quirks & Edge Cases

Accurately parses MS-DOS legacy radix prefixes: Hexadecimal (&H) and Octal (&O). Invalid input gracefully falls back to 0 without throwing an exception.

```basic
NormVal! = VAL("123.45")
HexVal = VAL("&H10")
HexLowVal = VAL("&hc")
OctVal = VAL("&O10")
GarbageVal = VAL("NOTANUMBER")
```
**Memory State (End of Execution):**
```text
NormVal!   = 123.45       (number)
HexVal     = 16           (number)
HexLowVal  = 12           (number)
OctVal     = 8            (number)
GarbageVal = 0            (number)
```

---

### LEFT$ Function

**Syntax:** `LEFT$(stringexpression$, n%)`

Returns a string consisting of the leftmost n% characters of a string.

**Example:**
```basic
PRINT LEFT$("SYSCLONE", 3)
```
**Output:**
```text
SYS
```

#### 🔬 Hardware Quirks & Edge Cases

If N exceeds the string length, the entire string is safely returned without throwing an out-of-bounds error.

```basic
BaseStr$ = "SYSCLONE"
NormLeft$ = LEFT$(BaseStr$, 3)
OverLeft$ = LEFT$(BaseStr$, 50)
```
**Memory State (End of Execution):**
```text
NormLeft$ = "SYS"        (string)
OverLeft$ = "SYSCLONE"   (string)
```

---

### RIGHT$ Function

**Syntax:** `RIGHT$(stringexpression$, n%)`

Returns a string consisting of the rightmost n% characters of a string.

**Example:**
```basic
PRINT RIGHT$("SYSCLONE", 5)
```
**Output:**
```text
CLONE
```

#### 🔬 Hardware Quirks & Edge Cases

Similar to LEFT$, an oversized N returns the whole string safely.

```basic
BaseStr$ = "SYSCLONE"
NormRight$ = RIGHT$(BaseStr$, 5)
OverRight$ = RIGHT$(BaseStr$, 50)
```
**Memory State (End of Execution):**
```text
NormRight$ = "CLONE"      (string)
OverRight$ = "SYSCLONE"   (string)
```

---

### MID$ Function

**Syntax:** `MID$(stringexpr$, start%[, length%])`

Returns a substring of a specified length starting at a 1-based index.

**Example:**
```basic
PRINT MID$("SYSCLONE", 4, 2)
```
**Output:**
```text
CL
```

#### 🔬 Hardware Quirks & Edge Cases

If the length parameter is omitted, it returns the remainder of the string. Out-of-bounds start indices yield an empty string without throwing an error.

```basic
BaseStr$ = "SYSCLONE"
NormMid$ = MID$(BaseStr$, 4, 2)
NoLenMid$ = MID$(BaseStr$, 4)
OutBoundsMid$ = MID$(BaseStr$, 99, 2)
```
**Memory State (End of Execution):**
```text
NormMid$      = "CL"         (string)
NoLenMid$     = "CLONE"      (string)
OutBoundsMid$ = ""           (string)
```

---

### SPACE$ Function

**Syntax:** `SPACE$(n%)`

Returns a string of n% spaces.

**Example:**
```basic
PRINT "A" + SPACE$(3) + "B"
```
**Output:**
```text
A   B
```

#### 🔬 Hardware Quirks & Edge Cases

Negative or zero lengths safely return an empty string.

```basic
SpcStr$ = SPACE$(3)
```
**Memory State (End of Execution):**
```text
SpcStr$ = "   "        (string)
```

---

### STRING$ Function

**Syntax:** `STRING$(n%, {stringexpression$ | ascii_code%})`

Returns a string of characters, n% long, consisting of a single character.

**Example:**
```basic
PRINT STRING$(4, "A")
```
**Output:**
```text
AAAA
```

#### 🔬 Hardware Quirks & Edge Cases

The character can be specified either as a numeric ASCII/CP437 code, or as a string (in which case only the first character is used).

```basic
StrChar$ = STRING$(4, "A")
StrLong$ = STRING$(3, "XYZ")
StrCode$ = STRING$(3, 65)
```
**Memory State (End of Execution):**
```text
StrChar$ = "AAAA"       (string)
StrLong$ = "XXX"        (string)
StrCode$ = "AAA"        (string)
```

---

### LEN Function

**Syntax:** `LEN(stringexpression$)`

Returns the number of characters in a string.

**Example:**
```basic
PRINT LEN("HELLO")
```
**Output:**
```text
5
```

#### 🔬 Hardware Quirks & Edge Cases

Standard length calculation.

```basic
StrLen = LEN("HELLO")
```
**Memory State (End of Execution):**
```text
StrLen = 5            (number)
```

---

### UCASE$ Function

**Syntax:** `UCASE$(stringexpression$)`

Returns a string expression with all letters converted to uppercase.

**Example:**
```basic
PRINT UCASE$("hello")
```
**Output:**
```text
HELLO
```

#### 🔬 Hardware Quirks & Edge Cases

Transforms lowercase ASCII characters to uppercase without affecting symbols or numbers.

```basic
UpStr$ = UCASE$("hello")
```
**Memory State (End of Execution):**
```text
UpStr$ = "HELLO"      (string)
```

---

### LCASE$ Function

**Syntax:** `LCASE$(stringexpression$)`

Returns a string expression with all letters converted to lowercase.

**Example:**
```basic
PRINT LCASE$("HELLO")
```
**Output:**
```text
hello
```

#### 🔬 Hardware Quirks & Edge Cases

Transforms uppercase ASCII characters to lowercase without affecting symbols or numbers.

```basic
LowStr$ = LCASE$("HELLO")
```
**Memory State (End of Execution):**
```text
LowStr$ = "hello"      (string)
```

---

### LTRIM$ Function

**Syntax:** `LTRIM$(stringexpression$)`

Returns a copy of a string with leading (leftmost) spaces removed.

**Example:**
```basic
PRINT LTRIM$("  TEXT")
```
**Output:**
```text
TEXT
```

#### 🔬 Hardware Quirks & Edge Cases

Crucial for cleaning up STR$ outputs which naturally contain leading spaces for positive numbers.

```basic
LTrimStr$ = LTRIM$("  TEXT")
```
**Memory State (End of Execution):**
```text
LTrimStr$ = "TEXT"       (string)
```

---

### RTRIM$ Function

**Syntax:** `RTRIM$(stringexpression$)`

Returns a copy of a string with trailing (rightmost) spaces removed.

**Example:**
```basic
PRINT RTRIM$("TEXT  ")
```
**Output:**
```text
TEXT
```

#### 🔬 Hardware Quirks & Edge Cases

Often used to trim fixed-length strings (STRING * N) that are padded with spaces on the right.

```basic
RTrimStr$ = RTRIM$("TEXT  ")
```
**Memory State (End of Execution):**
```text
RTrimStr$ = "TEXT"       (string)
```

---

### CHR$ Function

**Syntax:** `CHR$(ascii_code%)`

Returns a one-character string whose ASCII/CP437 code is the argument.

**Example:**
```basic
PRINT CHR$(65)
```
**Output:**
```text
A
```

#### 🔬 Hardware Quirks & Edge Cases

Sysclone maps these directly to the MS-DOS Code Page 437 (CP437) for graphical block character fidelity.

```basic
Char$ = CHR$(65)
```
**Memory State (End of Execution):**
```text
Char$ = "A"          (string)
```

---

### ASC Function

**Syntax:** `ASC(stringexpression$)`

Returns the ASCII/CP437 character code corresponding to the first letter in a string.

**Example:**
```basic
PRINT ASC("A")
```
**Output:**
```text
65
```

#### 🔬 Hardware Quirks & Edge Cases

If the string is empty, true QBasic throws an 'Illegal function call' error.

```basic
AscVal = ASC("A")
```
**Memory State (End of Execution):**
```text
AscVal = 65           (number)
```

---

### INSTR Function

**Syntax:** `INSTR([start%,] string1$, string2$)`

Returns the character position of the first occurrence of a string in another.

**Example:**
```basic
PRINT INSTR("HELLO WORLD", "WORLD")
```
**Output:**
```text
7
```

#### 🔬 Hardware Quirks & Edge Cases

Uses 1-based indexing. If an optional start index is provided, the search begins there. Returns 0 if the substring is not found or if the start index is out of bounds.

```basic
FoundIdx = INSTR("HELLO WORLD", "WORLD")
OffsetIdx = INSTR(3, "HELLO WORLD, HELLO", "HELLO")
NotFoundIdx = INSTR("HELLO", "Z")
OutBoundsIdx = INSTR(100, "HELLO", "L")
```
**Memory State (End of Execution):**
```text
FoundIdx     = 7            (number)
OffsetIdx    = 14           (number)
NotFoundIdx  = 0            (number)
OutBoundsIdx = 0            (number)
```

---

## CORE: Control Flow & Jumps

### FOR...NEXT Statement

**Syntax:** `FOR counter = start TO end [STEP increment] ... NEXT [counter]`

Iterates a block of code based on a counter variable. The loop continues until the counter passes the terminal value.

**Example:**
```basic
FOR I = 1 TO 3
  PRINT I;
NEXT
```
**Output:**
```text
 1  2  3 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **Terminal Overshoot**: The loop iterator always increments past the limit, leaving the leaked value in memory.
2. **Bound Immutability**: The TO and STEP expressions are evaluated exactly ONCE upon entering the loop. Mutating their source variables inside the loop has no effect.
3. **Iterator Mutation**: Modifying the counter explicitly inside the loop directly affects the remaining cycles.

```basic
' 1. Terminal Overshoot (Positive & Negative)
CountA = 0: FOR I = 1 TO 5: CountA = CountA + 1: NEXT
CountB = 0: FOR J = 5 TO 1 STEP -1: CountB = CountB + 1: NEXT

' 2. Bound Immutability
Limit = 3: Inc = 1: Runs = 0
FOR K = 1 TO Limit STEP Inc
  Runs = Runs + 1
  Limit = 10
  Inc = 5
NEXT

' 3. Iterator Mutation
MutRuns = 0
FOR M = 1 TO 5
  MutRuns = MutRuns + 1
  M = M + 1
NEXT
```
**Memory State (End of Execution):**
```text
CountA  = 5            (number)
I       = 6            (number)
CountB  = 5            (number)
J       = 0            (number)
Runs    = 3            (number)
K       = 4            (number)
Limit   = 10           (number)
Inc     = 5            (number)
MutRuns = 3            (number)
M       = 7            (number)
```

---

### EXIT FOR Statement

**Syntax:** `EXIT FOR`

Immediately terminates the execution of the innermost FOR...NEXT loop, transferring control to the statement following the NEXT keyword.

**Example:**
```basic
FOR I = 1 TO 5
  IF I = 3 THEN EXIT FOR
  PRINT I;
NEXT
```
**Output:**
```text
 1  2 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **Iterator Retention**: Unlike a naturally completed loop which overshoots, exiting prematurely leaves the iterator at its exact current value.
2. **Scope Isolation**: In nested loops, `EXIT FOR` strictly breaks only the deepest active loop without affecting outer iterators.
3. **Short-Circuit**: Any statements remaining in the loop body after the `EXIT FOR` command are immediately bypassed.

```basic
' 1. Basic Exit and Iterator Retention
TargetVal = 0: FinalI = 0
FOR I = 5 TO 1 STEP -1
  IF I = 3 THEN
    TargetVal = I
    EXIT FOR
  END IF
NEXT
FinalI = I

' 2. Scope Isolation (Nested Loops)
OuterCount = 0: InnerCount = 0
FOR Outer = 1 TO 3
  OuterCount = OuterCount + 1
  FOR Inner = 1 TO 5
    IF Inner = 2 THEN EXIT FOR
    InnerCount = InnerCount + 1
  NEXT
NEXT
FinalOuter = Outer
FinalInner = Inner

' 3. Short-Circuit Execution
Flag = 0: FinalK = 0
FOR K = 1 TO 5
  EXIT FOR
  Flag = 99
NEXT
FinalK = K
```
**Memory State (End of Execution):**
```text
TargetVal  = 3            (number)
FinalI     = 3            (number)
OuterCount = 3            (number)
FinalOuter = 4            (number)
InnerCount = 3            (number)
FinalInner = 2            (number)
Flag       = 0            (number)
FinalK     = 1            (number)
```

---

### DO...LOOP Statement (Pre-test)

**Syntax:** `DO [{WHILE | UNTIL} condition] ... LOOP`

Evaluates the condition BEFORE executing the block. If the initial condition is unmet, the loop executes 0 times. Truthiness is strict: exactly 0 is FALSE, any other number is TRUE.

**Example:**
```basic
Cond = 0
DO WHILE Cond
  PRINT "Never prints"
LOOP
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Proves that a pre-test loop bypasses the block entirely if the condition is false (WHILE 0) or already true (UNTIL -1). Also validates arbitrary float truthiness.

```basic
' 1. WHILE False -> 0 runs
RunsPreWhile = 0
DO WHILE 0
  RunsPreWhile = RunsPreWhile + 1
LOOP

' 2. UNTIL True -> 0 runs
RunsPreUntil = 0
DO UNTIL -1
  RunsPreUntil = RunsPreUntil + 1
LOOP

' 3. WHILE Arbitrary Float (True) -> 1 run
RunsFloat = 0
CondF = 42.5
DO WHILE CondF
  RunsFloat = RunsFloat + 1
  CondF = 0
LOOP
```
**Memory State (End of Execution):**
```text
RunsPreWhile = 0            (number)
RunsPreUntil = 0            (number)
RunsFloat    = 1            (number)
```

---

### DO...LOOP Statement (Post-test)

**Syntax:** `DO ... LOOP [{WHILE | UNTIL} condition]`

Evaluates the condition AFTER executing the block. The loop is guaranteed to execute AT LEAST ONCE, regardless of the initial condition.

**Example:**
```basic
Cond = 0
DO
  PRINT "Prints exactly once"
LOOP WHILE Cond
```
**Output:**
```text
 Prints exactly once 
```

#### 🔬 Hardware Quirks & Edge Cases

Proves the post-test execution flow. A WHILE condition initialized to 0 (FALSE) will still allow exactly one iteration before exiting.

```basic
RunsPostA = 0
DO
  RunsPostA = RunsPostA + 1
LOOP WHILE 0

RunsPostB = 0
DO
  RunsPostB = RunsPostB + 1
LOOP UNTIL -1
```
**Memory State (End of Execution):**
```text
RunsPostA = 1            (number)
RunsPostB = 1            (number)
```

---

### GOSUB...RETURN Statement

**Syntax:** `GOSUB label ... label: ... RETURN`

Branches to, and returns from, a subroutine within the same module. Variables are fully shared with the caller.

**Example:**
```basic
GOSUB PrintMsg
END
PrintMsg:
  PRINT "Hello"
RETURN
```
**Output:**
```text
Hello
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **Scope Sharing**: GOSUB does not create a new variable scope. It shares the exact same memory space as the caller.
2. **Internal Jumps**: A GOTO inside a GOSUB block strictly shifts the internal pointer without breaking the GOSUB loop.
3. **Spatial Return**: The RETURN statement is strictly required to escape the GOSUB isolation loop and resume main execution.

```basic
GlobalVar = 10: StepId = 0
GOSUB RoutineStart
StepId = 99
GOTO EndTest

RoutineStart:
  GlobalVar = GlobalVar * 2
  GOTO RoutineSkip
  GlobalVar = 0 ' MUST NEVER EXECUTE
RoutineSkip:
  StepId = 1
RETURN

EndTest:
```
**Memory State (End of Execution):**
```text
GlobalVar = 20           (number)
StepId    = 99           (number)
```

---

### SELECT CASE Statement

**Syntax:** `SELECT CASE testexpression ... CASE {expressionlist | IS relation | start TO end} ... [CASE ELSE] ... END SELECT`

Executes one of several blocks of statements depending on the value of an expression. Supports exact matches, inclusive ranges (TO), and relational comparisons (IS).

**Example:**
```basic
Score = 85
SELECT CASE Score
  CASE IS >= 90
    PRINT "Grade: A"
  CASE 80 TO 89
    PRINT "Grade: B"
  CASE 0, 1, 2
    PRINT "Grade: Z"
  CASE ELSE
    PRINT "Unknown"
END SELECT
```
**Output:**
```text
Grade: B
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **Single Evaluation**: The base test expression is evaluated exactly once.
2. **No Fallthrough**: Unlike C or JavaScript, QBasic executes ONLY the first matching CASE block and then exits the SELECT entirely.
3. **Range Matching**: The 'TO' keyword denotes an inclusive mathematical range.
4. **Relational Matching**: The 'IS' keyword allows direct relational comparisons (>, <, >=, <=, <>).

```basic
' 1. Exact Match, Range (TO), and No Fallthrough
TestVal = 5: Result = 0: ExecCount = 0
SELECT CASE TestVal
  CASE 1, 2, 3
    Result = 1: ExecCount = ExecCount + 1
  CASE 4 TO 6
    Result = 2: ExecCount = ExecCount + 1
  CASE 5
    Result = 3: ExecCount = ExecCount + 1 ' MUST NEVER EXECUTE (No fallthrough)
  CASE ELSE
    Result = 4: ExecCount = ExecCount + 1
END SELECT

' 2. Relational Matching (CASE IS)
Score = 85: Grade = 0
SELECT CASE Score
  CASE IS >= 90
    Grade = 1
  CASE IS >= 80
    Grade = 2
  CASE IS < 50
    Grade = 3
END SELECT
```
**Memory State (End of Execution):**
```text
Result    = 2            (number)
ExecCount = 1            (number)
Grade     = 2            (number)
```

---

### WHILE...WEND Statement

**Syntax:** `WHILE condition ... WEND`

Executes a series of statements as long as a specified condition is true. It is the legacy predecessor to DO WHILE...LOOP.

**Example:**
```basic
I = 1
WHILE I < 4
  PRINT I;
  I = I + 1
WEND
```
**Output:**
```text
 1  2  3 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **No Native Exit**: Unlike DO or FOR, QBasic does not support 'EXIT WHILE'. Early termination must be achieved via GOTO or RETURN.
2. **Pre-test Only**: The condition is evaluated before the loop begins. If initially false (0), the body executes 0 times.

```basic
Runs = 0: ValA = 1
WHILE ValA
  Runs = Runs + 1
  IF Runs = 2 THEN GOTO EscapeWhile
WEND
EscapeWhile:

FalseRuns = 0
WHILE 0
  FalseRuns = 99
WEND
```
**Memory State (End of Execution):**
```text
Runs      = 2            (number)
FalseRuns = 0            (number)
```

---

## CORE: Memory, Types & Structures

### Default Implicit Typing (SINGLE)

**Syntax:** `Variable = value`

By default, QBasic treats all undeclared variables without a type suffix as Single-precision floats (!). They retain fractional values without rounding.

**Example:**
```basic
DefaultFloat = 3.14
PRINT DefaultFloat
```
**Output:**
```text
 3.14 
```

#### 🔬 Hardware Quirks & Edge Cases

Ensures the engine natively defaults to Single precision when no DEF type or suffix is active.

```basic
DefaultFloat = 3.14
```
**Memory State (End of Execution):**
```text
DefaultFloat = 3.14         (number)
```

---

### DEFINT Statement

**Syntax:** `DEFINT letter[-letter]`

Sets the default data type for variables to Integer.

**Example:**
```basic
DEFINT A-Z
Score = 10.8
PRINT Score
```
**Output:**
```text
 11 
```

#### 🔬 Hardware Quirks & Edge Cases

Forces all untyped variables starting with specified letters to automatically become integers. Floating-point assignments to these variables are mathematically rounded (Banker's rounding).

```basic
DEFINT A-Z
ImplicitIntA = 2.5
ImplicitIntB = 2.6
```
**Memory State (End of Execution):**
```text
ImplicitIntA = 2            (number)
ImplicitIntB = 3            (number)
```

---

### DEFSNG Statement

**Syntax:** `DEFSNG letter[-letter]`

Sets the default data type for variables to Single-precision float.

**Example:**
```basic
DEFSNG A-Z
Score = 10.8
PRINT Score
```
**Output:**
```text
 10.8 
```

#### 🔬 Hardware Quirks & Edge Cases

Forces untyped variables to default to Single-precision. This preserves fractional values without mathematical rounding. While QBasic defaults to Single precision natively, DEFSNG is used to explicitly override a previous DEFINT.

```basic
DEFINT A-Z
DEFSNG A-Z
ImplicitSng = 5.8
```
**Memory State (End of Execution):**
```text
ImplicitSng = 5.8          (number)
```

---

### Explicit Type Suffix Override

**Syntax:** `Variable[%, &, !, #, $]`

Explicit type declaration suffixes.

**Example:**
```basic
DEFINT A-Z
PRINT 5.5!
```
**Output:**
```text
 5.5 
```

#### 🔬 Hardware Quirks & Edge Cases

Even if DEFINT is active, appending a specific type suffix (like ! for Single Precision Float) overrides the implicit rule and preserves the fractional value.

```basic
DEFINT A-Z
OverrideFloat! = 3.14
```
**Memory State (End of Execution):**
```text
OverrideFloat! = 3.14         (number)
```

---

### Memory Aliasing (DIM AS STRING)

**Syntax:** `DIM variable AS type`

Declares a variable and allocates memory space.

**Example:**
```basic
DIM Name AS STRING
Name = "NIBBLES"
PRINT Name$
```
**Output:**
```text
NIBBLES
```

#### 🔬 Hardware Quirks & Edge Cases

Declaring a variable with an explicit type (e.g., AS STRING) internally links it to its MS-DOS suffixed counterpart. Writing to the base name updates the suffixed name, as they share the exact same memory pointer.

```basic
DIM AliasTest AS STRING
AliasTest = "NIBBLES"
Extracted$ = AliasTest$
```
**Memory State (End of Execution):**
```text
Extracted$ = "NIBBLES"    (string)
```

---

### Fixed-Length String Padding

**Syntax:** `DIM variable AS STRING * length`

Declares a string with a fixed memory length.

**Example:**
```basic
DIM S AS STRING * 5
S = "HI"
PRINT S; "THERE"
```
**Output:**
```text
HI   THERE
```

#### 🔬 Hardware Quirks & Edge Cases

Allocating a Fixed-Length String locks a specific memory block. If a shorter string is assigned, it is automatically padded with spaces on the right to fill the block.

```basic
DIM PadStr AS STRING * 5
PadStr = "HI"
PadLen = LEN(PadStr)
```
**Memory State (End of Execution):**
```text
PadStr = "HI   "      (string)
PadLen = 5            (number)
```

---

### Fixed-Length String Truncation

**Syntax:** `DIM variable AS STRING * length`

Prevents memory overflow during assignment.

**Example:**
```basic
DIM S AS STRING * 3
S = "123456"
PRINT S
```
**Output:**
```text
123
```

#### 🔬 Hardware Quirks & Edge Cases

If a string longer than the locked memory block is assigned, MS-DOS silently truncates the overflow without throwing an error.

```basic
DIM TruncStr AS STRING * 3
TruncStr = "123456"
```
**Memory State (End of Execution):**
```text
TruncStr = "123"        (string)
```

---

### SWAP Statement

**Syntax:** `SWAP variable1, variable2`

Exchanges the values of two variables of the same type. Works with scalars, array elements, and UDT properties.

**Example:**
```basic
A = 1: B = 2
SWAP A, B
PRINT A; B
```
**Output:**
```text
 2  1 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **Memory Type Integrity**: SWAP must work seamlessly across direct environment variables and complex array indices.
2. **Reference Decoupling**: In memory-managed languages (like JS), swapping object references directly can entangle them. A purist VM must deep-clone the values to safely exchange them.
3. **Fixed-Length Preservation**: Swapping UDTs or Fixed-Length Strings must mutate the memory IN PLACE, otherwise the fixed-length constraint is permanently destroyed.

```basic
' 1. Scalar Swap
ValA = 10: ValB = 99
SWAP ValA, ValB

' 2. Array Indices Swap
DIM SwapArr(2)
SwapArr(1) = 42: SwapArr(2) = 77
SWAP SwapArr(1), SwapArr(2)
ArrRes1 = SwapArr(1)
ArrRes2 = SwapArr(2)

' 3. Fixed-Length String Swap Integrity
TYPE SwapType
  F AS STRING * 4
END TYPE
DIM ST1 AS SwapType, ST2 AS SwapType
ST1.F = "A"
ST2.F = "B"
SWAP ST1, ST2
ST1.F = "Z"
FixedLenAfterSwap = LEN(ST1.F)
```
**Memory State (End of Execution):**
```text
ValA              = 99           (number)
ValB              = 10           (number)
ArrRes1           = 77           (number)
ArrRes2           = 42           (number)
FixedLenAfterSwap = 4            (number)
```

---

### ERASE Statement

**Syntax:** `ERASE arrayname [, arrayname] ...`

Reinitializes elements of static arrays and completely deallocates dynamic arrays from memory.

**Example:**
```basic
DIM Arr(5)
Arr(1) = 42
ERASE Arr
PRINT Arr(1)
```
**Output:**
```text
 0 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **Static Array Reset**: For statically dimensioned arrays, ERASE does not destroy the array footprint. It iterates and resets numeric arrays to 0, and string arrays to empty strings ("").
2. **Type Protection**: Erasing an array of UDTs containing Fixed-Length strings must softly reset the string's content without destroying its prototype length.

```basic
' 1. Numeric Array Erase
DIM NumArr(2)
NumArr(1) = 42: NumArr(2) = 99
ERASE NumArr
CheckNum1 = NumArr(1)
CheckNum2 = NumArr(2)

' 2. String Array Erase
DIM StrArr$(1)
StrArr$(1) = "Hello World"
ERASE StrArr$
CheckStr$ = StrArr$(1)

' 3. UDT with Fixed-Length String Erase
TYPE EraseType
  F AS STRING * 4
END TYPE
DIM EArr(1) AS EraseType
EArr(1).F = "TEST"
ERASE EArr
EArr(1).F = "X"
FixedLenAfterErase = LEN(EArr(1).F)
```
**Memory State (End of Execution):**
```text
CheckNum1          = 0            (number)
CheckNum2          = 0            (number)
CheckStr$          = ""           (string)
FixedLenAfterErase = 4            (number)
```

---

## CORE: Procedures & Functions

### CALL Statement

**Syntax:** `CALL subname([argumentlist])`

Transfers control to a subroutine. Arguments are passed by reference by default, allowing the subroutine to directly modify the caller's variables.

**Example:**
```basic
A = 10
CALL Multiply(A)
PRINT A
END
SUB Multiply(X)
  X = X * 2
END SUB
```
**Output:**
```text
 20 
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRKS:
1. **Pass by Reference (Default)**: Passing a raw variable directly links the subroutine's parameter to the caller's memory address.
2. **Pass by Value (Forced)**: Enclosing a variable in extra parentheses explicitly evaluates it as an expression (an R-Value), forcing a disconnected copy to be passed.
3. **Multiple Parentheses**: Nesting parentheses, such as (((X))), must strictly resolve as a single R-Value without corrupting the AST or evaluation.

```basic
RefVar = 10
ValVar = 10
DeepVar = 10
CALL ScopeTest(RefVar, (ValVar), (((DeepVar))))
GOTO EndCallTest

SUB ScopeTest (ArgRef, ArgVal, ArgDeep)
  ArgRef = 99
  ArgVal = 99
  ArgDeep = 99
END SUB

EndCallTest:
```
**Memory State (End of Execution):**
```text
RefVar  = 99           (number)
ValVar  = 10           (number)
DeepVar = 10           (number)
```

---
