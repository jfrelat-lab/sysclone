{ ============================================================================== }
{ SYSCLONE COMPATIBILITY HARNESS (Auto-Generated)                                }
{ Runs silently. Only prints failures and the final score.                       }
{ ============================================================================== }
PROGRAM SyscloneCompat;
USES Crt;

VAR
  TotalTests, PassedTests, FailedTests: Integer;
  TruncPos, TruncNeg, RoundUp, RoundHalf, RoundHalfOdd, RoundNegHalf, IntDiv, ModNorm: Longint;
  ModNeg, IncBase, IncStep, DecBase, DecStep, SuccNum, PredNum: Longint;
  OrdTrue, OrdFalse, ZeroVarAnd, ZeroVarOr, BitNotZero, BitNotPos, BitAndEx, BitOrEx: Integer;
  BitXorEx, ShlEx, ShrEx, UnaryBase, UnaryNeg, AddrTarget, DerefTarget, MulRes, AddRes: Integer;
  SubRes, LenNorm, LenEmpty, PosFound, PosNotFound, PosCase, LenByteVal, ValInt, ValCode1: Integer;
  ValCode2, ValErr, ValCode3, OrdChar, OrdSpace, SizeInt, SizeLong, SizeReal, SizeStr: Integer;
  SizeChar, CaseRange, CaseTarget1, CaseElse, CaseTarget2, DownSum, DownSkip, J, ForSum: Integer;
  ForSkip, I, IfRes, RepCount, WhileCount, WhileSkip, ArrNegRes, ArrCharRes, ArrMultiRes: Integer;
  RecResX, RecResY, WithResScore, FuncRes, OriginalVal, OriginalRef, GlobalTarget: Integer;
  ShadowTarget: Integer;
  IntPos, IntNeg, DivRes, ValFloat: Real;
  StrIntPos, StrIntNeg, StrPadPos, StrPadNeg, StrIntOverflow, StrRealFix, StrRealPad: String;
  StrRealRoundUp, StrRealRoundDown, StrRealNoDecimals, ConcatRes, CopyNorm, CopyOOB: String;
  CopyTrunc, DelStr, DelOOB, InsStr, InsOOB, LenByteStr: String;
  FirstChar, IncChar, DecChar, SuccChar, ChrVal: Char;
  BoolTrue, BoolFalse, NotTrue, NotFalse, LogAndBase, SurvivedAndShort, LogOrBase: Boolean;
  SurvivedOrShort, LogXorDiff, LogXorSame, EqRes, NeqRes, LtRes, GtRes, LteRes, GteRes: Boolean;
  InResTrue, InResFalse, PrecChain1, PrecChain2, PrecChain3, PrecChainFull, WithResAlive: Boolean;
  ProcCalled: Boolean;
  TestPtr, TestPtrDeref: ^Integer;

VAR ArrNegative: ARRAY[-5..5] OF Integer;
VAR ArrChar: ARRAY['A'..'C'] OF Integer;
VAR ArrMulti: ARRAY[1..3, 1..3] OF Integer;
TYPE TPoint = RECORD
  X, Y: Integer;
END;
VAR MyPoint: TPoint;
TYPE TPlayer = RECORD
  Score: Integer;
  Alive: Boolean;
END;
VAR Player1: TPlayer;
PROCEDURE Ref_BasicProc;
BEGIN
  ProcCalled := True;
END;
FUNCTION Ref_BasicFunc: Integer;
BEGIN
  Ref_BasicFunc := 42;
END;
PROCEDURE Ref_PassByValue(X: Integer);
BEGIN
  X := X + 10;
END;
PROCEDURE Ref_PassByRef(VAR X: Integer);
BEGIN
  X := X + 10;
END;
PROCEDURE Ref_GlobalAccess;
BEGIN
  GlobalTarget := GlobalTarget * 2;
END;
PROCEDURE Ref_Shadowing;
VAR ShadowTarget: Integer;
BEGIN
  ShadowTarget := 99;
END;

{ --- SYSCLONE TEST FRAMEWORK --- }
PROCEDURE AssertInt(TestName: String; Expected, Actual: Longint);
BEGIN
  Inc(TotalTests);
  IF Expected = Actual THEN Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [', TestName, '] expected ', Expected, ' but got ', Actual);
  END;
END;
PROCEDURE AssertReal(TestName: String; Expected, Actual: Real);
BEGIN
  Inc(TotalTests);
  IF Abs(Expected - Actual) < 0.0001 THEN Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [', TestName, '] expected ', Expected:0:2, ' but got ', Actual:0:2);
  END;
END;
PROCEDURE AssertStr(TestName: String; Expected, Actual: String);
BEGIN
  Inc(TotalTests);
  IF Expected = Actual THEN Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [', TestName, '] expected ''', Expected, ''' but got ''', Actual, '''');
  END;
END;
PROCEDURE AssertBool(TestName: String; Expected, Actual: Boolean);
BEGIN
  Inc(TotalTests);
  IF Expected = Actual THEN Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [', TestName, '] expected ');
    IF Expected THEN Write('True') ELSE Write('False');
    Write(' but got ');
    IF Actual THEN WriteLn('True') ELSE WriteLn('False');
  END;
END;
PROCEDURE AssertPtr(TestName: String; Expected, Actual: Pointer);
BEGIN
  Inc(TotalTests);
  IF Expected = Actual THEN Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [', TestName, '] expected ', Longint(Expected), ' but got ', Longint(Actual));
  END;
END;

BEGIN
  ClrScr;
  TotalTests := 0;
  PassedTests := 0;
  FailedTests := 0;
  WriteLn('Running Sysclone Truth Vectors...');
  WriteLn('---------------------------------');

  { --- SUITE: STDLIB: Formatting Engine (Str) --- }
  { Vector: Str (Integer Basic Conversion) }
  Str(42, StrIntPos);
  Str(-42, StrIntNeg);
  AssertStr('Str (Integer Basic Conversion)', '42', StrIntPos);
  AssertStr('Str (Integer Basic Conversion)', '-42', StrIntNeg);

  { Vector: Str (Integer Width Padding) }
  Str(42:5, StrPadPos);
  Str(-42:5, StrPadNeg);
  AssertStr('Str (Integer Width Padding)', '   42', StrPadPos);
  AssertStr('Str (Integer Width Padding)', '  -42', StrPadNeg);

  { Vector: Str (Integer Width Overflow) }
  Str(12345:2, StrIntOverflow);
  AssertStr('Str (Integer Width Overflow)', '12345', StrIntOverflow);

  { Vector: Str (Real Fixed-Point Conversion) }
  Str(3.14159:0:2, StrRealFix);
  AssertStr('Str (Real Fixed-Point Conversion)', '3.14', StrRealFix);

  { Vector: Str (Real Fixed-Point Padding) }
  Str(3.14:6:2, StrRealPad);
  AssertStr('Str (Real Fixed-Point Padding)', '  3.14', StrRealPad);

  { Vector: Str (Real Fixed-Point Rounding) }
  Str(3.15:0:1, StrRealRoundUp);
  Str(3.14:0:1, StrRealRoundDown);
  Str(3.8:0:0, StrRealNoDecimals);
  AssertStr('Str (Real Fixed-Point Rounding)', '3.2', StrRealRoundUp);
  AssertStr('Str (Real Fixed-Point Rounding)', '3.1', StrRealRoundDown);
  AssertStr('Str (Real Fixed-Point Rounding)', '4', StrRealNoDecimals);


  { --- SUITE: CORE: Logic, Boolean & Bitwise --- }
  { Vector: Boolean Type Fundamentals }
  BoolTrue := True;
  BoolFalse := False;
  OrdTrue := Ord(True);
  OrdFalse := Ord(False);
  AssertBool('Boolean Type Fundamentals', True, BoolTrue);
  AssertBool('Boolean Type Fundamentals', False, BoolFalse);
  AssertInt('Boolean Type Fundamentals', 1, OrdTrue);
  AssertInt('Boolean Type Fundamentals', 0, OrdFalse);

  { Vector: Logical NOT Operator }
  NotTrue := NOT True;
  NotFalse := NOT False;
  AssertBool('Logical NOT Operator', False, NotTrue);
  AssertBool('Logical NOT Operator', True, NotFalse);

  { Vector: Logical AND Operator }
  LogAndBase := True AND False;
  ZeroVarAnd := 0;
  SurvivedAndShort := False;
  IF (False) AND (10 DIV ZeroVarAnd = 1) THEN SurvivedAndShort := False ELSE SurvivedAndShort := True;
  AssertBool('Logical AND Operator', False, LogAndBase);
  AssertInt('Logical AND Operator', 0, ZeroVarAnd);
  AssertBool('Logical AND Operator', True, SurvivedAndShort);

  { Vector: Logical OR Operator }
  LogOrBase := True OR False;
  ZeroVarOr := 0;
  SurvivedOrShort := False;
  IF (True) OR (10 DIV ZeroVarOr = 1) THEN SurvivedOrShort := True ELSE SurvivedOrShort := False;
  AssertBool('Logical OR Operator', True, LogOrBase);
  AssertInt('Logical OR Operator', 0, ZeroVarOr);
  AssertBool('Logical OR Operator', True, SurvivedOrShort);

  { Vector: Logical XOR Operator }
  LogXorDiff := True XOR False;
  LogXorSame := True XOR True;
  AssertBool('Logical XOR Operator', True, LogXorDiff);
  AssertBool('Logical XOR Operator', False, LogXorSame);

  { Vector: Bitwise NOT Operator }
  BitNotZero := NOT 0;
  BitNotPos := NOT 1;
  AssertInt('Bitwise NOT Operator', -1, BitNotZero);
  AssertInt('Bitwise NOT Operator', -2, BitNotPos);

  { Vector: Bitwise AND Operator }
  BitAndEx := 170 AND 85;
  AssertInt('Bitwise AND Operator', 0, BitAndEx);

  { Vector: Bitwise OR Operator }
  BitOrEx := 170 OR 85;
  AssertInt('Bitwise OR Operator', 255, BitOrEx);

  { Vector: Bitwise XOR Operator }
  BitXorEx := 170 XOR 255;
  AssertInt('Bitwise XOR Operator', 85, BitXorEx);

  { Vector: Bit Shift Left (SHL) }
  ShlEx := 1 SHL 3;
  AssertInt('Bit Shift Left (SHL)', 8, ShlEx);

  { Vector: Bit Shift Right (SHR) }
  ShrEx := 8 SHR 1;
  AssertInt('Bit Shift Right (SHR)', 4, ShrEx);


  { --- SUITE: STDLIB: Math Built-ins --- }
  { Vector: Int Function }
  IntPos := Int(2.8);
  IntNeg := Int(-2.8);
  AssertReal('Int Function', 2.0, IntPos);
  AssertReal('Int Function', -2.0, IntNeg);

  { Vector: Trunc Function }
  TruncPos := Trunc(2.8);
  TruncNeg := Trunc(-2.8);
  AssertInt('Trunc Function', 2, TruncPos);
  AssertInt('Trunc Function', -2, TruncNeg);

  { Vector: Round Function }
  RoundUp := Round(2.6);
  RoundHalf := Round(2.5);
  RoundHalfOdd := Round(3.5);
  RoundNegHalf := Round(-2.5);
  AssertInt('Round Function', 3, RoundUp);
  AssertInt('Round Function', 3, RoundHalf);
  AssertInt('Round Function', 4, RoundHalfOdd);
  AssertInt('Round Function', -3, RoundNegHalf);

  { Vector: Integer Division (DIV) }
  IntDiv := 10 DIV 3;
  AssertInt('Integer Division (DIV)', 3, IntDiv);

  { Vector: Modulo Operator (MOD) }
  ModNorm := 10 MOD 3;
  ModNeg := -10 MOD 3;
  AssertInt('Modulo Operator (MOD)', 1, ModNorm);
  AssertInt('Modulo Operator (MOD)', -1, ModNeg);


  { --- SUITE: CORE: Operators & Precedence --- }
  { Vector: Unary Minus Operator (-) }
  UnaryBase := 5;
  UnaryNeg := -UnaryBase;
  AssertInt('Unary Minus Operator (-)', 5, UnaryBase);
  AssertInt('Unary Minus Operator (-)', -5, UnaryNeg);

  { Vector: Address Operator (@) }
  AddrTarget := 42;
  TestPtr := @AddrTarget;
  AssertInt('Address Operator (@)', 42, AddrTarget);
  AssertPtr('Address Operator (@)', Pointer(@AddrTarget), Pointer(TestPtr));

  { Vector: Dereference Operator (^) }
  DerefTarget := 10;
  TestPtrDeref := @DerefTarget;
  TestPtrDeref^ := 99;
  AssertInt('Dereference Operator (^)', 99, DerefTarget);
  AssertPtr('Dereference Operator (^)', Pointer(@DerefTarget), Pointer(TestPtrDeref));

  { Vector: Multiplication Operator (*) }
  MulRes := 6 * 7;
  AssertInt('Multiplication Operator (*)', 42, MulRes);

  { Vector: Real Division Operator (/) }
  DivRes := 10 / 4;
  AssertReal('Real Division Operator (/)', 2.5, DivRes);

  { Vector: Addition Operator (+) }
  AddRes := 10 + 5;
  AssertInt('Addition Operator (+)', 15, AddRes);

  { Vector: Subtraction Operator (-) }
  SubRes := 10 - 5;
  AssertInt('Subtraction Operator (-)', 5, SubRes);

  { Vector: String Concatenation Operator (+) }
  ConcatRes := 'Sys' + 'clone';
  AssertStr('String Concatenation Operator (+)', 'Sysclone', ConcatRes);

  { Vector: Equality Operator (=) }
  EqRes := (5 = 5);
  AssertBool('Equality Operator (=)', True, EqRes);

  { Vector: Inequality Operator (<>) }
  NeqRes := (5 <> 4);
  AssertBool('Inequality Operator (<>)', True, NeqRes);

  { Vector: Less Than Operator (<) }
  LtRes := (4 < 5);
  AssertBool('Less Than Operator (<)', True, LtRes);

  { Vector: Greater Than Operator (>) }
  GtRes := (5 > 4);
  AssertBool('Greater Than Operator (>)', True, GtRes);

  { Vector: Less Than or Equal Operator (<=) }
  LteRes := (5 <= 5);
  AssertBool('Less Than or Equal Operator (<=)', True, LteRes);

  { Vector: Greater Than or Equal Operator (>=) }
  GteRes := (5 >= 5);
  AssertBool('Greater Than or Equal Operator (>=)', True, GteRes);

  { Vector: Set Membership Operator (IN) }
  InResTrue := 3 IN [1, 2, 3, 4, 5];
  InResFalse := 9 IN [1, 2, 3];
  AssertBool('Set Membership Operator (IN)', True, InResTrue);
  AssertBool('Set Membership Operator (IN)', False, InResFalse);

  { Vector: Operator Precedence Matrix }
  PrecChain1 := (5 + 2 * 3 = 11);
  PrecChain2 := (10 - 6 / 2 = 7.0);
  PrecChain3 := NOT False AND True;
  PrecChainFull := PrecChain1 AND PrecChain2 AND PrecChain3 AND (3 IN [1..5]);
  AssertBool('Operator Precedence Matrix', True, PrecChain1);
  AssertBool('Operator Precedence Matrix', True, PrecChain2);
  AssertBool('Operator Precedence Matrix', True, PrecChain3);
  AssertBool('Operator Precedence Matrix', True, PrecChainFull);


  { --- SUITE: STDLIB: String Manipulation & Casting --- }
  { Vector: Copy (Function) }
  CopyNorm := Copy('Pascal', 1, 4);
  CopyOOB := Copy('Pascal', 10, 2);
  CopyTrunc := Copy('Pascal', 4, 10);
  AssertStr('Copy (Function)', 'Pasc', CopyNorm);
  AssertStr('Copy (Function)', '', CopyOOB);
  AssertStr('Copy (Function)', 'cal', CopyTrunc);

  { Vector: Delete (Procedure) }
  DelStr := 'Hello World';
  Delete(DelStr, 6, 6);
  DelOOB := 'Test';
  Delete(DelOOB, 10, 2);
  AssertStr('Delete (Procedure)', 'Hello', DelStr);
  AssertStr('Delete (Procedure)', 'Test', DelOOB);

  { Vector: Insert (Procedure) }
  InsStr := 'World';
  Insert('Hello ', InsStr, 1);
  InsOOB := 'Hi';
  Insert('!', InsOOB, 10);
  AssertStr('Insert (Procedure)', 'Hello World', InsStr);
  AssertStr('Insert (Procedure)', 'Hi!', InsOOB);

  { Vector: Length (Function) }
  LenNorm := Length('Hello');
  LenEmpty := Length('');
  AssertInt('Length (Function)', 5, LenNorm);
  AssertInt('Length (Function)', 0, LenEmpty);

  { Vector: Pos (Function) }
  PosFound := Pos('cal', 'Pascal');
  PosNotFound := Pos('Basic', 'Pascal');
  PosCase := Pos('pascal', 'Pascal');
  AssertInt('Pos (Function)', 4, PosFound);
  AssertInt('Pos (Function)', 0, PosNotFound);
  AssertInt('Pos (Function)', 0, PosCase);

  { Vector: String (1-Based Access & Length Byte) }
  LenByteStr := 'ABC';
  FirstChar := LenByteStr[1];
  LenByteVal := Ord(LenByteStr[0]);
  AssertStr('String (1-Based Access & Length Byte)', 'ABC', LenByteStr);
  AssertStr('String (1-Based Access & Length Byte)', 'A', FirstChar);
  AssertInt('String (1-Based Access & Length Byte)', 3, LenByteVal);

  { Vector: Val (Procedure: String to Number) }
  ValInt := 0;
  Val('42', ValInt, ValCode1);
  ValFloat := 0.0;
  Val('42.5', ValFloat, ValCode2);
  ValErr := 0;
  Val('42X', ValErr, ValCode3);
  AssertInt('Val (Procedure: String to Number)', 42, ValInt);
  AssertInt('Val (Procedure: String to Number)', 0, ValCode1);
  AssertReal('Val (Procedure: String to Number)', 42.5, ValFloat);
  AssertInt('Val (Procedure: String to Number)', 0, ValCode2);
  AssertInt('Val (Procedure: String to Number)', 0, ValErr);
  AssertInt('Val (Procedure: String to Number)', 3, ValCode3);


  { --- SUITE: STDLIB: System & Ordinal Routines --- }
  { Vector: Inc Procedure }
  IncBase := 10;
  Inc(IncBase);
  IncStep := 10;
  Inc(IncStep, 5);
  IncChar := 'A';
  Inc(IncChar);
  AssertInt('Inc Procedure', 11, IncBase);
  AssertInt('Inc Procedure', 15, IncStep);
  AssertStr('Inc Procedure', 'B', IncChar);

  { Vector: Dec Procedure }
  DecBase := 10;
  Dec(DecBase);
  DecStep := 10;
  Dec(DecStep, 5);
  DecChar := 'B';
  Dec(DecChar);
  AssertInt('Dec Procedure', 9, DecBase);
  AssertInt('Dec Procedure', 5, DecStep);
  AssertStr('Dec Procedure', 'A', DecChar);

  { Vector: Succ and Pred Functions }
  SuccNum := Succ(42);
  PredNum := Pred(42);
  SuccChar := Succ('A');
  AssertInt('Succ and Pred Functions', 43, SuccNum);
  AssertInt('Succ and Pred Functions', 41, PredNum);
  AssertStr('Succ and Pred Functions', 'B', SuccChar);

  { Vector: Ord Function }
  OrdChar := Ord('A');
  OrdSpace := Ord(' ');
  AssertInt('Ord Function', 65, OrdChar);
  AssertInt('Ord Function', 32, OrdSpace);

  { Vector: Chr Function }
  ChrVal := Chr(65);
  AssertStr('Chr Function', 'A', ChrVal);

  { Vector: SizeOf Function }
  SizeInt := SizeOf(Integer);
  SizeLong := SizeOf(Longint);
  SizeReal := SizeOf(Real);
  SizeStr := SizeOf(String);
  SizeChar := SizeOf(Char);
  AssertInt('SizeOf Function', 2, SizeInt);
  AssertInt('SizeOf Function', 4, SizeLong);
  AssertInt('SizeOf Function', 6, SizeReal);
  AssertInt('SizeOf Function', 256, SizeStr);
  AssertInt('SizeOf Function', 1, SizeChar);


  { --- SUITE: CORE: Control Flow & Loops --- }
  { Vector: CASE..OF (Multiple Branching) }
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
  AssertInt('CASE..OF (Multiple Branching)', 20, CaseRange);
  AssertInt('CASE..OF (Multiple Branching)', 4, CaseTarget1);
  AssertInt('CASE..OF (Multiple Branching)', 30, CaseElse);
  AssertInt('CASE..OF (Multiple Branching)', 99, CaseTarget2);

  { Vector: FOR..DOWNTO (Decrementing Loop) }
  DownSum := 0;
  FOR J := 5 DOWNTO 1 DO Inc(DownSum, J);
  DownSkip := 0;
  FOR J := 1 DOWNTO 5 DO Inc(DownSkip, J);
  AssertInt('FOR..DOWNTO (Decrementing Loop)', 15, DownSum);
  AssertInt('FOR..DOWNTO (Decrementing Loop)', 0, DownSkip);
  AssertInt('FOR..DOWNTO (Decrementing Loop)', 1, J);

  { Vector: FOR..TO (Incrementing Loop) }
  ForSum := 0;
  FOR I := 1 TO 5 DO Inc(ForSum, I);
  ForSkip := 0;
  FOR I := 5 TO 1 DO Inc(ForSkip, I);
  AssertInt('FOR..TO (Incrementing Loop)', 15, ForSum);
  AssertInt('FOR..TO (Incrementing Loop)', 0, ForSkip);
  AssertInt('FOR..TO (Incrementing Loop)', 5, I);

  { Vector: IF..THEN..ELSE (Conditional Branching) }
  IfRes := 0;
  IF True THEN
    IF False THEN IfRes := 1
    ELSE IfRes := 2;
  AssertInt('IF..THEN..ELSE (Conditional Branching)', 2, IfRes);

  { Vector: REPEAT..UNTIL (Post-Condition Loop) }
  RepCount := 0;
  REPEAT
    Inc(RepCount);
  UNTIL RepCount >= 5;
  AssertInt('REPEAT..UNTIL (Post-Condition Loop)', 5, RepCount);

  { Vector: WHILE..DO (Pre-Condition Loop) }
  WhileCount := 0;
  WHILE WhileCount < 5 DO Inc(WhileCount);
  WhileSkip := 0;
  WHILE False DO Inc(WhileSkip);
  AssertInt('WHILE..DO (Pre-Condition Loop)', 5, WhileCount);
  AssertInt('WHILE..DO (Pre-Condition Loop)', 0, WhileSkip);


  { --- SUITE: CORE: Data Structures (Arrays & Records) --- }
  { Vector: ARRAY (Arbitrary Integer Bounds) }
  ArrNegative[-2] := 42;
  ArrNegRes := ArrNegative[-2];
  AssertInt('ARRAY (Arbitrary Integer Bounds)', 42, ArrNegRes);

  { Vector: ARRAY (Character Bounds) }
  ArrChar['B'] := 77;
  ArrCharRes := ArrChar['B'];
  AssertInt('ARRAY (Character Bounds)', 77, ArrCharRes);

  { Vector: ARRAY (Multi-Dimensional) }
  ArrMulti[2, 3] := 88;
  ArrMultiRes := ArrMulti[2, 3];
  AssertInt('ARRAY (Multi-Dimensional)', 88, ArrMultiRes);

  { Vector: RECORD (Basic Field Access) }
  MyPoint.X := 10;
  MyPoint.Y := 20;
  RecResX := MyPoint.X;
  RecResY := MyPoint.Y;
  AssertInt('RECORD (Basic Field Access)', 10, RecResX);
  AssertInt('RECORD (Basic Field Access)', 20, RecResY);

  { Vector: WITH (Record Scope Resolution) }
  WITH Player1 DO
  BEGIN
    Score := 100;
    Alive := True;
  END;
  WithResScore := Player1.Score;
  WithResAlive := Player1.Alive;
  AssertInt('WITH (Record Scope Resolution)', 100, WithResScore);
  AssertBool('WITH (Record Scope Resolution)', True, WithResAlive);


  { --- SUITE: CORE: Procedures, Functions & Scope --- }
  { Vector: Procedure (Declaration and Call) }
  ProcCalled := False;
  Ref_BasicProc;
  AssertBool('Procedure (Declaration and Call)', True, ProcCalled);

  { Vector: Function (Declaration and Return) }
  FuncRes := Ref_BasicFunc;
  AssertInt('Function (Declaration and Return)', 42, FuncRes);

  { Vector: Parameters (Pass by Value) }
  OriginalVal := 5;
  Ref_PassByValue(OriginalVal);
  AssertInt('Parameters (Pass by Value)', 5, OriginalVal);

  { Vector: VAR Parameters (Pass by Reference) }
  OriginalRef := 5;
  Ref_PassByRef(OriginalRef);
  AssertInt('VAR Parameters (Pass by Reference)', 15, OriginalRef);

  { Vector: Scope (Global Visibility) }
  GlobalTarget := 21;
  Ref_GlobalAccess;
  AssertInt('Scope (Global Visibility)', 42, GlobalTarget);

  { Vector: Scope (Local and Variable Shadowing) }
  ShadowTarget := 10;
  Ref_Shadowing;
  AssertInt('Scope (Local and Variable Shadowing)', 10, ShadowTarget);

  { --- FINAL REPORT --- }
  WriteLn('---------------------------------');
  IF FailedTests = 0 THEN TextColor(LightGreen) ELSE TextColor(LightRed);
  WriteLn('PASSED: ', PassedTests, ' / ', TotalTests);
  TextColor(LightGray);
  WriteLn;
  WriteLn('Press ENTER to exit DOSBox...');
  ReadLn;
END.