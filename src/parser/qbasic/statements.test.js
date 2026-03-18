// src/parser/statements.test.js
import { 
    implicitCallStmt, inputStmt, locateStmt, colorStmt, pokeStmt, 
    assignStmt, swapStmt, eraseStmt, labelDef, gotoStmt, gosubStmt, returnStmt, 
    printStmt, dataStmt, restoreStmt, windowStmt, psetStmt, presetStmt,
    lineStmt, circleStmt, paintStmt, onErrorStmt, resumeStmt,
    paletteStmt, putGraphicsStmt, getGraphicsStmt, lineInputStmt,
    clsStmt, viewPrintStmt, playStmt, soundStmt, exitStmt,
    screenStmt
} from './statements.js';

import { test, assertEqual, registerSuite } from '../../test_runner.js';

/**
 * Pure Unit tests for QBasic Statements.
 * Validates each isolated parser directly to ensure architectural decoupling.
 */
registerSuite('QBasic Instructions (Statements)', () => {

    test('implicitCallStmt() should parse implicit calls without CALL keyword', () => {
        // Example: Set 25, i, colorTable(3)
        const ast = implicitCallStmt.run('Set 25, i, colorTable(3)').result;
        assertEqual(ast.type, 'CALL');
        assertEqual(ast.callee.value, 'SET');
        assertEqual(ast.args.length, 3);
        assertEqual(ast.args[0].value, 25);
        assertEqual(ast.args[1].value, 'I');
        assertEqual(ast.args[2].type, 'CALL'); // colorTable(3) is a nested call
    });

    test('inputStmt() should parse INPUT with or without prompt text', () => {
        const input1 = inputStmt.run('INPUT "Name"; player$');
        assertEqual(input1.result.type, 'INPUT');
        assertEqual(input1.result.prompt, 'Name');
        assertEqual(input1.result.targets[0].value, 'PLAYER$');

        const input2 = inputStmt.run('INPUT gamespeed$');
        assertEqual(input2.result.type, 'INPUT');
        assertEqual(input2.result.prompt, ''); // Empty prompt
        assertEqual(input2.result.targets[0].value, 'GAMESPEED$');
    });

    test('locateStmt() should parse LOCATE with up to 5 arguments and ghost commas', () => {
        // 1. One argument (Row only)
        const loc1 = locateStmt.run('LOCATE 10');
        assertEqual(loc1.result.type, 'LOCATE');
        assertEqual(loc1.result.row.value, 10);
        assertEqual(loc1.result.col, null);
        assertEqual(loc1.result.cursor, null);
        assertEqual(loc1.result.start, null);
        assertEqual(loc1.result.stop, null);

        // 2. Two arguments (Row and Col)
        const loc2 = locateStmt.run('LOCATE 5, 20');
        assertEqual(loc2.result.row.value, 5);
        assertEqual(loc2.result.col.value, 20);
        
        // 3. Omitted Row (Ghost comma) - Critical for MS-DOS menus
        const loc3 = locateStmt.run('LOCATE , 30');
        assertEqual(loc3.result.row, null);
        assertEqual(loc3.result.col.value, 30);

        // 4. Cursor visibility toggle only
        const loc4 = locateStmt.run('LOCATE , , 0');
        assertEqual(loc4.result.row, null);
        assertEqual(loc4.result.col, null);
        assertEqual(loc4.result.cursor.value, 0);

        // 5. The Torus.bas Final Boss: All 5 arguments! (Row, Col, Cursor, Start, Stop)
        const loc5 = locateStmt.run('LOCATE 9, 20, 1, 1, 12');
        assertEqual(loc5.result.row.value, 9);
        assertEqual(loc5.result.col.value, 20);
        assertEqual(loc5.result.cursor.value, 1);
        assertEqual(loc5.result.start.value, 1);
        assertEqual(loc5.result.stop.value, 12);

        // 6. Extreme Ghosting (Omitting middle parameters)
        const loc6 = locateStmt.run('LOCATE 10, , , , 15');
        assertEqual(loc6.result.row.value, 10);
        assertEqual(loc6.result.col, null);
        assertEqual(loc6.result.cursor, null);
        assertEqual(loc6.result.start, null);
        assertEqual(loc6.result.stop.value, 15);
    });

    test('colorStmt() should parse COLOR with foreground, background, or missing arguments', () => {
        const col = colorStmt.run('COLOR 15, 0');
        assertEqual(col.result.type, 'COLOR');
        assertEqual(col.result.fg.value, 15);
        assertEqual(col.result.bg.value, 0);

        // Critical case: background only (common in legacy code)
        const colBgOnly = colorStmt.run('COLOR , 4');
        assertEqual(colBgOnly.result.type, 'COLOR');
        assertEqual(colBgOnly.result.fg, null); // Foreground remains unchanged
        assertEqual(colBgOnly.result.bg.value, 4);
    });

    test('pokeStmt() should parse POKE with mandatory comma and hex support', () => {
        // Hexadecimal support check (&H41A = 1050)
        const poke = pokeStmt.run('POKE &H41A, 30');
        assertEqual(poke.result.type, 'POKE');
        assertEqual(poke.result.address.value, 1050); 
        assertEqual(poke.result.value.value, 30);
    });

    test('assignStmt() should parse variable assignments', () => {
        const assign = assignStmt.run('score = lives * 10');
        assertEqual(assign.result.type, 'ASSIGN');
        assertEqual(assign.result.target.type, 'IDENTIFIER');
        assertEqual(assign.result.target.value, 'SCORE');
        assertEqual(assign.result.value.type, 'BINARY_OP'); 
    });

    test('Branching Statements should parse Labels, GOTO, GOSUB, and RETURN', () => {
        const label = labelDef.run('DrawApple:');
        assertEqual(label.result.type, 'LABEL');
        assertEqual(label.result.name, 'DRAWAPPLE');

        const gt = gotoStmt.run('GOTO MainLoop');
        assertEqual(gt.result.type, 'GOTO');
        assertEqual(gt.result.label, 'MAINLOOP');

        const gs = gosubStmt.run('GOSUB PlayBuzzer');
        assertEqual(gs.result.type, 'GOSUB');
        assertEqual(gs.result.label, 'PLAYBUZZER');

        const ret = returnStmt.run('RETURN');
        assertEqual(ret.result.type, 'RETURN');
    });

    test('printStmt() should parse PRINT and PRINT USING', () => {
        const print1 = printStmt.run('PRINT "Hello"');
        assertEqual(print1.result.type, 'PRINT');
        assertEqual(print1.result.usingFormat, null);

        const print2 = printStmt.run('PRINT USING "#,###"; score');
        assertEqual(print2.result.type, 'PRINT');
        assertEqual(print2.result.usingFormat.value, "#,###");
        assertEqual(print2.result.values[0].value, 'SCORE');
    });

    test('Data Statements should parse DATA and RESTORE', () => {
        // Test standard
        const data = dataStmt.run('DATA 15, "Color", 0');
        assertEqual(data.result.type, 'DATA');
        assertEqual(data.result.values.length, 3);

        const rest1 = restoreStmt.run('RESTORE');
        assertEqual(rest1.result.type, 'RESTORE');
        assertEqual(rest1.result.label, null);

        const rest2 = restoreStmt.run('RESTORE InitColors');
        assertEqual(rest2.result.type, 'RESTORE');
        assertEqual(rest2.result.label, 'INITCOLORS');
    });

    test('dataStmt() should parse empty entries, trailing commas, and unquoted symbols', () => {
        // Exact use-case from MS-DOS sortdemo.bas (with an added trailing comma to ensure robustness)
        const code = 'DATA Toggle Sound, , <   (Slower), >   (Faster),';
        const data = dataStmt.run(code);
        
        assertEqual(data.isError, false);
        assertEqual(data.result.type, 'DATA');
        
        // 3 explicit values + 1 empty middle + 1 empty trailing = 5 elements
        assertEqual(data.result.values.length, 5); 
        
        // 1. Unquoted String with spaces
        assertEqual(data.result.values[0].value, 'Toggle Sound');
        
        // 2. Empty entry from consecutive commas ", ,"
        assertEqual(data.result.values[1].value, '');
        
        // 3 & 4. Unquoted Strings with symbols and parens
        assertEqual(data.result.values[2].value, '<   (Slower)');
        assertEqual(data.result.values[3].value, '>   (Faster)');
        
        // 5. The trailing comma leaves an empty entry at the end
        assertEqual(data.result.values[4].value, '');
    });

    test('windowStmt() should parse WINDOW statements with math coordinates', () => {
        const win = windowStmt.run('WINDOW (-2, 1.5)-(2, -1.5)');
        
        assertEqual(win.result.type, 'WINDOW');
        assertEqual(win.result.invertY, false);
        
        assertEqual(win.result.x1.type, 'UNARY_OP');
        assertEqual(win.result.x1.argument.value, 2);
        assertEqual(win.result.y1.value, 1.5);
        
        assertEqual(win.result.x2.value, 2);
        assertEqual(win.result.y2.type, 'UNARY_OP');
        assertEqual(win.result.y2.argument.value, 1.5);

        // QBasic allows WINDOW SCREEN to invert axis
        const winScreen = windowStmt.run('WINDOW SCREEN (0, 0)-(320, 200)');
        assertEqual(winScreen.result.invertY, true);
        assertEqual(winScreen.result.x2.value, 320);
    });

    test('psetStmt() should parse PSET pixel drawing statements', () => {
        const pset = psetStmt.run('PSET (x, y), c');
        
        assertEqual(pset.result.type, 'PSET');
        assertEqual(pset.result.isStep, false);
        assertEqual(pset.result.x.value, 'X');
        assertEqual(pset.result.y.value, 'Y');
        assertEqual(pset.result.color.value, 'C');

        const psetNoColor = psetStmt.run('PSET (10, 20)');
        assertEqual(psetNoColor.result.color, null);
    });

    test('stepCoordParser should handle STEP with or without trailing whitespace', () => {
        // 1. Standard MS-DOS formatting (with space)
        const psetWithSpace = psetStmt.run('PSET STEP (10, 20), 15');
        assertEqual(psetWithSpace.isError, false);
        assertEqual(psetWithSpace.result.isStep, true);
        assertEqual(psetWithSpace.result.x.value, 10);

        // 2. The Torus.bas Edge Case (no space between STEP and parenthesis)
        const psetNoSpace = psetStmt.run('PSET STEP(30, 40)');
        assertEqual(psetNoSpace.isError, false);
        assertEqual(psetNoSpace.result.isStep, true);
        assertEqual(psetNoSpace.result.x.value, 30);

        // 3. Gorillas.bas Edge Case (Relative line drawing with mixed spaces)
        const lineStep = lineStmt.run('LINE STEP (5, 5)-STEP(15, 15)');
        assertEqual(lineStep.isError, false);
        assertEqual(lineStep.result.startIsStep, true);
        assertEqual(lineStep.result.endIsStep, true);
    });

    test('Gorillas Geometry should parse LINE, CIRCLE, and PAINT', () => {
        // 1. LINE with missing color and BF flag
        const line = lineStmt.run('LINE (10, 10)-(20, 20), , BF');
        assertEqual(line.result.type, 'LINE');
        assertEqual(line.result.startX.value, 10);
        assertEqual(line.result.color, null); 
        assertEqual(line.result.box, 'BF');   

        // 2. CIRCLE with step and radians (Sun Smile)
        const circle = circleStmt.run('CIRCLE STEP (x, y), 8, 0, 3.14, 6.28');
        assertEqual(circle.result.type, 'CIRCLE');
        assertEqual(circle.result.isStep, true);
        assertEqual(circle.result.radius.value, 8);
        assertEqual(circle.result.color.value, 0);
        assertEqual(circle.result.start.value, 3.14);

        // 3. PAINT
        const paint = paintStmt.run('PAINT (x, y), SUNATTR');
        assertEqual(paint.result.type, 'PAINT');
        assertEqual(paint.result.paintColor.value, 'SUNATTR');
        assertEqual(paint.result.borderColor, null);
    });

    test('lineStmt() should parse LINE without starting coordinates (LINE -)', () => {
        const line = lineStmt.run('LINE -(T.x3, T.y3), T.TColor');
        assertEqual(line.isError, false);
        assertEqual(line.result.startX, null);
        assertEqual(line.result.startY, null);
        assertEqual(line.result.endX.property, 'X3');
        assertEqual(line.result.color.property, 'TCOLOR');
    });

    test('presetStmt() should parse PRESET commands', () => {
        const preset = presetStmt.run('PRESET (T.xc, T.yc)');
        assertEqual(preset.isError, false);
        assertEqual(preset.result.type, 'PRESET');
        assertEqual(preset.result.color, null);
    });

    test('Legacy Hardware should parse ON ERROR, PALETTE and RESUME', () => {
        // --- 1. ON ERROR GOTO ---
        // Disable error handling
        const onError = onErrorStmt.run('ON ERROR GOTO 0');
        assertEqual(onError.isError, false);
        assertEqual(onError.result.type, 'ON_ERROR');
        assertEqual(onError.result.target, 0);

        // Jump to a specific error handling routine
        const onErrorLabel = onErrorStmt.run('ON ERROR GOTO ScreenModeError');
        assertEqual(onErrorLabel.isError, false);
        assertEqual(onErrorLabel.result.type, 'ON_ERROR');
        assertEqual(onErrorLabel.result.target.toUpperCase(), 'SCREENMODEERROR');

        // --- 2. PALETTE ---
        // Hardware color mapping
        const palette = paletteStmt.run('PALETTE 4, 0');
        assertEqual(palette.isError, false);
        assertEqual(palette.result.type, 'PALETTE');
        assertEqual(palette.result.attribute.value, 4);
        assertEqual(palette.result.color.value, 0);

        // --- 3. RESUME ---
        // Variant 1: Return to the exact statement that caused the error
        const resume1 = resumeStmt.run('RESUME');
        assertEqual(resume1.isError, false);
        assertEqual(resume1.result.type, 'RESUME');
        assertEqual(resume1.result.target, null);

        // Variant 2: Skip the faulty statement and proceed to the next one
        const resume2 = resumeStmt.run('RESUME NEXT');
        assertEqual(resume2.isError, false);
        assertEqual(resume2.result.type, 'RESUME');
        assertEqual(resume2.result.target, 'NEXT');

        // Variant 3: Jump to a specific label to recover
        const resume3 = resumeStmt.run('RESUME MainMenu');
        assertEqual(resume3.isError, false);
        assertEqual(resume3.result.type, 'RESUME');
        assertEqual(resume3.result.target.toUpperCase(), 'MAINMENU'); 
    });

    test('putGraphicsStmt() should parse sprite rendering with XOR and PSET', () => {
        // 1. PSET mode (Opaque draw)
        const putPset = putGraphicsStmt.run('PUT (xc#, yc#), LBan&, PSET');
        assertEqual(putPset.isError, false);
        assertEqual(putPset.result.type, 'PUT_GRAPHICS');
        assertEqual(putPset.result.isStep, false);
        assertEqual(putPset.result.x.value, 'XC#');
        assertEqual(putPset.result.target.value, 'LBAN&');
        assertEqual(putPset.result.action, 'PSET');

        // 2. XOR mode (Mask blending)
        const putXor = putGraphicsStmt.run('PUT (10, 20), UBan&, XOR');
        assertEqual(putXor.isError, false);
        assertEqual(putXor.result.action, 'XOR');

        // 3. Default action (QBasic defaults to XOR if omitted)
        const putDefault = putGraphicsStmt.run('PUT STEP (x, y), DBan&');
        assertEqual(putDefault.isError, false);
        assertEqual(putDefault.result.isStep, true);
        assertEqual(putDefault.result.action, 'XOR');
    });

    test('getGraphicsStmt() should parse screen capture into array', () => {
        // 1. Standard absolute capture
        const getStandard = getGraphicsStmt.run('GET (10, 10)-(20, 20), GorR&');
        assertEqual(getStandard.isError, false);
        assertEqual(getStandard.result.type, 'GET_GRAPHICS');
        assertEqual(getStandard.result.startIsStep, false);
        assertEqual(getStandard.result.startX.value, 10);
        assertEqual(getStandard.result.endY.value, 20);
        assertEqual(getStandard.result.target.value, 'GORR&');

        // 2. Capture with STEP on both coordinates
        const getStep = getGraphicsStmt.run('GET STEP (0, 0)-STEP (15, 15), Buffer');
        assertEqual(getStep.isError, false);
        assertEqual(getStep.result.startIsStep, true);
        assertEqual(getStep.result.endIsStep, true);
        assertEqual(getStep.result.target.value, 'BUFFER');

        // 3. Gorillas exact complex line (nested expressions)
        const getGorilla = getGraphicsStmt.run('GET (x - Scl(15), y - Scl(1))-(x + Scl(14), y + Scl(28)), GorR&');
        assertEqual(getGorilla.isError, false);
        // Checking if the startX parsed the Binary Operator "x - Scl(15)" properly
        assertEqual(getGorilla.result.startX.type, 'BINARY_OP');
        assertEqual(getGorilla.result.startX.operator, '-');
    });

    test('lineInputStmt() should parse LINE INPUT correctly without confusing it with drawing', () => {
        const lineInp1 = lineInputStmt.run('LINE INPUT "Name of Player 1: "; Player1$');
        assertEqual(lineInp1.isError, false);
        assertEqual(lineInp1.result.type, 'LINE_INPUT');
        assertEqual(lineInp1.result.prompt, 'Name of Player 1: ');
        assertEqual(lineInp1.result.target.value, 'PLAYER1$');

        // Without prompt
        const lineInp2 = lineInputStmt.run('LINE INPUT buffer$');
        assertEqual(lineInp2.isError, false);
        assertEqual(lineInp2.result.type, 'LINE_INPUT');
        assertEqual(lineInp2.result.prompt, '');
        assertEqual(lineInp2.result.target.value, 'BUFFER$');
    });

    test('screenStmt() should parse SCREEN with missing arguments (ghost commas)', () => {
        // 1. Standard full declaration
        const scr1 = screenStmt.run('SCREEN 7, 0, 1, 0');
        assertEqual(scr1.isError, false);
        assertEqual(scr1.result.type, 'SCREEN_STMT');
        assertEqual(scr1.result.mode.value, 7);
        assertEqual(scr1.result.colorSwitch.value, 0);
        assertEqual(scr1.result.activePage.value, 1);
        assertEqual(scr1.result.visualPage.value, 0);

        // 2. The infamous Torus.bas ghost comma
        const scr2 = screenStmt.run('SCREEN 8, , 1');
        assertEqual(scr2.isError, false);
        assertEqual(scr2.result.mode.value, 8);
        assertEqual(scr2.result.colorSwitch, null); // Ghost comma swallowed!
        assertEqual(scr2.result.activePage.value, 1);
        assertEqual(scr2.result.visualPage, null);

        // 3. Just the mode
        const scr3 = screenStmt.run('SCREEN 13');
        assertEqual(scr3.isError, false);
        assertEqual(scr3.result.mode.value, 13);
        assertEqual(scr3.result.colorSwitch, null);
    });

    test('clsStmt() should parse CLS with or without arguments', () => {
        const cls1 = clsStmt.run('CLS');
        assertEqual(cls1.isError, false);
        assertEqual(cls1.result.type, 'CLS');
        assertEqual(cls1.result.method, null);

        const cls2 = clsStmt.run('CLS 2');
        assertEqual(cls2.isError, false);
        assertEqual(cls2.result.method.value, 2);
    });

    test('viewPrintStmt() should parse text viewports', () => {
        const view1 = viewPrintStmt.run('VIEW PRINT 9 TO 24');
        assertEqual(view1.isError, false);
        assertEqual(view1.result.type, 'VIEW_PRINT');
        assertEqual(view1.result.top.value, 9);
        assertEqual(view1.result.bottom.value, 24);

        const viewReset = viewPrintStmt.run('VIEW PRINT');
        assertEqual(viewReset.isError, false);
        assertEqual(viewReset.result.top, null);
    });

    test('playStmt() should parse PLAY with string literals or variables', () => {
        const play1 = playStmt.run('PLAY "t120o1l16b"');
        assertEqual(play1.isError, false);
        assertEqual(play1.result.type, 'PLAY');
        assertEqual(play1.result.music.value, 't120o1l16b');

        const play2 = playStmt.run('PLAY musicMacro$');
        assertEqual(play2.isError, false);
        assertEqual(play2.result.music.value, 'MUSICMACRO$');
    });

    test('exitStmt() should parse EXIT commands for loops and routines', () => {
        const ex1 = exitStmt.run('EXIT FOR');
        assertEqual(ex1.isError, false);
        assertEqual(ex1.result.type, 'EXIT');
        assertEqual(ex1.result.target, 'FOR');

        const ex2 = exitStmt.run('EXIT SUB');
        assertEqual(ex2.isError, false);
        assertEqual(ex2.result.target, 'SUB');
    });

    test('swapStmt() should parse SWAP with variables and arrays', () => {
        const swap1 = swapStmt.run('SWAP a, b');
        assertEqual(swap1.isError, false);
        assertEqual(swap1.result.type, 'SWAP');
        assertEqual(swap1.result.target1.value, 'A');
        assertEqual(swap1.result.target2.value, 'B');

        const swap2 = swapStmt.run('SWAP SortArray(I), SortArray(J)');
        assertEqual(swap2.isError, false);
        assertEqual(swap2.result.target1.type, 'CALL'); // Array access is mapped as a CALL node
        assertEqual(swap2.result.target2.type, 'CALL');
    });

    test('eraseStmt() should parse ERASE with one or multiple arrays', () => {
        const ast = eraseStmt.run('ERASE Board, PlayerScores').result;
        assertEqual(ast.type, 'ERASE');
        assertEqual(ast.targets.length, 2);
        assertEqual(ast.targets[0], 'BOARD');
        assertEqual(ast.targets[1], 'PLAYERSCORES');
    });

    test('soundStmt() should parse SOUND with frequency and duration', () => {
        const sound = soundStmt.run('SOUND 60 * CurrentRow, Pause');
        assertEqual(sound.isError, false);
        assertEqual(sound.result.type, 'SOUND');
        assertEqual(sound.result.freq.type, 'BINARY_OP');
        assertEqual(sound.result.duration.type, 'IDENTIFIER');
    });
});