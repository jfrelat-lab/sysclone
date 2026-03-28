# Sysclone Turbo Pascal Compatibility Reference

> **Auto-generated** from Truth Vectors. This document serves as the absolute specification for MS-DOS Turbo Pascal behavior.

## 🔠 Alphabetical Index

[Addition Operator (+)](#addition-operator-) • [Address Operator (@)](#address-operator-) • [ARRAY (Arbitrary Integer Bounds)](#array-arbitrary-integer-bounds-) • [ARRAY (Character Bounds)](#array-character-bounds-) • [ARRAY (Multi-Dimensional)](#array-multi-dimensional-) • [Bit Shift Left (SHL)](#bit-shift-left-shl-) • [Bit Shift Right (SHR)](#bit-shift-right-shr-) • [Bitwise AND Operator](#bitwise-and-operator) • [Bitwise NOT Operator](#bitwise-not-operator) • [Bitwise OR Operator](#bitwise-or-operator) • [Bitwise XOR Operator](#bitwise-xor-operator) • [Boolean Type Fundamentals](#boolean-type-fundamentals) • [CASE..OF (Multiple Branching)](#case-of-multiple-branching-) • [Chr Function](#chr-function) • [Copy (Function)](#copy-function-) • [Dec Procedure](#dec-procedure) • [Delete (Procedure)](#delete-procedure-) • [Dereference Operator (^)](#dereference-operator-) • [Equality Operator (=)](#equality-operator-) • [FOR..DOWNTO (Decrementing Loop)](#for-downto-decrementing-loop-) • [FOR..TO (Incrementing Loop)](#for-to-incrementing-loop-) • [Function (Declaration and Return)](#function-declaration-and-return-) • [Greater Than Operator (>)](#greater-than-operator-) • [Greater Than or Equal Operator (>=)](#greater-than-or-equal-operator-) • [IF..THEN..ELSE (Conditional Branching)](#if-then-else-conditional-branching-) • [Inc Procedure](#inc-procedure) • [Inequality Operator (<>)](#inequality-operator-) • [Insert (Procedure)](#insert-procedure-) • [Int Function](#int-function) • [Integer Division (DIV)](#integer-division-div-) • [Length (Function)](#length-function-) • [Less Than Operator (<)](#less-than-operator-) • [Less Than or Equal Operator (<=)](#less-than-or-equal-operator-) • [Logical AND Operator](#logical-and-operator) • [Logical NOT Operator](#logical-not-operator) • [Logical OR Operator](#logical-or-operator) • [Logical XOR Operator](#logical-xor-operator) • [Modulo Operator (MOD)](#modulo-operator-mod-) • [Multiplication Operator (*)](#multiplication-operator-) • [Operator Precedence Matrix](#operator-precedence-matrix) • [Ord Function](#ord-function) • [Parameters (Pass by Value)](#parameters-pass-by-value-) • [Pos (Function)](#pos-function-) • [Procedure (Declaration and Call)](#procedure-declaration-and-call-) • [Real Division Operator (/)](#real-division-operator-) • [RECORD (Basic Field Access)](#record-basic-field-access-) • [REPEAT..UNTIL (Post-Condition Loop)](#repeat-until-post-condition-loop-) • [Round Function](#round-function) • [Scope (Global Visibility)](#scope-global-visibility-) • [Scope (Local and Variable Shadowing)](#scope-local-and-variable-shadowing-) • [Set Membership Operator (IN)](#set-membership-operator-in-) • [SizeOf Function](#sizeof-function) • [Str (Integer Basic Conversion)](#str-integer-basic-conversion-) • [Str (Integer Width Overflow)](#str-integer-width-overflow-) • [Str (Integer Width Padding)](#str-integer-width-padding-) • [Str (Real Fixed-Point Conversion)](#str-real-fixed-point-conversion-) • [Str (Real Fixed-Point Padding)](#str-real-fixed-point-padding-) • [Str (Real Fixed-Point Rounding)](#str-real-fixed-point-rounding-) • [String (1-Based Access & Length Byte)](#string-1-based-access-length-byte-) • [String Concatenation Operator (+)](#string-concatenation-operator-) • [Subtraction Operator (-)](#subtraction-operator-) • [Succ and Pred Functions](#succ-and-pred-functions) • [Trunc Function](#trunc-function) • [Unary Minus Operator (-)](#unary-minus-operator-) • [Val (Procedure: String to Number)](#val-procedure-string-to-number-) • [VAR Parameters (Pass by Reference)](#var-parameters-pass-by-reference-) • [WHILE..DO (Pre-Condition Loop)](#while-do-pre-condition-loop-) • [WITH (Record Scope Resolution)](#with-record-scope-resolution-)

---

## 📚 Thematic Contents

- **STDLIB: Formatting Engine (Str)**
  - [Str (Integer Basic Conversion)](#str-integer-basic-conversion-)
  - [Str (Integer Width Padding)](#str-integer-width-padding-)
  - [Str (Integer Width Overflow)](#str-integer-width-overflow-)
  - [Str (Real Fixed-Point Conversion)](#str-real-fixed-point-conversion-)
  - [Str (Real Fixed-Point Padding)](#str-real-fixed-point-padding-)
  - [Str (Real Fixed-Point Rounding)](#str-real-fixed-point-rounding-)
- **CORE: Logic, Boolean & Bitwise**
  - [Boolean Type Fundamentals](#boolean-type-fundamentals)
  - [Logical NOT Operator](#logical-not-operator)
  - [Logical AND Operator](#logical-and-operator)
  - [Logical OR Operator](#logical-or-operator)
  - [Logical XOR Operator](#logical-xor-operator)
  - [Bitwise NOT Operator](#bitwise-not-operator)
  - [Bitwise AND Operator](#bitwise-and-operator)
  - [Bitwise OR Operator](#bitwise-or-operator)
  - [Bitwise XOR Operator](#bitwise-xor-operator)
  - [Bit Shift Left (SHL)](#bit-shift-left-shl-)
  - [Bit Shift Right (SHR)](#bit-shift-right-shr-)
- **STDLIB: Math Built-ins**
  - [Int Function](#int-function)
  - [Trunc Function](#trunc-function)
  - [Round Function](#round-function)
  - [Integer Division (DIV)](#integer-division-div-)
  - [Modulo Operator (MOD)](#modulo-operator-mod-)
- **CORE: Operators & Precedence**
  - [Unary Minus Operator (-)](#unary-minus-operator-)
  - [Address Operator (@)](#address-operator-)
  - [Dereference Operator (^)](#dereference-operator-)
  - [Multiplication Operator (*)](#multiplication-operator-)
  - [Real Division Operator (/)](#real-division-operator-)
  - [Addition Operator (+)](#addition-operator-)
  - [Subtraction Operator (-)](#subtraction-operator-)
  - [String Concatenation Operator (+)](#string-concatenation-operator-)
  - [Equality Operator (=)](#equality-operator-)
  - [Inequality Operator (<>)](#inequality-operator-)
  - [Less Than Operator (<)](#less-than-operator-)
  - [Greater Than Operator (>)](#greater-than-operator-)
  - [Less Than or Equal Operator (<=)](#less-than-or-equal-operator-)
  - [Greater Than or Equal Operator (>=)](#greater-than-or-equal-operator-)
  - [Set Membership Operator (IN)](#set-membership-operator-in-)
  - [Operator Precedence Matrix](#operator-precedence-matrix)
- **STDLIB: String Manipulation & Casting**
  - [Copy (Function)](#copy-function-)
  - [Delete (Procedure)](#delete-procedure-)
  - [Insert (Procedure)](#insert-procedure-)
  - [Length (Function)](#length-function-)
  - [Pos (Function)](#pos-function-)
  - [String (1-Based Access & Length Byte)](#string-1-based-access-length-byte-)
  - [Val (Procedure: String to Number)](#val-procedure-string-to-number-)
- **STDLIB: System & Ordinal Routines**
  - [Inc Procedure](#inc-procedure)
  - [Dec Procedure](#dec-procedure)
  - [Succ and Pred Functions](#succ-and-pred-functions)
  - [Ord Function](#ord-function)
  - [Chr Function](#chr-function)
  - [SizeOf Function](#sizeof-function)
- **CORE: Control Flow & Loops**
  - [CASE..OF (Multiple Branching)](#case-of-multiple-branching-)
  - [FOR..DOWNTO (Decrementing Loop)](#for-downto-decrementing-loop-)
  - [FOR..TO (Incrementing Loop)](#for-to-incrementing-loop-)
  - [IF..THEN..ELSE (Conditional Branching)](#if-then-else-conditional-branching-)
  - [REPEAT..UNTIL (Post-Condition Loop)](#repeat-until-post-condition-loop-)
  - [WHILE..DO (Pre-Condition Loop)](#while-do-pre-condition-loop-)
- **CORE: Data Structures (Arrays & Records)**
  - [ARRAY (Arbitrary Integer Bounds)](#array-arbitrary-integer-bounds-)
  - [ARRAY (Character Bounds)](#array-character-bounds-)
  - [ARRAY (Multi-Dimensional)](#array-multi-dimensional-)
  - [RECORD (Basic Field Access)](#record-basic-field-access-)
  - [WITH (Record Scope Resolution)](#with-record-scope-resolution-)
- **CORE: Procedures, Functions & Scope**
  - [Procedure (Declaration and Call)](#procedure-declaration-and-call-)
  - [Function (Declaration and Return)](#function-declaration-and-return-)
  - [Parameters (Pass by Value)](#parameters-pass-by-value-)
  - [VAR Parameters (Pass by Reference)](#var-parameters-pass-by-reference-)
  - [Scope (Global Visibility)](#scope-global-visibility-)
  - [Scope (Local and Variable Shadowing)](#scope-local-and-variable-shadowing-)

---

## STDLIB: Formatting Engine (Str)

### Str (Integer Basic Conversion)

**Syntax:** `procedure Str(X: Integer; var S: String);`

Converts an integer to its string representation. Unlike some other dialects, Turbo Pascal does not prepend a leading space for positive numbers. Negative numbers are strictly prefixed with a minus sign.

**Example:**
```pascal
Str(42, S);
WriteLn(S);
```
**Output:**
```text
42
```

#### 🔬 Hardware Quirks & Edge Cases

Validates that basic conversion handles sign characters correctly without implicit padding.

```pascal
Str(42, StrIntPos);
Str(-42, StrIntNeg);
```
**Memory State (End of Execution):**
```text
StrIntPos = "42"         (string)
StrIntNeg = "-42"        (string)
```

---

### Str (Integer Width Padding)

**Syntax:** `procedure Str(X: Integer : Width; var S: String);`

When a Width parameter is provided (X:Width), the resulting string is right-aligned and padded with leading spaces if the number's length is less than the specified Width. The minus sign of a negative number is included in this width calculation.

**Example:**
```pascal
Str(42:5, S);
WriteLn(S);
```
**Output:**
```text
   42
```

#### 🔬 Hardware Quirks & Edge Cases

Validates right-alignment and space padding for both positive and negative integers.

```pascal
Str(42:5, StrPadPos);
Str(-42:5, StrPadNeg);
```
**Memory State (End of Execution):**
```text
StrPadPos = "   42"      (string)
StrPadNeg = "  -42"      (string)
```

---

### Str (Integer Width Overflow)

**Syntax:** `procedure Str(X: Integer : Width; var S: String);`

If the specified Width is smaller than the actual number of characters required to represent the integer, Turbo Pascal ignores the Width constraint and outputs the full number without truncation.

**Example:**
```pascal
Str(12345:2, S);
WriteLn(S);
```
**Output:**
```text
12345
```

#### 🔬 Hardware Quirks & Edge Cases

Validates that data integrity takes precedence over the formatting width constraint.

```pascal
Str(12345:2, StrIntOverflow);
```
**Memory State (End of Execution):**
```text
StrIntOverflow = "12345"      (string)
```

---

### Str (Real Fixed-Point Conversion)

**Syntax:** `procedure Str(X: Real : Width : Decimals; var S: String);`

By default, Real numbers are converted using scientific notation. Adding a second colon and a Decimals parameter forces fixed-point notation. A Width of 0 instructs the engine to use exactly as much space as needed, without leading padding.

**Example:**
```pascal
Str(3.14159:0:2, S);
WriteLn(S);
```
**Output:**
```text
3.14
```

#### 🔬 Hardware Quirks & Edge Cases

Validates the override of scientific notation to standard fixed-point decimal string representation.

```pascal
Str(3.14159:0:2, StrRealFix);
```
**Memory State (End of Execution):**
```text
StrRealFix = "3.14"       (string)
```

---

### Str (Real Fixed-Point Padding)

**Syntax:** `procedure Str(X: Real : Width : Decimals; var S: String);`

When both Width and Decimals are provided, the total length of the resulting string (including the integer part, the decimal point, and the decimal digits) is padded with leading spaces to meet the Width requirement.

**Example:**
```pascal
Str(3.14:6:2, S);
WriteLn(S);
```
**Output:**
```text
  3.14
```

#### 🔬 Hardware Quirks & Edge Cases

Validates the global width calculation for real numbers (3 chars for '3.1', plus 1 for '4' = 4 chars. Padded to 6 results in 2 leading spaces).

```pascal
Str(3.14:6:2, StrRealPad);
```
**Memory State (End of Execution):**
```text
StrRealPad = "  3.14"     (string)
```

---

### Str (Real Fixed-Point Rounding)

**Syntax:** `procedure Str(X: Real : Width : Decimals; var S: String);`

When formatting constraints reduce the number of visible decimals, the Str procedure mathematically rounds the last visible digit (rounding half away from zero) rather than simply truncating the string.

**Example:**
```pascal
Str(3.8:0:0, S);
WriteLn(S);
```
**Output:**
```text
4
```

#### 🔬 Hardware Quirks & Edge Cases

Validates that formatting is not just string manipulation, but involves arithmetic rounding.

```pascal
Str(3.15:0:1, StrRealRoundUp);
Str(3.14:0:1, StrRealRoundDown);
Str(3.8:0:0, StrRealNoDecimals);
```
**Memory State (End of Execution):**
```text
StrRealRoundUp    = "3.2"        (string)
StrRealRoundDown  = "3.1"        (string)
StrRealNoDecimals = "4"          (string)
```

---

## CORE: Logic, Boolean & Bitwise

### Boolean Type Fundamentals

**Syntax:** `Type Boolean = (False, True);`

Turbo Pascal implements a strict Boolean type natively. In memory, it is an ordinal type where False evaluates to 0 and True evaluates to 1.

**Example:**
```pascal
WriteLn(Ord(True));
```
**Output:**
```text
1
```

#### 🔬 Hardware Quirks & Edge Cases

Validates the native ordinal memory mapping of Boolean values.

```pascal
BoolTrue := True;
BoolFalse := False;
OrdTrue := Ord(True);
OrdFalse := Ord(False);
```
**Memory State (End of Execution):**
```text
BoolTrue  = true         (boolean)
BoolFalse = false        (boolean)
OrdTrue   = 1            (integer)
OrdFalse  = 0            (integer)
```

---

### Logical NOT Operator

**Syntax:** `NOT Operand: Boolean; { Returns Boolean }`

Inverts the truth value of a Boolean expression.

**Example:**
```pascal
WriteLn(NOT True);
```
**Output:**
```text
FALSE
```

#### 🔬 Hardware Quirks & Edge Cases

When applied to a Boolean type, NOT performs a pure logical negation.

```pascal
NotTrue := NOT True;
NotFalse := NOT False;
```
**Memory State (End of Execution):**
```text
NotTrue  = false        (boolean)
NotFalse = true         (boolean)
```

---

### Logical AND Operator

**Syntax:** `Operand1: Boolean AND Operand2: Boolean; { Returns Boolean }`

Performs a logical conjunction on two Boolean expressions. By default, Turbo Pascal employs short-circuit evaluation ({$B-}).

**Example:**
```pascal
WriteLn(True AND False);
```
**Output:**
```text
FALSE
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL ARCHITECTURE: If the first operand of an AND is False, the second operand is skipped entirely. This test validates short-circuiting by attempting a division by zero using a variable (to bypass compile-time constant folding). If evaluated at runtime, it would trigger Runtime Error 200.

```pascal
LogAndBase := True AND False;
ZeroVarAnd := 0;
SurvivedAndShort := False;
IF (False) AND (10 DIV ZeroVarAnd = 1) THEN SurvivedAndShort := False ELSE SurvivedAndShort := True;
```
**Memory State (End of Execution):**
```text
LogAndBase       = false        (boolean)
ZeroVarAnd       = 0            (integer)
SurvivedAndShort = true         (boolean)
```

---

### Logical OR Operator

**Syntax:** `Operand1: Boolean OR Operand2: Boolean; { Returns Boolean }`

Performs a logical disjunction on two Boolean expressions. Also subject to short-circuit evaluation ({$B-}).

**Example:**
```pascal
WriteLn(True OR False);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL ARCHITECTURE: If the first operand of an OR is True, the compiler knows the overall expression is True and skips the second operand.

```pascal
LogOrBase := True OR False;
ZeroVarOr := 0;
SurvivedOrShort := False;
IF (True) OR (10 DIV ZeroVarOr = 1) THEN SurvivedOrShort := True ELSE SurvivedOrShort := False;
```
**Memory State (End of Execution):**
```text
LogOrBase       = true         (boolean)
ZeroVarOr       = 0            (integer)
SurvivedOrShort = true         (boolean)
```

---

### Logical XOR Operator

**Syntax:** `Operand1: Boolean XOR Operand2: Boolean; { Returns Boolean }`

Performs a logical exclusive disjunction. Returns True if operands are strictly different.

**Example:**
```pascal
WriteLn(True XOR True);
```
**Output:**
```text
FALSE
```

#### 🔬 Hardware Quirks & Edge Cases

Unlike AND/OR, XOR cannot be short-circuited because both operands are always mathematically required to determine the final state.

```pascal
LogXorDiff := True XOR False;
LogXorSame := True XOR True;
```
**Memory State (End of Execution):**
```text
LogXorDiff = true         (boolean)
LogXorSame = false        (boolean)
```

---

### Bitwise NOT Operator

**Syntax:** `NOT Operand: Integer; { Returns Integer }`

Performs a bitwise one's complement operation on the binary representation of an ordinal integer type.

**Example:**
```pascal
WriteLn(NOT 0);
```
**Output:**
```text
-1
```

#### 🔬 Hardware Quirks & Edge Cases

Turbo Pascal overloads the NOT operator based on the operand type. When given an integer, it flips all bits (e.g., NOT 0 yields -1 in two's complement arithmetic).

```pascal
BitNotZero := NOT 0;
BitNotPos := NOT 1;
```
**Memory State (End of Execution):**
```text
BitNotZero = -1           (integer)
BitNotPos  = -2           (integer)
```

---

### Bitwise AND Operator

**Syntax:** `Operand1: Integer AND Operand2: Integer; { Returns Integer }`

Performs a bitwise logical AND between the bits of two integers.

**Example:**
```pascal
WriteLn(170 AND 85);
```
**Output:**
```text
0
```

#### 🔬 Hardware Quirks & Edge Cases

Overloaded for integers. Evaluates strictly at the bit level without any short-circuiting mechanics. (170 is $AA, 85 is $55).

```pascal
BitAndEx := 170 AND 85;
```
**Memory State (End of Execution):**
```text
BitAndEx = 0            (integer)
```

---

### Bitwise OR Operator

**Syntax:** `Operand1: Integer OR Operand2: Integer; { Returns Integer }`

Performs a bitwise logical OR between the bits of two integers.

**Example:**
```pascal
WriteLn(170 OR 85);
```
**Output:**
```text
255
```

#### 🔬 Hardware Quirks & Edge Cases

Combines the bits of two integer values.

```pascal
BitOrEx := 170 OR 85;
```
**Memory State (End of Execution):**
```text
BitOrEx = 255          (integer)
```

---

### Bitwise XOR Operator

**Syntax:** `Operand1: Integer XOR Operand2: Integer; { Returns Integer }`

Performs a bitwise logical Exclusive OR between two integers.

**Example:**
```pascal
WriteLn(170 XOR 255);
```
**Output:**
```text
85
```

#### 🔬 Hardware Quirks & Edge Cases

Toggles bits where the mask has a 1.

```pascal
BitXorEx := 170 XOR 255;
```
**Memory State (End of Execution):**
```text
BitXorEx = 85           (integer)
```

---

### Bit Shift Left (SHL)

**Syntax:** `Value: Integer SHL Count: Byte; { Returns Integer }`

Shifts the bits of an integer value to the left by the specified count, filling vacated bits with zeros.

**Example:**
```pascal
WriteLn(1 SHL 3);
```
**Output:**
```text
8
```

#### 🔬 Hardware Quirks & Edge Cases

A low-level arithmetic shift, highly optimized by the compiler. Functionally equivalent to multiplying by 2^Count.

```pascal
ShlEx := 1 SHL 3;
```
**Memory State (End of Execution):**
```text
ShlEx = 8            (integer)
```

---

### Bit Shift Right (SHR)

**Syntax:** `Value: Integer SHR Count: Byte; { Returns Integer }`

Shifts the bits of an integer value to the right by the specified count, filling vacated bits with zeros.

**Example:**
```pascal
WriteLn(8 SHR 1);
```
**Output:**
```text
4
```

#### 🔬 Hardware Quirks & Edge Cases

Logical right shift. Equivalent to an integer division by 2^Count.

```pascal
ShrEx := 8 SHR 1;
```
**Memory State (End of Execution):**
```text
ShrEx = 4            (integer)
```

---

## STDLIB: Math Built-ins

### Int Function

**Syntax:** `function Int(X: Real): Real;`

Returns the integer part of a real number.

**Example:**
```pascal
WriteLn(Int(2.8):0:2);
```
**Output:**
```text
2.00
```

#### 🔬 Hardware Quirks & Edge Cases

The Int() function returns a REAL type, not an integer. It simply truncates the decimal part without rounding.

```pascal
IntPos := Int(2.8);
IntNeg := Int(-2.8);
```
**Memory State (End of Execution):**
```text
IntPos = 2            (float)
IntNeg = -2           (float)
```

---

### Trunc Function

**Syntax:** `function Trunc(X: Real): Longint;`

Truncates a real-type value to an integer-type value.

**Example:**
```pascal
WriteLn(Trunc(2.8));
```
**Output:**
```text
2
```

#### 🔬 Hardware Quirks & Edge Cases

It removes the fractional part, rounding toward zero.

```pascal
TruncPos := Trunc(2.8);
TruncNeg := Trunc(-2.8);
```
**Memory State (End of Execution):**
```text
TruncPos = 2            (number)
TruncNeg = -2           (number)
```

---

### Round Function

**Syntax:** `function Round(X: Real): Longint;`

Rounds a real-type value to the nearest integer. If the value is exactly halfway between two integers, it rounds to the number with the greatest absolute magnitude (away from zero).

**Example:**
```pascal
WriteLn(Round(2.5));
```
**Output:**
```text
3
```

#### 🔬 Hardware Quirks & Edge Cases

Turbo Pascal employs standard arithmetic rounding (rounding away from zero). A fractional part of exactly .5 will always be rounded to the number with the greatest absolute magnitude, meaning positive numbers round up and negative numbers round down.

```pascal
RoundUp := Round(2.6);
RoundHalf := Round(2.5);
RoundHalfOdd := Round(3.5);
RoundNegHalf := Round(-2.5);
```
**Memory State (End of Execution):**
```text
RoundUp      = 3            (number)
RoundHalf    = 3            (number)
RoundHalfOdd = 4            (number)
RoundNegHalf = -3           (number)
```

---

### Integer Division (DIV)

**Syntax:** `Operand1: Longint DIV Operand2: Longint; { Returns Longint }`

Performs integer division. Truncates the result towards zero.

**Example:**
```pascal
WriteLn(10 DIV 3);
```
**Output:**
```text
3
```

#### 🔬 Hardware Quirks & Edge Cases

Unlike standard real division (/), DIV strictly returns an integer.

```pascal
IntDiv := 10 DIV 3;
```
**Memory State (End of Execution):**
```text
IntDiv = 3            (number)
```

---

### Modulo Operator (MOD)

**Syntax:** `Operand1: Longint MOD Operand2: Longint; { Returns Longint }`

Returns the remainder of integer division.

**Example:**
```pascal
WriteLn(10 MOD 3);
```
**Output:**
```text
1
```

#### 🔬 Hardware Quirks & Edge Cases

Standard modulo arithmetic. The sign of the result depends on the dividend.

```pascal
ModNorm := 10 MOD 3;
ModNeg := -10 MOD 3;
```
**Memory State (End of Execution):**
```text
ModNorm = 1            (number)
ModNeg  = -1           (number)
```

---

## CORE: Operators & Precedence

### Unary Minus Operator (-)

**Syntax:** `-Operand: Numeric; { Returns Numeric }`

Negates the value of a numeric operand.

**Example:**
```pascal
WriteLn(-5);
```
**Output:**
```text
-5
```

#### 🔬 Hardware Quirks & Edge Cases

Evaluates at Level 1 (highest precedence) along with NOT and @. It is a unary sign operator, distinct from binary subtraction.

```pascal
UnaryBase := 5;
UnaryNeg := -UnaryBase;
```
**Memory State (End of Execution):**
```text
UnaryBase = 5            (integer)
UnaryNeg  = -5           (integer)
```

---

### Address Operator (@)

**Syntax:** `@Operand: Any; { Returns Pointer }`

Returns the memory address of a variable, procedure, or function.

**Example:**
```pascal
P := @MyVar;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Evaluates at Level 1 precedence. Generates a pointer to the memory location of the operand.

```pascal
AddrTarget := 42;
TestPtr := @AddrTarget;
```
**Memory State (End of Execution):**
```text
AddrTarget = 42           (integer)
TestPtr    = @AddrTarget  (^Integer)
```

---

### Dereference Operator (^)

**Syntax:** `PointerOperand^: BaseType;`

Accesses the value stored at the memory address pointed to by a typed pointer.

**Example:**
```pascal
P^ := 99;
WriteLn(P^);
```
**Output:**
```text
99
```

#### 🔬 Hardware Quirks & Edge Cases

A postfix operator. Modifying the dereferenced pointer directly mutates the original variable residing at that memory address.

```pascal
DerefTarget := 10;
TestPtrDeref := @DerefTarget;
TestPtrDeref^ := 99;
```
**Memory State (End of Execution):**
```text
DerefTarget  = 99           (integer)
TestPtrDeref = @DerefTarget (^Integer)
```

---

### Multiplication Operator (*)

**Syntax:** `Operand1: Numeric * Operand2: Numeric; { Returns Numeric }`

Performs arithmetic multiplication.

**Example:**
```pascal
WriteLn(6 * 7);
```
**Output:**
```text
42
```

#### 🔬 Hardware Quirks & Edge Cases

Level 2 precedence. If both operands are integers, returns an integer. If one is real, returns a real. (Note: Also used for Set intersection, not covered here).

```pascal
MulRes := 6 * 7;
```
**Memory State (End of Execution):**
```text
MulRes = 42           (integer)
```

---

### Real Division Operator (/)

**Syntax:** `Operand1: Numeric / Operand2: Numeric; { Returns Real }`

Performs real division.

**Example:**
```pascal
WriteLn(10 / 2:0:1);
```
**Output:**
```text
5.0
```

#### 🔬 Hardware Quirks & Edge Cases

Level 2 precedence. The division operator (/) ALWAYS returns a Real type, even if both operands are integers and the division is mathematically exact.

```pascal
DivRes := 10 / 4;
```
**Memory State (End of Execution):**
```text
DivRes = 2.5          (float)
```

---

### Addition Operator (+)

**Syntax:** `Operand1: Numeric + Operand2: Numeric; { Returns Numeric }`

Performs arithmetic addition.

**Example:**
```pascal
WriteLn(10 + 5);
```
**Output:**
```text
15
```

#### 🔬 Hardware Quirks & Edge Cases

Level 3 precedence. (Note: Also used for Set union, not covered here).

```pascal
AddRes := 10 + 5;
```
**Memory State (End of Execution):**
```text
AddRes = 15           (integer)
```

---

### Subtraction Operator (-)

**Syntax:** `Operand1: Numeric - Operand2: Numeric; { Returns Numeric }`

Performs arithmetic subtraction.

**Example:**
```pascal
WriteLn(10 - 5);
```
**Output:**
```text
5
```

#### 🔬 Hardware Quirks & Edge Cases

Level 3 precedence. Evaluates left-to-right when chained with addition. (Note: Also used for Set difference, not covered here).

```pascal
SubRes := 10 - 5;
```
**Memory State (End of Execution):**
```text
SubRes = 5            (integer)
```

---

### String Concatenation Operator (+)

**Syntax:** `Operand1: String + Operand2: String; { Returns String }`

The addition operator is overloaded to perform string concatenation when applied to String or Char types.

**Example:**
```pascal
WriteLn('Turbo' + ' Pascal');
```
**Output:**
```text
Turbo Pascal
```

#### 🔬 Hardware Quirks & Edge Cases

Concatenates dynamically. If the resulting string exceeds 255 characters, it is silently truncated at runtime.

```pascal
ConcatRes := 'Sys' + 'clone';
```
**Memory State (End of Execution):**
```text
ConcatRes = "Sysclone"   (string)
```

---

### Equality Operator (=)

**Syntax:** `Expr1 = Expr2; { Returns Boolean }`

Evaluates to True if both expressions are equal.

**Example:**
```pascal
WriteLn(5 = 5);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

Level 4 precedence (lowest). String comparisons are strictly case-sensitive.

```pascal
EqRes := (5 = 5);
```
**Memory State (End of Execution):**
```text
EqRes = true         (boolean)
```

---

### Inequality Operator (<>)

**Syntax:** `Expr1 <> Expr2; { Returns Boolean }`

Evaluates to True if expressions are not equal.

**Example:**
```pascal
WriteLn(5 <> 4);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

Level 4 precedence.

```pascal
NeqRes := (5 <> 4);
```
**Memory State (End of Execution):**
```text
NeqRes = true         (boolean)
```

---

### Less Than Operator (<)

**Syntax:** `Expr1 < Expr2; { Returns Boolean }`

Evaluates to True if the left expression is strictly less than the right.

**Example:**
```pascal
WriteLn(4 < 5);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

Level 4 precedence.

```pascal
LtRes := (4 < 5);
```
**Memory State (End of Execution):**
```text
LtRes = true         (boolean)
```

---

### Greater Than Operator (>)

**Syntax:** `Expr1 > Expr2; { Returns Boolean }`

Evaluates to True if the left expression is strictly greater than the right.

**Example:**
```pascal
WriteLn(5 > 4);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

Level 4 precedence.

```pascal
GtRes := (5 > 4);
```
**Memory State (End of Execution):**
```text
GtRes = true         (boolean)
```

---

### Less Than or Equal Operator (<=)

**Syntax:** `Expr1 <= Expr2; { Returns Boolean }`

Evaluates to True if the left expression is less than or equal to the right.

**Example:**
```pascal
WriteLn(5 <= 5);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

Level 4 precedence. (Note: Also used to test if Set1 is a subset of Set2).

```pascal
LteRes := (5 <= 5);
```
**Memory State (End of Execution):**
```text
LteRes = true         (boolean)
```

---

### Greater Than or Equal Operator (>=)

**Syntax:** `Expr1 >= Expr2; { Returns Boolean }`

Evaluates to True if the left expression is greater than or equal to the right.

**Example:**
```pascal
WriteLn(5 >= 5);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

Level 4 precedence. (Note: Also used to test if Set1 is a superset of Set2).

```pascal
GteRes := (5 >= 5);
```
**Memory State (End of Execution):**
```text
GteRes = true         (boolean)
```

---

### Set Membership Operator (IN)

**Syntax:** `Element IN Set: Boolean;`

Evaluates to True if the element is a member of the specified set.

**Example:**
```pascal
WriteLn(3 IN [1..5]);
```
**Output:**
```text
TRUE
```

#### 🔬 Hardware Quirks & Edge Cases

Level 4 precedence. Operates on ordinal types and sets.

```pascal
InResTrue := 3 IN [1, 2, 3, 4, 5];
InResFalse := 9 IN [1, 2, 3];
```
**Memory State (End of Execution):**
```text
InResTrue  = true         (boolean)
InResFalse = false        (boolean)
```

---

### Operator Precedence Matrix

**Syntax:** `L1(@, NOT) > L2(*, /, DIV, MOD, AND, SHL, SHR) > L3(+, -, OR, XOR) > L4(=, <>, <, >, <=, >=, IN)`

Defines the strict hierarchy of expression evaluation. Operators with higher precedence are evaluated first.

**Example:**
```pascal
WriteLn(2 + 3 * 4);
```
**Output:**
```text
14
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL COMPILE-TIME QUIRK: Logical operators (AND/OR, Level 2/3) have higher precedence than relational operators (=/<, Level 4). Expressions like 'A = 1 AND B = 2' will throw a Type Mismatch. They MUST be parenthesized: '(A = 1) AND (B = 2)'. This test validates the full chain.

```pascal
PrecChain1 := (5 + 2 * 3 = 11);
PrecChain2 := (10 - 6 / 2 = 7.0);
PrecChain3 := NOT False AND True;
PrecChainFull := PrecChain1 AND PrecChain2 AND PrecChain3 AND (3 IN [1..5]);
```
**Memory State (End of Execution):**
```text
PrecChain1    = true         (boolean)
PrecChain2    = true         (boolean)
PrecChain3    = true         (boolean)
PrecChainFull = true         (boolean)
```

---

## STDLIB: String Manipulation & Casting

### Copy (Function)

**Syntax:** `function Copy(S: String; Index: Integer; Count: Integer): String;`

Returns a substring containing Count characters, starting from Index.

**Example:**
```pascal
WriteLn(Copy('Turbo Pascal', 1, 5));
```
**Output:**
```text
Turbo
```

#### 🔬 Hardware Quirks & Edge Cases

If the Index is greater than the string length, Copy returns an empty string. If Count exceeds the remaining characters, it gracefully returns only what is available without throwing out-of-bounds errors.

```pascal
CopyNorm := Copy('Pascal', 1, 4);
CopyOOB := Copy('Pascal', 10, 2);
CopyTrunc := Copy('Pascal', 4, 10);
```
**Memory State (End of Execution):**
```text
CopyNorm  = "Pasc"       (string)
CopyOOB   = ""           (string)
CopyTrunc = "cal"        (string)
```

---

### Delete (Procedure)

**Syntax:** `procedure Delete(var S: String; Index: Integer; Count: Integer);`

Removes Count characters from string S, starting at Index.

**Example:**
```pascal
S := 'Hello World';
Delete(S, 6, 6);
WriteLn(S);
```
**Output:**
```text
Hello
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRK: This is a Procedure, not a Function. It mutates the string variable IN PLACE. If Index is out of bounds, it simply does nothing.

```pascal
DelStr := 'Hello World';
Delete(DelStr, 6, 6);
DelOOB := 'Test';
Delete(DelOOB, 10, 2);
```
**Memory State (End of Execution):**
```text
DelStr = "Hello"      (string)
DelOOB = "Test"       (string)
```

---

### Insert (Procedure)

**Syntax:** `procedure Insert(Source: String; var S: String; Index: Integer);`

Inserts a Source string into target string S at the specified Index.

**Example:**
```pascal
S := 'World';
Insert('Hello ', S, 1);
WriteLn(S);
```
**Output:**
```text
Hello World
```

#### 🔬 Hardware Quirks & Edge Cases

Like Delete, it mutates the target string IN PLACE. If Index is greater than the current length of S, the Source string is simply concatenated at the end.

```pascal
InsStr := 'World';
Insert('Hello ', InsStr, 1);
InsOOB := 'Hi';
Insert('!', InsOOB, 10);
```
**Memory State (End of Execution):**
```text
InsStr = "Hello World" (string)
InsOOB = "Hi!"        (string)
```

---

### Length (Function)

**Syntax:** `function Length(S: String): Integer;`

Returns the dynamic length of a string.

**Example:**
```pascal
WriteLn(Length('Turbo'));
```
**Output:**
```text
5
```

#### 🔬 Hardware Quirks & Edge Cases

Standard length evaluation. Note that in memory, this dynamically reads the byte value at index 0 of the string array.

```pascal
LenNorm := Length('Hello');
LenEmpty := Length('');
```
**Memory State (End of Execution):**
```text
LenNorm  = 5            (integer)
LenEmpty = 0            (integer)
```

---

### Pos (Function)

**Syntax:** `function Pos(Substr: String; S: String): Byte;`

Searches for a substring and returns the 1-based index of its first occurrence.

**Example:**
```pascal
WriteLn(Pos('cal', 'Pascal'));
```
**Output:**
```text
4
```

#### 🔬 Hardware Quirks & Edge Cases

The arguments are ordered as Substring first, Target second. It is strictly case-sensitive. Returns 0 if not found.

```pascal
PosFound := Pos('cal', 'Pascal');
PosNotFound := Pos('Basic', 'Pascal');
PosCase := Pos('pascal', 'Pascal');
```
**Memory State (End of Execution):**
```text
PosFound    = 4            (integer)
PosNotFound = 0            (integer)
PosCase     = 0            (integer)
```

---

### String (1-Based Access & Length Byte)

**Syntax:** `S[Index: Byte]: Char;`

Characters in a string can be accessed directly as an array. Index 0 holds the length.

**Example:**
```pascal
S := 'ABC';
WriteLn(Ord(S[0]));
```
**Output:**
```text
3
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRK: In Turbo Pascal, a String is an array of characters from 0 to 255. Index 0 stores the dynamic length of the string as a character byte. Reading the Ord() of index 0 is functionally equivalent to calling Length().

```pascal
LenByteStr := 'ABC';
FirstChar := LenByteStr[1];
LenByteVal := Ord(LenByteStr[0]);
```
**Memory State (End of Execution):**
```text
LenByteStr = "ABC"        (string)
FirstChar  = A            (char)
LenByteVal = 3            (integer)
```

---

### Val (Procedure: String to Number)

**Syntax:** `procedure Val(S: String; var V; var Code: Integer);`

Converts a string to its numeric value. The target variable V is untyped (can be Integer, Longint, or Real), but the error Code variable MUST be strictly a 16-bit Integer.

**Example:**
```pascal
Val('42', Num, ErrCode);
WriteLn(Num);
```
**Output:**
```text
42
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL COMPILE-TIME QUIRK: Turbo Pascal enforces strict var-parameter typing. Passing a Longint for the 'Code' parameter will throw 'Error 89: Type mismatch' at compile time. RUNTIME QUIRK: If parsing fails, the target numeric variable remains unchanged, and Code is set to the 1-based index of the invalid character.

```pascal
ValInt := 0;
Val('42', ValInt, ValCode1);
ValFloat := 0.0;
Val('42.5', ValFloat, ValCode2);
ValErr := 0;
Val('42X', ValErr, ValCode3);
```
**Memory State (End of Execution):**
```text
ValInt   = 42           (integer)
ValCode1 = 0            (integer)
ValFloat = 42.5         (float)
ValCode2 = 0            (integer)
ValErr   = 0            (integer)
ValCode3 = 3            (integer)
```

---

## STDLIB: System & Ordinal Routines

### Inc Procedure

**Syntax:** `procedure Inc(var X: Ordinal [; N: Longint]);`

Increments an ordinal variable. If N is specified, increments by N.

**Example:**
```pascal
X := 10;
Inc(X, 5);
WriteLn(X);
```
**Output:**
```text
15
```

#### 🔬 Hardware Quirks & Edge Cases

Like Delete and Insert, Inc is a mutating procedure, not a function. It operates directly on the memory address of the variable. It works on any ordinal type (Integer, Char, Boolean).

```pascal
IncBase := 10;
Inc(IncBase);
IncStep := 10;
Inc(IncStep, 5);
IncChar := 'A';
Inc(IncChar);
```
**Memory State (End of Execution):**
```text
IncBase = 11           (number)
IncStep = 15           (number)
IncChar = B            (char)
```

---

### Dec Procedure

**Syntax:** `procedure Dec(var X: Ordinal [; N: Longint]);`

Decrements an ordinal variable. If N is specified, decrements by N.

**Example:**
```pascal
X := 10;
Dec(X);
WriteLn(X);
```
**Output:**
```text
9
```

#### 🔬 Hardware Quirks & Edge Cases

The inverse of Inc. Mutates the variable in place. Highly optimized by the compiler into native DEC or SUB assembly instructions.

```pascal
DecBase := 10;
Dec(DecBase);
DecStep := 10;
Dec(DecStep, 5);
DecChar := 'B';
Dec(DecChar);
```
**Memory State (End of Execution):**
```text
DecBase = 9            (number)
DecStep = 5            (number)
DecChar = A            (char)
```

---

### Succ and Pred Functions

**Syntax:** `function Succ(X: Ordinal): Ordinal;
function Pred(X: Ordinal): Ordinal;`

Returns the successor or predecessor of an ordinal value.

**Example:**
```pascal
WriteLn(Succ('A'));
```
**Output:**
```text
B
```

#### 🔬 Hardware Quirks & Edge Cases

Unlike Inc and Dec, these are purely functional and do not mutate the argument. They evaluate to the next or previous value in the ordinal sequence.

```pascal
SuccNum := Succ(42);
PredNum := Pred(42);
SuccChar := Succ('A');
```
**Memory State (End of Execution):**
```text
SuccNum  = 43           (number)
PredNum  = 41           (number)
SuccChar = B            (char)
```

---

### Ord Function

**Syntax:** `function Ord(X: Ordinal): Longint;`

Returns the ordinal value (memory integer representation) of an ordinal-type expression.

**Example:**
```pascal
WriteLn(Ord('A'));
```
**Output:**
```text
65
```

#### 🔬 Hardware Quirks & Edge Cases

Standard ASCII mapping for characters. Structurally tied to Pascal's strict ordinal type system.

```pascal
OrdChar := Ord('A');
OrdSpace := Ord(' ');
```
**Memory State (End of Execution):**
```text
OrdChar  = 65           (integer)
OrdSpace = 32           (integer)
```

---

### Chr Function

**Syntax:** `function Chr(X: Byte): Char;`

Returns the character corresponding to a specific ASCII value.

**Example:**
```pascal
WriteLn(Chr(65));
```
**Output:**
```text
A
```

#### 🔬 Hardware Quirks & Edge Cases

Specifically expects a Byte (0-255). It maps directly to the character in the extended ASCII memory table.

```pascal
ChrVal := Chr(65);
```
**Memory State (End of Execution):**
```text
ChrVal = A            (char)
```

---

### SizeOf Function

**Syntax:** `function SizeOf(X: Any): Word;`

Returns the number of bytes occupied by a variable or a type.

**Example:**
```pascal
WriteLn(SizeOf(Integer));
```
**Output:**
```text
2
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL QUIRK: Memory footprint verification. In 16-bit MS-DOS, an Integer is 2 bytes, a Longint is 4 bytes, a standard String is 256 bytes (Length byte + 255 chars). Crucially, the default Real type is Borland's proprietary 'Real48' format, which occupies exactly 6 bytes (unlike IEEE 754 8-byte Doubles).

```pascal
SizeInt := SizeOf(Integer);
SizeLong := SizeOf(Longint);
SizeReal := SizeOf(Real);
SizeStr := SizeOf(String);
SizeChar := SizeOf(Char);
```
**Memory State (End of Execution):**
```text
SizeInt  = 2            (integer)
SizeLong = 4            (integer)
SizeReal = 6            (integer)
SizeStr  = 256          (integer)
SizeChar = 1            (integer)
```

---

## CORE: Control Flow & Loops

### CASE..OF (Multiple Branching)

**Syntax:** `CASE Selector OF
  Label1: Statement1;
  Label2, Label3: Statement2;
  Label4..Label5: Statement3;
  [ELSE Statement4;]
END;`

Executes one of several statements based on the value of an ordinal selector expression. Turbo Pascal extends standard Pascal by allowing comma-separated lists, ranges (..), and an explicit ELSE fallback clause.

**Example:**
```pascal
CASE X OF
  1: WriteLn('One');
  2..9: WriteLn('Multiple');
  ELSE WriteLn('Other');
END;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validates the evaluation of exact matches, ranges, and the ELSE fallback.

```pascal
CaseRange := 0;
CaseTarget1 := 4;
CASE CaseTarget1 OF
  1, 2: CaseRange := 10;
  3..5: CaseRange := 20;
  ELSE CaseRange := 30;
END;
CaseElse := 0;
CaseTarget2 := 99;
CASE CaseTarget2 OF
  1: CaseElse := 10;
  ELSE CaseElse := 30;
END;
```
**Memory State (End of Execution):**
```text
CaseRange   = 20           (integer)
CaseTarget1 = 4            (integer)
CaseElse    = 30           (integer)
CaseTarget2 = 99           (integer)
```

---

### FOR..DOWNTO (Decrementing Loop)

**Syntax:** `FOR Counter := Start DOWNTO End DO Statement;`

Executes a statement a fixed number of times, strictly decrementing an ordinal control variable by 1 on each iteration. If the Start value is less than the End value, the loop body is bypassed entirely.

**Example:**
```pascal
FOR I := 3 DOWNTO 1 DO WriteLn(I);
```
**Output:**
```text
3
2
1
```

#### 🔬 Hardware Quirks & Edge Cases

Uses the DOWNTO keyword instead of a dynamic step. Validates decrementing and bypass logic.

```pascal
DownSum := 0;
FOR J := 5 DOWNTO 1 DO Inc(DownSum, J);
DownSkip := 0;
FOR J := 1 DOWNTO 5 DO Inc(DownSkip, J);
```
**Memory State (End of Execution):**
```text
DownSum  = 15           (integer)
DownSkip = 0            (integer)
J        = 1            (integer)
```

---

### FOR..TO (Incrementing Loop)

**Syntax:** `FOR Counter := Start TO End DO Statement;`

Executes a statement a fixed number of times, strictly incrementing an ordinal control variable by 1 on each iteration. The Start and End limits are evaluated exactly once before the loop begins.

**Example:**
```pascal
FOR I := 1 TO 3 DO WriteLn(I);
```
**Output:**
```text
1
2
3
```

#### 🔬 Hardware Quirks & Edge Cases

Validates incrementing logic and ensures the loop is skipped if Start > End.

```pascal
ForSum := 0;
FOR I := 1 TO 5 DO Inc(ForSum, I);
ForSkip := 0;
FOR I := 5 TO 1 DO Inc(ForSkip, I);
```
**Memory State (End of Execution):**
```text
ForSum  = 15           (integer)
ForSkip = 0            (integer)
I       = 5            (integer)
```

---

### IF..THEN..ELSE (Conditional Branching)

**Syntax:** `IF Condition THEN Statement1 [ ELSE Statement2 ];`

Branches execution based on a boolean condition. Turbo Pascal strictly forbids placing a semicolon immediately before the ELSE keyword.

**Example:**
```pascal
IF True THEN
  WriteLn('Yes')
ELSE
  WriteLn('No');
```
**Output:**
```text
Yes
```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL PARSING QUIRK: Turbo Pascal resolves the 'dangling ELSE' ambiguity by strictly binding the ELSE clause to the closest preceding IF statement.

```pascal
IfRes := 0;
IF True THEN
  IF False THEN IfRes := 1
  ELSE IfRes := 2;
```
**Memory State (End of Execution):**
```text
IfRes = 2            (integer)
```

---

### REPEAT..UNTIL (Post-Condition Loop)

**Syntax:** `REPEAT Statement1; [Statement2;] UNTIL Condition;`

Repeats a sequence of statements until a boolean condition evaluates to True. Because the condition is evaluated after the loop body, the statements are guaranteed to execute AT LEAST ONCE.

**Example:**
```pascal
REPEAT
  Inc(X);
UNTIL X = 5;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL SYNTAX QUIRK: Unlike WHILE or FOR, REPEAT..UNTIL acts as a natural block envelope and does not require BEGIN..END to wrap multiple statements.

```pascal
RepCount := 0;
REPEAT
  Inc(RepCount);
UNTIL RepCount >= 5;
```
**Memory State (End of Execution):**
```text
RepCount = 5            (integer)
```

---

### WHILE..DO (Pre-Condition Loop)

**Syntax:** `WHILE Condition DO Statement;`

Repeats a statement as long as a boolean condition evaluates to True. The condition is evaluated before entering the loop body. If it is initially False, the body is completely bypassed.

**Example:**
```pascal
WHILE X < 5 DO
begin
  Inc(X);
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validates the pre-condition check and loop execution.

```pascal
WhileCount := 0;
WHILE WhileCount < 5 DO Inc(WhileCount);
WhileSkip := 0;
WHILE False DO Inc(WhileSkip);
```
**Memory State (End of Execution):**
```text
WhileCount = 5            (integer)
WhileSkip  = 0            (integer)
```

---

## CORE: Data Structures (Arrays & Records)

### ARRAY (Arbitrary Integer Bounds)

**Syntax:** `array[Start..End] of Type;`

Unlike C or JavaScript where arrays always start at index 0, Turbo Pascal arrays can have arbitrary ordinal bounds, including negative numbers.

**Example:**
```pascal
var Temp: array[-5..5] of Integer;
begin
  Temp[-2] := 42;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validates that negative bounds are correctly allocated and accessed in memory without shifting offsets incorrectly.

```pascal
ArrNegative[-2] := 42;
ArrNegRes := ArrNegative[-2];
```
**Memory State (End of Execution):**
```text
ArrNegRes = 42           (integer)
```

---

### ARRAY (Character Bounds)

**Syntax:** `array['A'..'Z'] of Type;`

The index type of an array is not limited to integers. Any ordinal type can be used as an index, including characters or enumerations.

**Example:**
```pascal
var Letters: array['a'..'z'] of Integer;
begin
  Letters['x'] := 99;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL PARSER QUIRK: The AST must resolve the character literal to its ASCII ordinal value to correctly compute the memory offset.

```pascal
ArrChar['B'] := 77;
ArrCharRes := ArrChar['B'];
```
**Memory State (End of Execution):**
```text
ArrCharRes = 77           (integer)
```

---

### ARRAY (Multi-Dimensional)

**Syntax:** `array[Dim1Start..Dim1End, Dim2Start..Dim2End] of Type;`

Multi-dimensional arrays can be defined either as arrays of arrays or using a comma-separated syntax for dimensions.

**Example:**
```pascal
var Matrix: array[1..3, 1..3] of Integer;
begin
  Matrix[2, 3] := 88;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validates 2D array parsing and contiguous memory access.

```pascal
ArrMulti[2, 3] := 88;
ArrMultiRes := ArrMulti[2, 3];
```
**Memory State (End of Execution):**
```text
ArrMultiRes = 88           (integer)
```

---

### RECORD (Basic Field Access)

**Syntax:** `Type Name = RECORD
  Field1: Type;
  Field2: Type;
END;`

A Record groups heterogeneous data fields under a single identifier. Fields are accessed using dot notation.

**Example:**
```pascal
Type TPoint = RECORD X, Y: Integer; END;
var P: TPoint;
begin
  P.X := 10;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validates custom TYPE declaration, record instantiation, and member access.

```pascal
MyPoint.X := 10;
MyPoint.Y := 20;
RecResX := MyPoint.X;
RecResY := MyPoint.Y;
```
**Memory State (End of Execution):**
```text
RecResX = 10           (integer)
RecResY = 20           (integer)
```

---

### WITH (Record Scope Resolution)

**Syntax:** `WITH RecordVariable DO Statement;`

The WITH statement temporarily opens a record's namespace. Within its block, the record's fields can be accessed directly without prefixing them with the record variable name.

**Example:**
```pascal
WITH P DO
begin
  X := 10;
  Y := 20;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

CRITICAL SCOPE QUIRK: The environment evaluator must temporarily push the record's fields to the top of the symbol resolution stack.

```pascal
WITH Player1 DO
BEGIN
  Score := 100;
  Alive := True;
END;
WithResScore := Player1.Score;
WithResAlive := Player1.Alive;
```
**Memory State (End of Execution):**
```text
WithResScore = 100          (integer)
WithResAlive = true         (boolean)
```

---

## CORE: Procedures, Functions & Scope

### Procedure (Declaration and Call)

**Syntax:** `procedure Name[(ParameterList)];
[Local Declarations]
begin
  Statements;
end;`

A procedure is a subprogram that performs a specific task but does not return a value. It is invoked as a standalone statement.

**Example:**
```pascal
procedure Greet;
begin
  WriteLn('Hello World');
end;

Greet; { Call the procedure }
```
**Output:**
```text
Hello World
```

#### 🔬 Hardware Quirks & Edge Cases

Validates basic procedure declaration, invocation, and execution flow.

```pascal
ProcCalled := False;
Ref_BasicProc;
```
**Memory State (End of Execution):**
```text
ProcCalled = true         (boolean)
```

---

### Function (Declaration and Return)

**Syntax:** `function Name[(ParameterList)]: ReturnType;
[Local Declarations]
begin
  Name := ReturnValue;
end;`

A function is a subprogram that computes and returns a single value. In Turbo Pascal, there is no 'return' keyword. The return value is specified by assigning a value to the function's own identifier before it exits.

**Example:**
```pascal
function GetTen: Integer;
begin
  GetTen := 10;
end;

WriteLn(GetTen);
```
**Output:**
```text
10
```

#### 🔬 Hardware Quirks & Edge Cases

Validates function execution and the assignment to the function identifier for returning a value.

```pascal
FuncRes := Ref_BasicFunc;
```
**Memory State (End of Execution):**
```text
FuncRes = 42           (integer)
```

---

### Parameters (Pass by Value)

**Syntax:** `procedure RoutineName(Param: Type);`

In Turbo Pascal, parameters are passed by value by default. The procedure or function receives a copy of the argument. Any modifications made to the parameter within the routine are strictly local and do not affect the original variable passed by the caller.

**Example:**
```pascal
procedure AddTen(X: Integer);
begin
  X := X + 10;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validation of memory isolation for value parameters.

```pascal
OriginalVal := 5;
Ref_PassByValue(OriginalVal);
```
**Memory State (End of Execution):**
```text
OriginalVal = 5            (integer)
```

---

### VAR Parameters (Pass by Reference)

**Syntax:** `procedure RoutineName(VAR Param: Type);`

To pass a parameter by reference, the VAR keyword must precede the parameter declaration. The routine accesses the actual memory address of the argument. Any changes made to the parameter inside the routine will directly modify the original variable.

**Example:**
```pascal
procedure AddTen(VAR X: Integer);
begin
  X := X + 10;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validation of memory mutation for reference parameters.

```pascal
OriginalRef := 5;
Ref_PassByRef(OriginalRef);
```
**Memory State (End of Execution):**
```text
OriginalRef = 15           (integer)
```

---

### Scope (Global Visibility)

**Syntax:** `var GlobalVar: Type;`

Variables declared in the main VAR block of a program are global. They are visible and can be directly accessed or modified by any procedure or function, provided they are declared before the routine in the source code.

**Example:**
```pascal
procedure MutateGlobal;
begin
  GlobalVar := 99;
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validation of outer scope traversal and mutation.

```pascal
GlobalTarget := 21;
Ref_GlobalAccess;
```
**Memory State (End of Execution):**
```text
GlobalTarget = 42           (integer)
```

---

### Scope (Local and Variable Shadowing)

**Syntax:** `procedure RoutineName;
var LocalVar: Type;
begin ... end;`

Variables declared within a procedure or function are local to that routine. If a local variable has the exact same name as a global variable, the local declaration 'shadows' (hides) the global one. Any operations on that identifier within the routine will only affect the local instance.

**Example:**
```pascal
procedure ShadowGlobal;
var X: Integer;
begin
  X := 99; { Modifies local X, not global X }
end;
```
**Output:**
```text

```

#### 🔬 Hardware Quirks & Edge Cases

Validation of scope priority (Local over Global) during identifier resolution.

```pascal
ShadowTarget := 10;
Ref_Shadowing;
```
**Memory State (End of Execution):**
```text
ShadowTarget = 10           (integer)
```

---
