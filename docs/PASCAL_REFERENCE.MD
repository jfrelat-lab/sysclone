# Sysclone Turbo Pascal Compatibility Reference

> **Auto-generated** from Truth Vectors. This document serves as the absolute specification for MS-DOS Turbo Pascal behavior.

## 🔠 Alphabetical Index

[Copy Function](#copy-function) • [Delete Procedure](#delete-procedure) • [Direct Index Access & Length Byte](#direct-index-access-length-byte) • [Div Operator (Integer Division)](#div-operator-integer-division-) • [Insert Procedure](#insert-procedure) • [Int Function](#int-function) • [Length Function](#length-function) • [Mod Operator (Modulo)](#mod-operator-modulo-) • [Pos Function](#pos-function) • [Round Function](#round-function) • [Str Procedure (Number to String)](#str-procedure-number-to-string-) • [Trunc Function](#trunc-function) • [Val Procedure (String to Number)](#val-procedure-string-to-number-)

---

## 📚 Thematic Contents

- **STDLIB: Math & Floating-Point Unit (Turbo Pascal)**
  - [Int Function](#int-function)
  - [Trunc Function](#trunc-function)
  - [Round Function](#round-function)
  - [Div Operator (Integer Division)](#div-operator-integer-division-)
  - [Mod Operator (Modulo)](#mod-operator-modulo-)
- **STDLIB: Strings & Type Casting (Turbo Pascal)**
  - [Length Function](#length-function)
  - [Copy Function](#copy-function)
  - [Pos Function](#pos-function)
  - [Delete Procedure](#delete-procedure)
  - [Insert Procedure](#insert-procedure)
  - [Str Procedure (Number to String)](#str-procedure-number-to-string-)
  - [Val Procedure (String to Number)](#val-procedure-string-to-number-)
  - [Direct Index Access & Length Byte](#direct-index-access-length-byte)

---

## STDLIB: Math & Floating-Point Unit (Turbo Pascal)

### Int Function

**Syntax:** `Int(X: Real): Real;`

Returns the integer part of a real number (as a Real).

**Example:**
```pascal
WriteLn(Int(2.8):0:1);
```
**Output:**
```text
2.0
```

#### 🔬 Hardware Quirks & Edge Cases

Unlike QBasic's INT, Pascal's Int simply truncates towards zero (like QBasic's FIX), and it returns a Real type, not an Integer.

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

**Syntax:** `Trunc(X: Real): Longint;`

Truncates a real number to an integer value.

**Example:**
```pascal
WriteLn(Trunc(-2.8));
```
**Output:**
```text
-2
```

#### 🔬 Hardware Quirks & Edge Cases

This is the exact integer equivalent of QBasic's FIX. It truncates towards zero.

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

**Syntax:** `Round(X: Real): Longint;`

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

### Div Operator (Integer Division)

**Syntax:** `X Div Y`

Divides two integers and returns the integer quotient.

**Example:**
```pascal
WriteLn(5 Div 2);
```
**Output:**
```text
2
```

#### 🔬 Hardware Quirks & Edge Cases

Unlike QBasic's backslash (\), Pascal's Div operator only accepts Integer types. It does not perform pre-rounding on Reals. It simply truncates the quotient.

```pascal
IntDiv := 5 Div 2;
```
**Memory State (End of Execution):**
```text
IntDiv = 2            (number)
```

---

### Mod Operator (Modulo)

**Syntax:** `X Mod Y`

Returns the remainder of integer division.

**Example:**
```pascal
WriteLn(10 Mod 3);
```
**Output:**
```text
1
```

#### 🔬 Hardware Quirks & Edge Cases

Like Div, Mod only operates on Integer types in Turbo Pascal. The sign of the result is always the sign of the first operand.

```pascal
ModNorm := 10 Mod 3;
ModNeg := -10 Mod 3;
```
**Memory State (End of Execution):**
```text
ModNorm = 1            (number)
ModNeg  = -1           (number)
```

---

## STDLIB: Strings & Type Casting (Turbo Pascal)

### Length Function

**Syntax:** `Length(S: String): Integer;`

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

**Syntax:** `Copy(S: String; Index: Integer; Count: Integer): String;`

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

Unlike QBasic's MID$, if the Index is greater than the string length, Copy returns an empty string. If Count exceeds the remaining characters, it gracefully returns only what is available without throwing out-of-bounds errors.

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

**Syntax:** `Pos(Substr: String; S: String): Byte;`

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

Similar to QBasic's INSTR, but the arguments are inverted (Substring first, Target second). It is strictly case-sensitive. Returns 0 if not found.

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

**Syntax:** `Delete(var S: String; Index: Integer; Count: Integer);`

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

**Syntax:** `Insert(Source: String; var S: String; Index: Integer);`

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

**Syntax:** `Str(X [: Width [: Decimals]], var S: String);`

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

Unlike QBasic's STR$, this is a procedure that populates a target variable. Crucially, it does NOT prepend a leading space for positive numbers. It supports standard WriteLn-style formatting constraints.

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

**Syntax:** `Val(S: String; var V; var Code: Integer);`

Converts a string to its numeric value.

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

Converts a string to a numeric variable. The 'Code' parameter acts as an error flag: it returns 0 if successful, or the 1-based index of the invalid character if parsing fails.

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

**Syntax:** `S[Index]`

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
FirstChar  = "A"          (string)
LenByteVal = 3            (number)
```

---
