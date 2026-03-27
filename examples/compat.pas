{ ============================================================================== }
{ SYSCLONE COMPATIBILITY HARNESS (Auto-Generated)                                }
{ Runs silently. Only prints failures and the final score.                       }
{ ============================================================================== }
PROGRAM SyscloneCompat;
USES Crt;

VAR
  TotalTests, PassedTests, FailedTests: Integer;
  OrdTrue, OrdFalse, ZeroVarAnd, ZeroVarOr, BitNotZero, BitNotPos, BitAndEx, BitOrEx: Integer;
  BitXorEx, ShlEx, ShrEx, UnaryBase, UnaryNeg, AddrTarget, DerefTarget, MulRes, AddRes: Integer;
  SubRes, ValCode1, ValCode2, ValCode3, OrdChar, OrdSpace, SizeInt, SizeLong, SizeReal: Integer;
  SizeStr, SizeChar: Integer;
  TruncPos, TruncNeg, RoundUp, RoundHalf, RoundHalfOdd, RoundNegHalf, IntDiv, ModNorm: Longint;
  ModNeg, LenNorm, LenEmpty, PosFound, PosNotFound, PosCase, ValInt, ValErr, LenByteVal: Longint;
  IncBase, IncStep, DecBase, DecStep, SuccNum, PredNum: Longint;
  IntPos, IntNeg, DivRes, ValFloat: Real;
  FirstChar, IncChar, DecChar, SuccChar, ChrVal: Char;
  BoolTrue, BoolFalse, NotTrue, NotFalse, LogAndBase, SurvivedAndShort, LogOrBase: Boolean;
  SurvivedOrShort, LogXorDiff, LogXorSame, EqRes, NeqRes, LtRes, GtRes, LteRes, GteRes: Boolean;
  InResTrue, InResFalse, PrecChain1, PrecChain2, PrecChain3, PrecChainFull: Boolean;
  ConcatRes, CopyNorm, CopyOOB, CopyTrunc, DelStr, DelOOB, InsStr, InsOOB, StrInt, StrNeg: String;
  StrFloat, LenByteStr: String;
  TestPtr, TestPtrDeref: ^Integer;

BEGIN
  ClrScr;
  TotalTests := 0;
  PassedTests := 0;
  FailedTests := 0;
  WriteLn('Running Sysclone Truth Vectors...');
  WriteLn('---------------------------------');

  { --- SUITE: CORE: Logic, Boolean & Bitwise --- }

  { Vector: Boolean Type Fundamentals }
  BoolTrue := True;
  BoolFalse := False;
  OrdTrue := Ord(True);
  OrdFalse := Ord(False);
  Inc(TotalTests);
  IF BoolTrue = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Boolean Type Fundamentals] BoolTrue expected ', True);
    WriteLn(' but got ', BoolTrue);
  END;
  Inc(TotalTests);
  IF BoolFalse = False THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Boolean Type Fundamentals] BoolFalse expected ', False);
    WriteLn(' but got ', BoolFalse);
  END;
  Inc(TotalTests);
  IF OrdTrue = 1 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Boolean Type Fundamentals] OrdTrue expected ', 1);
    WriteLn(' but got ', OrdTrue);
  END;
  Inc(TotalTests);
  IF OrdFalse = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Boolean Type Fundamentals] OrdFalse expected ', 0);
    WriteLn(' but got ', OrdFalse);
  END;

  { Vector: Logical NOT Operator }
  NotTrue := NOT True;
  NotFalse := NOT False;
  Inc(TotalTests);
  IF NotTrue = False THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical NOT Operator] NotTrue expected ', False);
    WriteLn(' but got ', NotTrue);
  END;
  Inc(TotalTests);
  IF NotFalse = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical NOT Operator] NotFalse expected ', True);
    WriteLn(' but got ', NotFalse);
  END;

  { Vector: Logical AND Operator }
  LogAndBase := True AND False;
  ZeroVarAnd := 0;
  SurvivedAndShort := False;
  IF (False) AND (10 DIV ZeroVarAnd = 1) THEN SurvivedAndShort := False ELSE SurvivedAndShort := True;
  Inc(TotalTests);
  IF LogAndBase = False THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical AND Operator] LogAndBase expected ', False);
    WriteLn(' but got ', LogAndBase);
  END;
  Inc(TotalTests);
  IF ZeroVarAnd = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical AND Operator] ZeroVarAnd expected ', 0);
    WriteLn(' but got ', ZeroVarAnd);
  END;
  Inc(TotalTests);
  IF SurvivedAndShort = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical AND Operator] SurvivedAndShort expected ', True);
    WriteLn(' but got ', SurvivedAndShort);
  END;

  { Vector: Logical OR Operator }
  LogOrBase := True OR False;
  ZeroVarOr := 0;
  SurvivedOrShort := False;
  IF (True) OR (10 DIV ZeroVarOr = 1) THEN SurvivedOrShort := True ELSE SurvivedOrShort := False;
  Inc(TotalTests);
  IF LogOrBase = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical OR Operator] LogOrBase expected ', True);
    WriteLn(' but got ', LogOrBase);
  END;
  Inc(TotalTests);
  IF ZeroVarOr = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical OR Operator] ZeroVarOr expected ', 0);
    WriteLn(' but got ', ZeroVarOr);
  END;
  Inc(TotalTests);
  IF SurvivedOrShort = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical OR Operator] SurvivedOrShort expected ', True);
    WriteLn(' but got ', SurvivedOrShort);
  END;

  { Vector: Logical XOR Operator }
  LogXorDiff := True XOR False;
  LogXorSame := True XOR True;
  Inc(TotalTests);
  IF LogXorDiff = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical XOR Operator] LogXorDiff expected ', True);
    WriteLn(' but got ', LogXorDiff);
  END;
  Inc(TotalTests);
  IF LogXorSame = False THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Logical XOR Operator] LogXorSame expected ', False);
    WriteLn(' but got ', LogXorSame);
  END;

  { Vector: Bitwise NOT Operator }
  BitNotZero := NOT 0;
  BitNotPos := NOT 1;
  Inc(TotalTests);
  IF BitNotZero = -1 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Bitwise NOT Operator] BitNotZero expected ', -1);
    WriteLn(' but got ', BitNotZero);
  END;
  Inc(TotalTests);
  IF BitNotPos = -2 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Bitwise NOT Operator] BitNotPos expected ', -2);
    WriteLn(' but got ', BitNotPos);
  END;

  { Vector: Bitwise AND Operator }
  BitAndEx := 170 AND 85;
  Inc(TotalTests);
  IF BitAndEx = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Bitwise AND Operator] BitAndEx expected ', 0);
    WriteLn(' but got ', BitAndEx);
  END;

  { Vector: Bitwise OR Operator }
  BitOrEx := 170 OR 85;
  Inc(TotalTests);
  IF BitOrEx = 255 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Bitwise OR Operator] BitOrEx expected ', 255);
    WriteLn(' but got ', BitOrEx);
  END;

  { Vector: Bitwise XOR Operator }
  BitXorEx := 170 XOR 255;
  Inc(TotalTests);
  IF BitXorEx = 85 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Bitwise XOR Operator] BitXorEx expected ', 85);
    WriteLn(' but got ', BitXorEx);
  END;

  { Vector: Bit Shift Left (SHL) }
  ShlEx := 1 SHL 3;
  Inc(TotalTests);
  IF ShlEx = 8 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Bit Shift Left (SHL)] ShlEx expected ', 8);
    WriteLn(' but got ', ShlEx);
  END;

  { Vector: Bit Shift Right (SHR) }
  ShrEx := 8 SHR 1;
  Inc(TotalTests);
  IF ShrEx = 4 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Bit Shift Right (SHR)] ShrEx expected ', 4);
    WriteLn(' but got ', ShrEx);
  END;

  { --- SUITE: STDLIB: Math Built-ins --- }

  { Vector: Int Function }
  IntPos := Int(2.8);
  IntNeg := Int(-2.8);
  Inc(TotalTests);
  IF Abs(IntPos - 2.0) < 0.0001 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Int Function] IntPos expected ', 2.0:0:2);
    WriteLn(' but got ', IntPos:0:2);
  END;
  Inc(TotalTests);
  IF Abs(IntNeg - -2.0) < 0.0001 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Int Function] IntNeg expected ', -2.0:0:2);
    WriteLn(' but got ', IntNeg:0:2);
  END;

  { Vector: Trunc Function }
  TruncPos := Trunc(2.8);
  TruncNeg := Trunc(-2.8);
  Inc(TotalTests);
  IF TruncPos = 2 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Trunc Function] TruncPos expected ', 2);
    WriteLn(' but got ', TruncPos);
  END;
  Inc(TotalTests);
  IF TruncNeg = -2 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Trunc Function] TruncNeg expected ', -2);
    WriteLn(' but got ', TruncNeg);
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
    Write('FAIL: [Round Function] RoundUp expected ', 3);
    WriteLn(' but got ', RoundUp);
  END;
  Inc(TotalTests);
  IF RoundHalf = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Round Function] RoundHalf expected ', 3);
    WriteLn(' but got ', RoundHalf);
  END;
  Inc(TotalTests);
  IF RoundHalfOdd = 4 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Round Function] RoundHalfOdd expected ', 4);
    WriteLn(' but got ', RoundHalfOdd);
  END;
  Inc(TotalTests);
  IF RoundNegHalf = -3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Round Function] RoundNegHalf expected ', -3);
    WriteLn(' but got ', RoundNegHalf);
  END;

  { Vector: Integer Division (DIV) }
  IntDiv := 10 DIV 3;
  Inc(TotalTests);
  IF IntDiv = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Integer Division (DIV)] IntDiv expected ', 3);
    WriteLn(' but got ', IntDiv);
  END;

  { Vector: Modulo Operator (MOD) }
  ModNorm := 10 MOD 3;
  ModNeg := -10 MOD 3;
  Inc(TotalTests);
  IF ModNorm = 1 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Modulo Operator (MOD)] ModNorm expected ', 1);
    WriteLn(' but got ', ModNorm);
  END;
  Inc(TotalTests);
  IF ModNeg = -1 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Modulo Operator (MOD)] ModNeg expected ', -1);
    WriteLn(' but got ', ModNeg);
  END;

  { --- SUITE: CORE: Operators & Precedence --- }

  { Vector: Unary Minus Operator (-) }
  UnaryBase := 5;
  UnaryNeg := -UnaryBase;
  Inc(TotalTests);
  IF UnaryBase = 5 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Unary Minus Operator (-)] UnaryBase expected ', 5);
    WriteLn(' but got ', UnaryBase);
  END;
  Inc(TotalTests);
  IF UnaryNeg = -5 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Unary Minus Operator (-)] UnaryNeg expected ', -5);
    WriteLn(' but got ', UnaryNeg);
  END;

  { Vector: Address Operator (@) }
  AddrTarget := 42;
  TestPtr := @AddrTarget;
  Inc(TotalTests);
  IF AddrTarget = 42 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Address Operator (@)] AddrTarget expected ', 42);
    WriteLn(' but got ', AddrTarget);
  END;
  Inc(TotalTests);
  IF TestPtr = @AddrTarget THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Address Operator (@)] TestPtr expected ', Longint(@AddrTarget));
    WriteLn(' but got ', Longint(TestPtr));
  END;

  { Vector: Dereference Operator (^) }
  DerefTarget := 10;
  TestPtrDeref := @DerefTarget;
  TestPtrDeref^ := 99;
  Inc(TotalTests);
  IF DerefTarget = 99 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Dereference Operator (^)] DerefTarget expected ', 99);
    WriteLn(' but got ', DerefTarget);
  END;
  Inc(TotalTests);
  IF TestPtrDeref = @DerefTarget THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Dereference Operator (^)] TestPtrDeref expected ', Longint(@DerefTarget));
    WriteLn(' but got ', Longint(TestPtrDeref));
  END;

  { Vector: Multiplication Operator (*) }
  MulRes := 6 * 7;
  Inc(TotalTests);
  IF MulRes = 42 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Multiplication Operator (*)] MulRes expected ', 42);
    WriteLn(' but got ', MulRes);
  END;

  { Vector: Real Division Operator (/) }
  DivRes := 10 / 4;
  Inc(TotalTests);
  IF Abs(DivRes - 2.5) < 0.0001 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Real Division Operator (/)] DivRes expected ', 2.5:0:2);
    WriteLn(' but got ', DivRes:0:2);
  END;

  { Vector: Addition Operator (+) }
  AddRes := 10 + 5;
  Inc(TotalTests);
  IF AddRes = 15 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Addition Operator (+)] AddRes expected ', 15);
    WriteLn(' but got ', AddRes);
  END;

  { Vector: Subtraction Operator (-) }
  SubRes := 10 - 5;
  Inc(TotalTests);
  IF SubRes = 5 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Subtraction Operator (-)] SubRes expected ', 5);
    WriteLn(' but got ', SubRes);
  END;

  { Vector: String Concatenation Operator (+) }
  ConcatRes := 'Sys' + 'clone';
  Inc(TotalTests);
  IF ConcatRes = 'Sysclone' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [String Concatenation Operator (+)] ConcatRes expected ', 'Sysclone');
    WriteLn(' but got ', ConcatRes);
  END;

  { Vector: Equality Operator (=) }
  EqRes := (5 = 5);
  Inc(TotalTests);
  IF EqRes = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Equality Operator (=)] EqRes expected ', True);
    WriteLn(' but got ', EqRes);
  END;

  { Vector: Inequality Operator (<>) }
  NeqRes := (5 <> 4);
  Inc(TotalTests);
  IF NeqRes = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Inequality Operator (<>)] NeqRes expected ', True);
    WriteLn(' but got ', NeqRes);
  END;

  { Vector: Less Than Operator (<) }
  LtRes := (4 < 5);
  Inc(TotalTests);
  IF LtRes = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Less Than Operator (<)] LtRes expected ', True);
    WriteLn(' but got ', LtRes);
  END;

  { Vector: Greater Than Operator (>) }
  GtRes := (5 > 4);
  Inc(TotalTests);
  IF GtRes = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Greater Than Operator (>)] GtRes expected ', True);
    WriteLn(' but got ', GtRes);
  END;

  { Vector: Less Than or Equal Operator (<=) }
  LteRes := (5 <= 5);
  Inc(TotalTests);
  IF LteRes = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Less Than or Equal Operator (<=)] LteRes expected ', True);
    WriteLn(' but got ', LteRes);
  END;

  { Vector: Greater Than or Equal Operator (>=) }
  GteRes := (5 >= 5);
  Inc(TotalTests);
  IF GteRes = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Greater Than or Equal Operator (>=)] GteRes expected ', True);
    WriteLn(' but got ', GteRes);
  END;

  { Vector: Set Membership Operator (IN) }
  InResTrue := 3 IN [1, 2, 3, 4, 5];
  InResFalse := 9 IN [1, 2, 3];
  Inc(TotalTests);
  IF InResTrue = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Set Membership Operator (IN)] InResTrue expected ', True);
    WriteLn(' but got ', InResTrue);
  END;
  Inc(TotalTests);
  IF InResFalse = False THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Set Membership Operator (IN)] InResFalse expected ', False);
    WriteLn(' but got ', InResFalse);
  END;

  { Vector: Operator Precedence Matrix }
  PrecChain1 := (5 + 2 * 3 = 11);
  PrecChain2 := (10 - 6 / 2 = 7.0);
  PrecChain3 := NOT False AND True;
  PrecChainFull := PrecChain1 AND PrecChain2 AND PrecChain3 AND (3 IN [1..5]);
  Inc(TotalTests);
  IF PrecChain1 = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Operator Precedence Matrix] PrecChain1 expected ', True);
    WriteLn(' but got ', PrecChain1);
  END;
  Inc(TotalTests);
  IF PrecChain2 = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Operator Precedence Matrix] PrecChain2 expected ', True);
    WriteLn(' but got ', PrecChain2);
  END;
  Inc(TotalTests);
  IF PrecChain3 = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Operator Precedence Matrix] PrecChain3 expected ', True);
    WriteLn(' but got ', PrecChain3);
  END;
  Inc(TotalTests);
  IF PrecChainFull = True THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Operator Precedence Matrix] PrecChainFull expected ', True);
    WriteLn(' but got ', PrecChainFull);
  END;

  { --- SUITE: STDLIB: Strings & Type Casting --- }

  { Vector: Length Function }
  LenNorm := Length('Hello');
  LenEmpty := Length('');
  Inc(TotalTests);
  IF LenNorm = 5 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Length Function] LenNorm expected ', 5);
    WriteLn(' but got ', LenNorm);
  END;
  Inc(TotalTests);
  IF LenEmpty = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Length Function] LenEmpty expected ', 0);
    WriteLn(' but got ', LenEmpty);
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
    Write('FAIL: [Copy Function] CopyNorm expected ', 'Pasc');
    WriteLn(' but got ', CopyNorm);
  END;
  Inc(TotalTests);
  IF CopyOOB = '' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Copy Function] CopyOOB expected ', '');
    WriteLn(' but got ', CopyOOB);
  END;
  Inc(TotalTests);
  IF CopyTrunc = 'cal' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Copy Function] CopyTrunc expected ', 'cal');
    WriteLn(' but got ', CopyTrunc);
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
    Write('FAIL: [Pos Function] PosFound expected ', 4);
    WriteLn(' but got ', PosFound);
  END;
  Inc(TotalTests);
  IF PosNotFound = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Pos Function] PosNotFound expected ', 0);
    WriteLn(' but got ', PosNotFound);
  END;
  Inc(TotalTests);
  IF PosCase = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Pos Function] PosCase expected ', 0);
    WriteLn(' but got ', PosCase);
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
    Write('FAIL: [Delete Procedure] DelStr expected ', 'Hello');
    WriteLn(' but got ', DelStr);
  END;
  Inc(TotalTests);
  IF DelOOB = 'Test' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Delete Procedure] DelOOB expected ', 'Test');
    WriteLn(' but got ', DelOOB);
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
    Write('FAIL: [Insert Procedure] InsStr expected ', 'Hello World');
    WriteLn(' but got ', InsStr);
  END;
  Inc(TotalTests);
  IF InsOOB = 'Hi!' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Insert Procedure] InsOOB expected ', 'Hi!');
    WriteLn(' but got ', InsOOB);
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
    Write('FAIL: [Str Procedure (Number to String)] StrInt expected ', '42');
    WriteLn(' but got ', StrInt);
  END;
  Inc(TotalTests);
  IF StrNeg = '-42' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Str Procedure (Number to String)] StrNeg expected ', '-42');
    WriteLn(' but got ', StrNeg);
  END;
  Inc(TotalTests);
  IF StrFloat = '3.14' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Str Procedure (Number to String)] StrFloat expected ', '3.14');
    WriteLn(' but got ', StrFloat);
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
    Write('FAIL: [Val Procedure (String to Number)] ValInt expected ', 42);
    WriteLn(' but got ', ValInt);
  END;
  Inc(TotalTests);
  IF ValCode1 = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Val Procedure (String to Number)] ValCode1 expected ', 0);
    WriteLn(' but got ', ValCode1);
  END;
  Inc(TotalTests);
  IF Abs(ValFloat - 42.5) < 0.0001 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Val Procedure (String to Number)] ValFloat expected ', 42.5:0:2);
    WriteLn(' but got ', ValFloat:0:2);
  END;
  Inc(TotalTests);
  IF ValCode2 = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Val Procedure (String to Number)] ValCode2 expected ', 0);
    WriteLn(' but got ', ValCode2);
  END;
  Inc(TotalTests);
  IF ValErr = 0 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Val Procedure (String to Number)] ValErr expected ', 0);
    WriteLn(' but got ', ValErr);
  END;
  Inc(TotalTests);
  IF ValCode3 = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Val Procedure (String to Number)] ValCode3 expected ', 3);
    WriteLn(' but got ', ValCode3);
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
    Write('FAIL: [Direct Index Access & Length Byte] LenByteStr expected ', 'ABC');
    WriteLn(' but got ', LenByteStr);
  END;
  Inc(TotalTests);
  IF FirstChar = 'A' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Direct Index Access & Length Byte] FirstChar expected ', 'A');
    WriteLn(' but got ', FirstChar);
  END;
  Inc(TotalTests);
  IF LenByteVal = 3 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Direct Index Access & Length Byte] LenByteVal expected ', 3);
    WriteLn(' but got ', LenByteVal);
  END;

  { --- SUITE: STDLIB: System & Ordinal Routines --- }

  { Vector: Inc Procedure }
  IncBase := 10;
  Inc(IncBase);
  IncStep := 10;
  Inc(IncStep, 5);
  IncChar := 'A';
  Inc(IncChar);
  Inc(TotalTests);
  IF IncBase = 11 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Inc Procedure] IncBase expected ', 11);
    WriteLn(' but got ', IncBase);
  END;
  Inc(TotalTests);
  IF IncStep = 15 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Inc Procedure] IncStep expected ', 15);
    WriteLn(' but got ', IncStep);
  END;
  Inc(TotalTests);
  IF IncChar = 'B' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Inc Procedure] IncChar expected ', 'B');
    WriteLn(' but got ', IncChar);
  END;

  { Vector: Dec Procedure }
  DecBase := 10;
  Dec(DecBase);
  DecStep := 10;
  Dec(DecStep, 5);
  DecChar := 'B';
  Dec(DecChar);
  Inc(TotalTests);
  IF DecBase = 9 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Dec Procedure] DecBase expected ', 9);
    WriteLn(' but got ', DecBase);
  END;
  Inc(TotalTests);
  IF DecStep = 5 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Dec Procedure] DecStep expected ', 5);
    WriteLn(' but got ', DecStep);
  END;
  Inc(TotalTests);
  IF DecChar = 'A' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Dec Procedure] DecChar expected ', 'A');
    WriteLn(' but got ', DecChar);
  END;

  { Vector: Succ and Pred Functions }
  SuccNum := Succ(42);
  PredNum := Pred(42);
  SuccChar := Succ('A');
  Inc(TotalTests);
  IF SuccNum = 43 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Succ and Pred Functions] SuccNum expected ', 43);
    WriteLn(' but got ', SuccNum);
  END;
  Inc(TotalTests);
  IF PredNum = 41 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Succ and Pred Functions] PredNum expected ', 41);
    WriteLn(' but got ', PredNum);
  END;
  Inc(TotalTests);
  IF SuccChar = 'B' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Succ and Pred Functions] SuccChar expected ', 'B');
    WriteLn(' but got ', SuccChar);
  END;

  { Vector: Ord Function }
  OrdChar := Ord('A');
  OrdSpace := Ord(' ');
  Inc(TotalTests);
  IF OrdChar = 65 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Ord Function] OrdChar expected ', 65);
    WriteLn(' but got ', OrdChar);
  END;
  Inc(TotalTests);
  IF OrdSpace = 32 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Ord Function] OrdSpace expected ', 32);
    WriteLn(' but got ', OrdSpace);
  END;

  { Vector: Chr Function }
  ChrVal := Chr(65);
  Inc(TotalTests);
  IF ChrVal = 'A' THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [Chr Function] ChrVal expected ', 'A');
    WriteLn(' but got ', ChrVal);
  END;

  { Vector: SizeOf Function }
  SizeInt := SizeOf(Integer);
  SizeLong := SizeOf(Longint);
  SizeReal := SizeOf(Real);
  SizeStr := SizeOf(String);
  SizeChar := SizeOf(Char);
  Inc(TotalTests);
  IF SizeInt = 2 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [SizeOf Function] SizeInt expected ', 2);
    WriteLn(' but got ', SizeInt);
  END;
  Inc(TotalTests);
  IF SizeLong = 4 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [SizeOf Function] SizeLong expected ', 4);
    WriteLn(' but got ', SizeLong);
  END;
  Inc(TotalTests);
  IF SizeReal = 6 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [SizeOf Function] SizeReal expected ', 6);
    WriteLn(' but got ', SizeReal);
  END;
  Inc(TotalTests);
  IF SizeStr = 256 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [SizeOf Function] SizeStr expected ', 256);
    WriteLn(' but got ', SizeStr);
  END;
  Inc(TotalTests);
  IF SizeChar = 1 THEN
    Inc(PassedTests)
  ELSE BEGIN
    Inc(FailedTests);
    Write('FAIL: [SizeOf Function] SizeChar expected ', 1);
    WriteLn(' but got ', SizeChar);
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