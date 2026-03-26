{ ============================================================================== }
{ SYSCLONE COMPATIBILITY HARNESS (Auto-Generated)                                }
{ Runs silently. Only prints failures and the final score.                       }
{ ============================================================================== }
PROGRAM SyscloneCompat;
USES Crt;

VAR
  TotalTests, PassedTests, FailedTests: Integer;
  ValCode1, ValCode2, ValCode3: Integer;
  TruncPos, TruncNeg, RoundUp, RoundHalf, RoundHalfOdd, RoundNegHalf, IntDiv, ModNorm: Longint;
  ModNeg, LenNorm, LenEmpty, PosFound, PosNotFound, PosCase, ValInt, ValErr, LenByteVal: Longint;
  IntPos, IntNeg, ValFloat: Real;
  CopyNorm, CopyOOB, CopyTrunc, DelStr, DelOOB, InsStr, InsOOB, StrInt, StrNeg, StrFloat: String;
  LenByteStr, FirstChar: String;

BEGIN
  ClrScr;
  TotalTests := 0;
  PassedTests := 0;
  FailedTests := 0;
  WriteLn('Running Sysclone Truth Vectors...');
  WriteLn('---------------------------------');

  { --- SUITE: STDLIB: Math & Floating-Point Unit (Turbo Pascal) --- }

  { Vector: Int Function }
  IntPos := Int(2.8);
  IntNeg := Int(-2.8);
  Inc(TotalTests);
  IF Abs(IntPos - 2.0) < 0.0001 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Int Function] IntPos expected ', 2.0:0:2, ' but got ', IntPos:0:2);
  END;
  Inc(TotalTests);
  IF Abs(IntNeg - -2.0) < 0.0001 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Int Function] IntNeg expected ', -2.0:0:2, ' but got ', IntNeg:0:2);
  END;

  { Vector: Trunc Function }
  TruncPos := Trunc(2.8);
  TruncNeg := Trunc(-2.8);
  Inc(TotalTests);
  IF TruncPos = 2 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Trunc Function] TruncPos expected ', 2, ' but got ', TruncPos);
  END;
  Inc(TotalTests);
  IF TruncNeg = -2 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Trunc Function] TruncNeg expected ', -2, ' but got ', TruncNeg);
  END;

  { Vector: Round Function }
  RoundUp := Round(2.6);
  RoundHalf := Round(2.5);
  RoundHalfOdd := Round(3.5);
  RoundNegHalf := Round(-2.5);
  Inc(TotalTests);
  IF RoundUp = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Round Function] RoundUp expected ', 3, ' but got ', RoundUp);
  END;
  Inc(TotalTests);
  IF RoundHalf = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Round Function] RoundHalf expected ', 3, ' but got ', RoundHalf);
  END;
  Inc(TotalTests);
  IF RoundHalfOdd = 4 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Round Function] RoundHalfOdd expected ', 4, ' but got ', RoundHalfOdd);
  END;
  Inc(TotalTests);
  IF RoundNegHalf = -3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Round Function] RoundNegHalf expected ', -3, ' but got ', RoundNegHalf);
  END;

  { Vector: Div Operator (Integer Division) }
  IntDiv := 5 Div 2;
  Inc(TotalTests);
  IF IntDiv = 2 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Div Operator (Integer Division)] IntDiv expected ', 2, ' but got ', IntDiv);
  END;

  { Vector: Mod Operator (Modulo) }
  ModNorm := 10 Mod 3;
  ModNeg := -10 Mod 3;
  Inc(TotalTests);
  IF ModNorm = 1 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Mod Operator (Modulo)] ModNorm expected ', 1, ' but got ', ModNorm);
  END;
  Inc(TotalTests);
  IF ModNeg = -1 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Mod Operator (Modulo)] ModNeg expected ', -1, ' but got ', ModNeg);
  END;

  { --- SUITE: STDLIB: Strings & Type Casting (Turbo Pascal) --- }

  { Vector: Length Function }
  LenNorm := Length('Hello');
  LenEmpty := Length('');
  Inc(TotalTests);
  IF LenNorm = 5 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Length Function] LenNorm expected ', 5, ' but got ', LenNorm);
  END;
  Inc(TotalTests);
  IF LenEmpty = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Length Function] LenEmpty expected ', 0, ' but got ', LenEmpty);
  END;

  { Vector: Copy Function }
  CopyNorm := Copy('Pascal', 1, 4);
  CopyOOB := Copy('Pascal', 10, 2);
  CopyTrunc := Copy('Pascal', 4, 10);
  Inc(TotalTests);
  IF CopyNorm = 'Pasc' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Copy Function] CopyNorm expected ', 'Pasc', ' but got ', CopyNorm);
  END;
  Inc(TotalTests);
  IF CopyOOB = '' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Copy Function] CopyOOB expected ', '', ' but got ', CopyOOB);
  END;
  Inc(TotalTests);
  IF CopyTrunc = 'cal' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Copy Function] CopyTrunc expected ', 'cal', ' but got ', CopyTrunc);
  END;

  { Vector: Pos Function }
  PosFound := Pos('cal', 'Pascal');
  PosNotFound := Pos('Basic', 'Pascal');
  PosCase := Pos('pascal', 'Pascal');
  Inc(TotalTests);
  IF PosFound = 4 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Pos Function] PosFound expected ', 4, ' but got ', PosFound);
  END;
  Inc(TotalTests);
  IF PosNotFound = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Pos Function] PosNotFound expected ', 0, ' but got ', PosNotFound);
  END;
  Inc(TotalTests);
  IF PosCase = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Pos Function] PosCase expected ', 0, ' but got ', PosCase);
  END;

  { Vector: Delete Procedure }
  DelStr := 'Hello World';
  Delete(DelStr, 6, 6);
  DelOOB := 'Test';
  Delete(DelOOB, 10, 2);
  Inc(TotalTests);
  IF DelStr = 'Hello' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Delete Procedure] DelStr expected ', 'Hello', ' but got ', DelStr);
  END;
  Inc(TotalTests);
  IF DelOOB = 'Test' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Delete Procedure] DelOOB expected ', 'Test', ' but got ', DelOOB);
  END;

  { Vector: Insert Procedure }
  InsStr := 'World';
  Insert('Hello ', InsStr, 1);
  InsOOB := 'Hi';
  Insert('!', InsOOB, 10);
  Inc(TotalTests);
  IF InsStr = 'Hello World' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Insert Procedure] InsStr expected ', 'Hello World', ' but got ', InsStr);
  END;
  Inc(TotalTests);
  IF InsOOB = 'Hi!' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Insert Procedure] InsOOB expected ', 'Hi!', ' but got ', InsOOB);
  END;

  { Vector: Str Procedure (Number to String) }
  Str(42, StrInt);
  Str(-42, StrNeg);
  Str(3.14159:0:2, StrFloat);
  Inc(TotalTests);
  IF StrInt = '42' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Str Procedure (Number to String)] StrInt expected ', '42', ' but got ', StrInt);
  END;
  Inc(TotalTests);
  IF StrNeg = '-42' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Str Procedure (Number to String)] StrNeg expected ', '-42', ' but got ', StrNeg);
  END;
  Inc(TotalTests);
  IF StrFloat = '3.14' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Str Procedure (Number to String)] StrFloat expected ', '3.14', ' but got ', StrFloat);
  END;

  { Vector: Val Procedure (String to Number) }
  ValInt := 0;
  Val('42', ValInt, ValCode1);
  ValFloat := 0.0;
  Val('42.5', ValFloat, ValCode2);
  ValErr := 0;
  Val('42X', ValErr, ValCode3);
  Inc(TotalTests);
  IF ValInt = 42 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Val Procedure (String to Number)] ValInt expected ', 42, ' but got ', ValInt);
  END;
  Inc(TotalTests);
  IF ValCode1 = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Val Procedure (String to Number)] ValCode1 expected ', 0, ' but got ', ValCode1);
  END;
  Inc(TotalTests);
  IF Abs(ValFloat - 42.5) < 0.0001 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Val Procedure (String to Number)] ValFloat expected ', 42.5:0:2, ' but got ', ValFloat:0:2);
  END;
  Inc(TotalTests);
  IF ValCode2 = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Val Procedure (String to Number)] ValCode2 expected ', 0, ' but got ', ValCode2);
  END;
  Inc(TotalTests);
  IF ValErr = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Val Procedure (String to Number)] ValErr expected ', 0, ' but got ', ValErr);
  END;
  Inc(TotalTests);
  IF ValCode3 = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Val Procedure (String to Number)] ValCode3 expected ', 3, ' but got ', ValCode3);
  END;

  { Vector: Direct Index Access & Length Byte }
  LenByteStr := 'ABC';
  FirstChar := LenByteStr[1];
  LenByteVal := Ord(LenByteStr[0]);
  Inc(TotalTests);
  IF LenByteStr = 'ABC' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Direct Index Access & Length Byte] LenByteStr expected ', 'ABC', ' but got ', LenByteStr);
  END;
  Inc(TotalTests);
  IF FirstChar = 'A' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Direct Index Access & Length Byte] FirstChar expected ', 'A', ' but got ', FirstChar);
  END;
  Inc(TotalTests);
  IF LenByteVal = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    WriteLn('FAIL: [Direct Index Access & Length Byte] LenByteVal expected ', 3, ' but got ', LenByteVal);
  END;

  { --- FINAL REPORT --- }
  WriteLn('---------------------------------');
  IF FailedTests = 0 THEN TextColor(LightGreen) ELSE TextColor(LightRed);
  WriteLn('PASSED: ', PassedTests, ' / ', TotalTests);
  TextColor(LightGray);
  WriteLn;
  WriteLn('Press ENTER to exit DOSBox...');
  ReadLn;
END.