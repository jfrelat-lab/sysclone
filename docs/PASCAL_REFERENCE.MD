# Sysclone Turbo Pascal Compatibility Reference

> **Auto-generated** from Truth Vectors. This document serves as the absolute specification for MS-DOS Turbo Pascal behavior.

## 🔠 Alphabetical Index

[Addition Operator (+)](#addition-operator-) • [Address Operator (@)](#address-operator-) • [Bit Shift Left (SHL)](#bit-shift-left-shl-) • [Bit Shift Right (SHR)](#bit-shift-right-shr-) • [Bitwise AND Operator](#bitwise-and-operator) • [Bitwise NOT Operator](#bitwise-not-operator) • [Bitwise OR Operator](#bitwise-or-operator) • [Bitwise XOR Operator](#bitwise-xor-operator) • [Boolean Type Fundamentals](#boolean-type-fundamentals) • [Chr Function](#chr-function) • [Copy Function](#copy-function) • [Dec Procedure](#dec-procedure) • [Delete Procedure](#delete-procedure) • [Dereference Operator (^)](#dereference-operator-) • [Direct Index Access & Length Byte](#direct-index-access-length-byte) • [Equality Operator (=)](#equality-operator-) • [Greater Than Operator (>)](#greater-than-operator-) • [Greater Than or Equal Operator (>=)](#greater-than-or-equal-operator-) • [Inc Procedure](#inc-procedure) • [Inequality Operator (<>)](#inequality-operator-) • [Insert Procedure](#insert-procedure) • [Int Function](#int-function) • [Integer Division (DIV)](#integer-division-div-) • [Length Function](#length-function) • [Less Than Operator (<)](#less-than-operator-) • [Less Than or Equal Operator (<=)](#less-than-or-equal-operator-) • [Logical AND Operator](#logical-and-operator) • [Logical NOT Operator](#logical-not-operator) • [Logical OR Operator](#logical-or-operator) • [Logical XOR Operator](#logical-xor-operator) • [Modulo Operator (MOD)](#modulo-operator-mod-) • [Multiplication Operator (*)](#multiplication-operator-) • [Operator Precedence Matrix](#operator-precedence-matrix) • [Ord Function](#ord-function) • [Pos Function](#pos-function) • [Real Division Operator (/)](#real-division-operator-) • [Round Function](#round-function) • [Set Membership Operator (IN)](#set-membership-operator-in-) • [SizeOf Function](#sizeof-function) • [Str Procedure (Number to String)](#str-procedure-number-to-string-) • [String Concatenation Operator (+)](#string-concatenation-operator-) • [Subtraction Operator (-)](#subtraction-operator-) • [Succ and Pred Functions](#succ-and-pred-functions) • [Trunc Function](#trunc-function) • [Unary Minus Operator (-)](#unary-minus-operator-) • [Val Procedure (String to Number)](#val-procedure-string-to-number-)

---

## 📚 Thematic Contents

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
- **STDLIB: Strings & Type Casting**
  - [Length Function](#length-function)
  - [Copy Function](#copy-function)
  - [Pos Function](#pos-function)
  - [Delete Procedure](#delete-procedure)
  - [Insert Procedure](#insert-procedure)
  - [Str Procedure (Number to String)](#str-procedure-number-to-string-)
  - [Val Procedure (String to Number)](#val-procedure-string-to-number-)
  - [Direct Index Access & Length Byte](#direct-index-access-length-byte)
- **STDLIB: System & Ordinal Routines**
  - [Inc Procedure](#inc-procedure)
  - [Dec Procedure](#dec-procedure)
  - [Succ and Pred Functions](#succ-and-pred-functions)
  - [Ord Function](#ord-function)
  - [Chr Function](#chr-function)
  - [SizeOf Function](#sizeof-function)

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

## STDLIB: Strings & Type Casting

### Length Function

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
LenNorm  = 5            (number)
LenEmpty = 0            (number)
```

---

### Copy Function

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

### Pos Function

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
PosFound    = 4            (number)
PosNotFound = 0            (number)
PosCase     = 0            (number)
```

---

### Delete Procedure

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

### Insert Procedure

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

### Str Procedure (Number to String)

**Syntax:** `procedure Str(X [: Width [: Decimals]]; var S: String);`

Converts a numeric value to its string representation.

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

This is a procedure that populates a target variable. Crucially, it does not prepend a leading space for positive numbers. It supports standard WriteLn-style formatting constraints.

```pascal
Str(42, StrInt);
Str(-42, StrNeg);
Str(3.14159:0:2, StrFloat);
```
**Memory State (End of Execution):**
```text
StrInt   = "42"         (string)
StrNeg   = "-42"        (string)
StrFloat = "3.14"       (string)
```

---

### Val Procedure (String to Number)

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
ValInt   = 42           (number)
ValCode1 = 0            (integer)
ValFloat = 42.5         (float)
ValCode2 = 0            (integer)
ValErr   = 0            (number)
ValCode3 = 3            (integer)
```

---

### Direct Index Access & Length Byte

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
LenByteVal = 3            (number)
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
