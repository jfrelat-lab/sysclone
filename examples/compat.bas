' ==============================================================================
' SYSCLONE COMPATIBILITY HARNESS (Auto-Generated)
' Runs silently. Only prints failures and the final score.
' ==============================================================================
TotalTests% = 0
PassedTests% = 0
FailedTests% = 0

PRINT "Running Sysclone Truth Vectors..."
PRINT "---------------------------------"

' --- SUITE: STDLIB: Math & Floating-Point Unit ---

' Vector: INT Function
IntPos = INT(2.8)
IntNeg = INT(-2.2)
TotalTests% = TotalTests% + 1
IF IntPos = 2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [INT Function] IntPos expected "; 2; " but got "; IntPos
END IF
TotalTests% = TotalTests% + 1
IF IntNeg = -3 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [INT Function] IntNeg expected "; -3; " but got "; IntNeg
END IF

' Vector: FIX Function
FixPos = FIX(2.8)
FixNeg = FIX(-2.8)
TotalTests% = TotalTests% + 1
IF FixPos = 2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FIX Function] FixPos expected "; 2; " but got "; FixPos
END IF
TotalTests% = TotalTests% + 1
IF FixNeg = -2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FIX Function] FixNeg expected "; -2; " but got "; FixNeg
END IF

' Vector: CINT Function
CintUp = CINT(2.6)
CintHalfEven = CINT(2.5)
CintHalfOdd = CINT(3.5)
TotalTests% = TotalTests% + 1
IF CintUp = 3 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [CINT Function] CintUp expected "; 3; " but got "; CintUp
END IF
TotalTests% = TotalTests% + 1
IF CintHalfEven = 2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [CINT Function] CintHalfEven expected "; 2; " but got "; CintHalfEven
END IF
TotalTests% = TotalTests% + 1
IF CintHalfOdd = 4 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [CINT Function] CintHalfOdd expected "; 4; " but got "; CintHalfOdd
END IF

' Vector: / (Floating-Point Division)
FloatDiv! = 5 / 2
TotalTests% = TotalTests% + 1
IF FloatDiv! = 2.5 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [/ (Floating-Point Division)] FloatDiv! expected "; 2.5; " but got "; FloatDiv!
END IF

' Vector: \ (Integer Division)
IntDiv! = 5 \ 2
IntDivRound! = 5.6 \ 1.9
IntDivBankerEven! = 2.5 \ 1
IntDivBankerOdd! = 3.5 \ 1
TotalTests% = TotalTests% + 1
IF IntDiv! = 2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [\ (Integer Division)] IntDiv! expected "; 2; " but got "; IntDiv!
END IF
TotalTests% = TotalTests% + 1
IF IntDivRound! = 3 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [\ (Integer Division)] IntDivRound! expected "; 3; " but got "; IntDivRound!
END IF
TotalTests% = TotalTests% + 1
IF IntDivBankerEven! = 2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [\ (Integer Division)] IntDivBankerEven! expected "; 2; " but got "; IntDivBankerEven!
END IF
TotalTests% = TotalTests% + 1
IF IntDivBankerOdd! = 4 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [\ (Integer Division)] IntDivBankerOdd! expected "; 4; " but got "; IntDivBankerOdd!
END IF

' Vector: MOD Operator
ModNorm! = 10 MOD 3
ModNeg! = -10 MOD 3
ModRound! = 10.6 MOD 3
TotalTests% = TotalTests% + 1
IF ModNorm! = 1 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [MOD Operator] ModNorm! expected "; 1; " but got "; ModNorm!
END IF
TotalTests% = TotalTests% + 1
IF ModNeg! = -1 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [MOD Operator] ModNeg! expected "; -1; " but got "; ModNeg!
END IF
TotalTests% = TotalTests% + 1
IF ModRound! = 2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [MOD Operator] ModRound! expected "; 2; " but got "; ModRound!
END IF

' Vector: ABS Function
AbsVal = ABS(-42)
TotalTests% = TotalTests% + 1
IF AbsVal = 42 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [ABS Function] AbsVal expected "; 42; " but got "; AbsVal
END IF

' Vector: SQR Function
SqrVal = SQR(16)
TotalTests% = TotalTests% + 1
IF SqrVal = 4 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [SQR Function] SqrVal expected "; 4; " but got "; SqrVal
END IF

' Vector: SIN Function
SinZero = CINT(SIN(0) * 1000)
TotalTests% = TotalTests% + 1
IF SinZero = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [SIN Function] SinZero expected "; 0; " but got "; SinZero
END IF

' Vector: COS Function
CosZero = CINT(COS(0) * 1000)
TotalTests% = TotalTests% + 1
IF CosZero = 1000 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [COS Function] CosZero expected "; 1000; " but got "; CosZero
END IF

' Vector: TAN Function
TanZero = CINT(TAN(0) * 1000)
TotalTests% = TotalTests% + 1
IF TanZero = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [TAN Function] TanZero expected "; 0; " but got "; TanZero
END IF

' Vector: ATN Function
AtnZero = CINT(ATN(0) * 1000)
TotalTests% = TotalTests% + 1
IF AtnZero = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [ATN Function] AtnZero expected "; 0; " but got "; AtnZero
END IF

' Vector: EXP Function
ExpZero = CINT(EXP(0) * 1000)
TotalTests% = TotalTests% + 1
IF ExpZero = 1000 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [EXP Function] ExpZero expected "; 1000; " but got "; ExpZero
END IF

' Vector: LOG Function
LogOne = CINT(LOG(1) * 1000)
TotalTests% = TotalTests% + 1
IF LogOne = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [LOG Function] LogOne expected "; 0; " but got "; LogOne
END IF

' --- SUITE: STDLIB: Strings & Type Casting ---

' Vector: STR$ Function
PosStr$ = STR$(42)
ZeroStr$ = STR$(0)
NegStr$ = STR$(-15)
TotalTests% = TotalTests% + 1
IF PosStr$ = " 42" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [STR$ Function] PosStr$ expected "; " 42"; " but got "; PosStr$
END IF
TotalTests% = TotalTests% + 1
IF ZeroStr$ = " 0" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [STR$ Function] ZeroStr$ expected "; " 0"; " but got "; ZeroStr$
END IF
TotalTests% = TotalTests% + 1
IF NegStr$ = "-15" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [STR$ Function] NegStr$ expected "; "-15"; " but got "; NegStr$
END IF

' Vector: HEX$ Function
NormHex$ = HEX$(255)
RoundDownHex$ = HEX$(12.4)
RoundUpHex$ = HEX$(12.6)
NegTwosComp$ = HEX$(-1)
LargeNegTwosComp$ = HEX$(-100000)
ZeroHex$ = HEX$(0)
TotalTests% = TotalTests% + 1
IF NormHex$ = "FF" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [HEX$ Function] NormHex$ expected "; "FF"; " but got "; NormHex$
END IF
TotalTests% = TotalTests% + 1
IF RoundDownHex$ = "C" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [HEX$ Function] RoundDownHex$ expected "; "C"; " but got "; RoundDownHex$
END IF
TotalTests% = TotalTests% + 1
IF RoundUpHex$ = "D" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [HEX$ Function] RoundUpHex$ expected "; "D"; " but got "; RoundUpHex$
END IF
TotalTests% = TotalTests% + 1
IF NegTwosComp$ = "FFFF" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [HEX$ Function] NegTwosComp$ expected "; "FFFF"; " but got "; NegTwosComp$
END IF
TotalTests% = TotalTests% + 1
IF LargeNegTwosComp$ = "FFFE7960" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [HEX$ Function] LargeNegTwosComp$ expected "; "FFFE7960"; " but got "; LargeNegTwosComp$
END IF
TotalTests% = TotalTests% + 1
IF ZeroHex$ = "0" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [HEX$ Function] ZeroHex$ expected "; "0"; " but got "; ZeroHex$
END IF

' Vector: VAL Function
NormVal! = VAL("123.45")
HexVal = VAL("&H10")
HexLowVal = VAL("&hc")
OctVal = VAL("&O10")
GarbageVal = VAL("NOTANUMBER")
TotalTests% = TotalTests% + 1
IF NormVal! = 123.45 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [VAL Function] NormVal! expected "; 123.45; " but got "; NormVal!
END IF
TotalTests% = TotalTests% + 1
IF HexVal = 16 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [VAL Function] HexVal expected "; 16; " but got "; HexVal
END IF
TotalTests% = TotalTests% + 1
IF HexLowVal = 12 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [VAL Function] HexLowVal expected "; 12; " but got "; HexLowVal
END IF
TotalTests% = TotalTests% + 1
IF OctVal = 8 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [VAL Function] OctVal expected "; 8; " but got "; OctVal
END IF
TotalTests% = TotalTests% + 1
IF GarbageVal = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [VAL Function] GarbageVal expected "; 0; " but got "; GarbageVal
END IF

' Vector: LEFT$ Function
BaseStr$ = "SYSCLONE"
NormLeft$ = LEFT$(BaseStr$, 3)
OverLeft$ = LEFT$(BaseStr$, 50)
TotalTests% = TotalTests% + 1
IF NormLeft$ = "SYS" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [LEFT$ Function] NormLeft$ expected "; "SYS"; " but got "; NormLeft$
END IF
TotalTests% = TotalTests% + 1
IF OverLeft$ = "SYSCLONE" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [LEFT$ Function] OverLeft$ expected "; "SYSCLONE"; " but got "; OverLeft$
END IF

' Vector: RIGHT$ Function
BaseStr$ = "SYSCLONE"
NormRight$ = RIGHT$(BaseStr$, 5)
OverRight$ = RIGHT$(BaseStr$, 50)
TotalTests% = TotalTests% + 1
IF NormRight$ = "CLONE" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [RIGHT$ Function] NormRight$ expected "; "CLONE"; " but got "; NormRight$
END IF
TotalTests% = TotalTests% + 1
IF OverRight$ = "SYSCLONE" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [RIGHT$ Function] OverRight$ expected "; "SYSCLONE"; " but got "; OverRight$
END IF

' Vector: MID$ Function
BaseStr$ = "SYSCLONE"
NormMid$ = MID$(BaseStr$, 4, 2)
NoLenMid$ = MID$(BaseStr$, 4)
OutBoundsMid$ = MID$(BaseStr$, 99, 2)
TotalTests% = TotalTests% + 1
IF NormMid$ = "CL" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [MID$ Function] NormMid$ expected "; "CL"; " but got "; NormMid$
END IF
TotalTests% = TotalTests% + 1
IF NoLenMid$ = "CLONE" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [MID$ Function] NoLenMid$ expected "; "CLONE"; " but got "; NoLenMid$
END IF
TotalTests% = TotalTests% + 1
IF OutBoundsMid$ = "" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [MID$ Function] OutBoundsMid$ expected "; ""; " but got "; OutBoundsMid$
END IF

' Vector: SPACE$ Function
SpcStr$ = SPACE$(3)
TotalTests% = TotalTests% + 1
IF SpcStr$ = "   " THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [SPACE$ Function] SpcStr$ expected "; "   "; " but got "; SpcStr$
END IF

' Vector: STRING$ Function
StrChar$ = STRING$(4, "A")
StrLong$ = STRING$(3, "XYZ")
StrCode$ = STRING$(3, 65)
TotalTests% = TotalTests% + 1
IF StrChar$ = "AAAA" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [STRING$ Function] StrChar$ expected "; "AAAA"; " but got "; StrChar$
END IF
TotalTests% = TotalTests% + 1
IF StrLong$ = "XXX" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [STRING$ Function] StrLong$ expected "; "XXX"; " but got "; StrLong$
END IF
TotalTests% = TotalTests% + 1
IF StrCode$ = "AAA" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [STRING$ Function] StrCode$ expected "; "AAA"; " but got "; StrCode$
END IF

' Vector: LEN Function
StrLen = LEN("HELLO")
TotalTests% = TotalTests% + 1
IF StrLen = 5 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [LEN Function] StrLen expected "; 5; " but got "; StrLen
END IF

' Vector: UCASE$ Function
UpStr$ = UCASE$("hello")
TotalTests% = TotalTests% + 1
IF UpStr$ = "HELLO" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [UCASE$ Function] UpStr$ expected "; "HELLO"; " but got "; UpStr$
END IF

' Vector: LCASE$ Function
LowStr$ = LCASE$("HELLO")
TotalTests% = TotalTests% + 1
IF LowStr$ = "hello" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [LCASE$ Function] LowStr$ expected "; "hello"; " but got "; LowStr$
END IF

' Vector: LTRIM$ Function
LTrimStr$ = LTRIM$("  TEXT")
TotalTests% = TotalTests% + 1
IF LTrimStr$ = "TEXT" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [LTRIM$ Function] LTrimStr$ expected "; "TEXT"; " but got "; LTrimStr$
END IF

' Vector: RTRIM$ Function
RTrimStr$ = RTRIM$("TEXT  ")
TotalTests% = TotalTests% + 1
IF RTrimStr$ = "TEXT" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [RTRIM$ Function] RTrimStr$ expected "; "TEXT"; " but got "; RTrimStr$
END IF

' Vector: CHR$ Function
Char$ = CHR$(65)
TotalTests% = TotalTests% + 1
IF Char$ = "A" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [CHR$ Function] Char$ expected "; "A"; " but got "; Char$
END IF

' Vector: ASC Function
AscVal = ASC("A")
TotalTests% = TotalTests% + 1
IF AscVal = 65 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [ASC Function] AscVal expected "; 65; " but got "; AscVal
END IF

' Vector: INSTR Function
FoundIdx = INSTR("HELLO WORLD", "WORLD")
OffsetIdx = INSTR(3, "HELLO WORLD, HELLO", "HELLO")
NotFoundIdx = INSTR("HELLO", "Z")
OutBoundsIdx = INSTR(100, "HELLO", "L")
TotalTests% = TotalTests% + 1
IF FoundIdx = 7 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [INSTR Function] FoundIdx expected "; 7; " but got "; FoundIdx
END IF
TotalTests% = TotalTests% + 1
IF OffsetIdx = 14 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [INSTR Function] OffsetIdx expected "; 14; " but got "; OffsetIdx
END IF
TotalTests% = TotalTests% + 1
IF NotFoundIdx = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [INSTR Function] NotFoundIdx expected "; 0; " but got "; NotFoundIdx
END IF
TotalTests% = TotalTests% + 1
IF OutBoundsIdx = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [INSTR Function] OutBoundsIdx expected "; 0; " but got "; OutBoundsIdx
END IF

' --- SUITE: CORE: Control Flow & Jumps ---

' Vector: FOR...NEXT Statement
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
TotalTests% = TotalTests% + 1
IF CountA = 5 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] CountA expected "; 5; " but got "; CountA
END IF
TotalTests% = TotalTests% + 1
IF I = 6 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] I expected "; 6; " but got "; I
END IF
TotalTests% = TotalTests% + 1
IF CountB = 5 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] CountB expected "; 5; " but got "; CountB
END IF
TotalTests% = TotalTests% + 1
IF J = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] J expected "; 0; " but got "; J
END IF
TotalTests% = TotalTests% + 1
IF Runs = 3 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] Runs expected "; 3; " but got "; Runs
END IF
TotalTests% = TotalTests% + 1
IF K = 4 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] K expected "; 4; " but got "; K
END IF
TotalTests% = TotalTests% + 1
IF Limit = 10 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] Limit expected "; 10; " but got "; Limit
END IF
TotalTests% = TotalTests% + 1
IF Inc = 5 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] Inc expected "; 5; " but got "; Inc
END IF
TotalTests% = TotalTests% + 1
IF MutRuns = 3 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] MutRuns expected "; 3; " but got "; MutRuns
END IF
TotalTests% = TotalTests% + 1
IF M = 7 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [FOR...NEXT Statement] M expected "; 7; " but got "; M
END IF

' Vector: DO WHILE / UNTIL (Pre-test Loop)
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
TotalTests% = TotalTests% + 1
IF RunsPreWhile = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DO WHILE / UNTIL (Pre-test Loop)] RunsPreWhile expected "; 0; " but got "; RunsPreWhile
END IF
TotalTests% = TotalTests% + 1
IF RunsPreUntil = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DO WHILE / UNTIL (Pre-test Loop)] RunsPreUntil expected "; 0; " but got "; RunsPreUntil
END IF
TotalTests% = TotalTests% + 1
IF RunsFloat = 1 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DO WHILE / UNTIL (Pre-test Loop)] RunsFloat expected "; 1; " but got "; RunsFloat
END IF

' Vector: DO ... LOOP WHILE / UNTIL (Post-test Loop)
RunsPostA = 0
DO
  RunsPostA = RunsPostA + 1
LOOP WHILE 0

RunsPostB = 0
DO
  RunsPostB = RunsPostB + 1
LOOP UNTIL -1
TotalTests% = TotalTests% + 1
IF RunsPostA = 1 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DO ... LOOP WHILE / UNTIL (Post-test Loop)] RunsPostA expected "; 1; " but got "; RunsPostA
END IF
TotalTests% = TotalTests% + 1
IF RunsPostB = 1 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DO ... LOOP WHILE / UNTIL (Post-test Loop)] RunsPostB expected "; 1; " but got "; RunsPostB
END IF

' --- SUITE: CORE: Memory, Types & Structures ---

' Vector: Default Implicit Typing (SINGLE)
DefaultFloat = 3.14
TotalTests% = TotalTests% + 1
IF DefaultFloat = 3.14 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [Default Implicit Typing (SINGLE)] DefaultFloat expected "; 3.14; " but got "; DefaultFloat
END IF

' Vector: DEFINT Statement
DEFINT A-Z
ImplicitIntA = 2.5
ImplicitIntB = 2.6
TotalTests% = TotalTests% + 1
IF ImplicitIntA = 2 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DEFINT Statement] ImplicitIntA expected "; 2; " but got "; ImplicitIntA
END IF
TotalTests% = TotalTests% + 1
IF ImplicitIntB = 3 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DEFINT Statement] ImplicitIntB expected "; 3; " but got "; ImplicitIntB
END IF

' Vector: DEFSNG Statement
DEFINT A-Z
DEFSNG A-Z
ImplicitSng = 5.8
TotalTests% = TotalTests% + 1
IF ImplicitSng = 5.8 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [DEFSNG Statement] ImplicitSng expected "; 5.8; " but got "; ImplicitSng
END IF

' Vector: Explicit Type Suffix Override
DEFINT A-Z
OverrideFloat! = 3.14
TotalTests% = TotalTests% + 1
IF OverrideFloat! = 3.14 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [Explicit Type Suffix Override] OverrideFloat! expected "; 3.14; " but got "; OverrideFloat!
END IF

' Vector: Memory Aliasing (DIM AS STRING)
DIM AliasTest AS STRING
AliasTest = "NIBBLES"
Extracted$ = AliasTest$
TotalTests% = TotalTests% + 1
IF Extracted$ = "NIBBLES" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [Memory Aliasing (DIM AS STRING)] Extracted$ expected "; "NIBBLES"; " but got "; Extracted$
END IF

' Vector: Fixed-Length String Padding
DIM PadStr AS STRING * 5
PadStr = "HI"
PadLen = LEN(PadStr)
TotalTests% = TotalTests% + 1
IF PadStr = "HI   " THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [Fixed-Length String Padding] PadStr expected "; "HI   "; " but got "; PadStr
END IF
TotalTests% = TotalTests% + 1
IF PadLen = 5 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [Fixed-Length String Padding] PadLen expected "; 5; " but got "; PadLen
END IF

' Vector: Fixed-Length String Truncation
DIM TruncStr AS STRING * 3
TruncStr = "123456"
TotalTests% = TotalTests% + 1
IF TruncStr = "123" THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [Fixed-Length String Truncation] TruncStr expected "; "123"; " but got "; TruncStr
END IF

' Vector: SWAP Statement
SwapA = 99
SwapB = 42
SWAP SwapA, SwapB
TotalTests% = TotalTests% + 1
IF SwapA = 42 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [SWAP Statement] SwapA expected "; 42; " but got "; SwapA
END IF
TotalTests% = TotalTests% + 1
IF SwapB = 99 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [SWAP Statement] SwapB expected "; 99; " but got "; SwapB
END IF

' Vector: ERASE Statement (Static Arrays)
DIM EraseArr(1 TO 3)
EraseArr(2) = 777
ERASE EraseArr
ClearedVal = EraseArr(2)
TotalTests% = TotalTests% + 1
IF ClearedVal = 0 THEN
  PassedTests% = PassedTests% + 1
ELSE
  FailedTests% = FailedTests% + 1
  PRINT "FAIL: [ERASE Statement (Static Arrays)] ClearedVal expected "; 0; " but got "; ClearedVal
END IF

' --- FINAL REPORT ---
PRINT "---------------------------------"
IF FailedTests% = 0 THEN COLOR 10 ELSE COLOR 12
PRINT "PASSED: "; PassedTests%; " / "; TotalTests%
COLOR 7
