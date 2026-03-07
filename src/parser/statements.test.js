// src/parser/statements.test.js
import { statement } from './statements.js';
import { test, assertEqual, registerSuite } from '../test_runner.js';

/**
 * Unit tests for QBasic Statements.
 * Ensures that all imperative commands are correctly transformed into AST nodes.
 */
registerSuite('QBasic Instructions (Statements)', () => {

    test('Should parse implicit calls (without CALL keyword or parentheses)', () => {
        // Example: Set 25, i, colorTable(3)
        const ast = statement.run('Set 25, i, colorTable(3)').result;
        assertEqual(ast.type, 'CALL');
        assertEqual(ast.callee.value, 'SET');
        assertEqual(ast.args.length, 3);
        assertEqual(ast.args[0].value, 25);
        assertEqual(ast.args[1].value, 'I');
        assertEqual(ast.args[2].type, 'CALL'); // colorTable(3) is correctly identified as a nested call!
    });

    test('Should parse INPUT with or without prompt text', () => {
        const input1 = statement.run('INPUT "Name"; player$');
        assertEqual(input1.result.type, 'INPUT');
        assertEqual(input1.result.prompt, 'Name');
        assertEqual(input1.result.targets[0].value, 'PLAYER$');

        const input2 = statement.run('INPUT gamespeed$');
        assertEqual(input2.result.type, 'INPUT');
        assertEqual(input2.result.prompt, ''); // Empty prompt
        assertEqual(input2.result.targets[0].value, 'GAMESPEED$');
    });

    test('Should parse LOCATE with one or two arguments', () => {
        const loc1 = statement.run('LOCATE 10');
        assertEqual(loc1.result.type, 'LOCATE');
        assertEqual(loc1.result.row.value, 10);
        assertEqual(loc1.result.col, null);

        const loc2 = statement.run('LOCATE 5, 20');
        assertEqual(loc2.result.row.value, 5);
        assertEqual(loc2.result.col.value, 20);
    });

    test('Should parse COLOR with foreground, background, or missing arguments', () => {
        const col = statement.run('COLOR 15, 0');
        assertEqual(col.result.type, 'COLOR');
        assertEqual(col.result.fg.value, 15);
        assertEqual(col.result.bg.value, 0);

        // Critical case: background only (common in legacy code)
        const colBgOnly = statement.run('COLOR , 4');
        assertEqual(colBgOnly.result.type, 'COLOR');
        assertEqual(colBgOnly.result.fg, null); // Foreground remains unchanged
        assertEqual(colBgOnly.result.bg.value, 4);
    });

    test('Should parse POKE (with mandatory comma and hex support)', () => {
        // Hexadecimal support check (&H41A = 1050)
        const poke = statement.run('POKE &H41A, 30');
        assertEqual(poke.result.type, 'POKE');
        assertEqual(poke.result.address.value, 1050); 
        assertEqual(poke.result.value.value, 30);
    });

    test('Should parse variable assignments', () => {
        const assign = statement.run('score = lives * 10');
        assertEqual(assign.result.type, 'ASSIGN');
        assertEqual(assign.result.target.type, 'IDENTIFIER');
        assertEqual(assign.result.target.value, 'SCORE');
        assertEqual(assign.result.value.type, 'BINARY_OP'); 
    });

    test('Should parse GOTO, GOSUB, RETURN, and Labels', () => {
        const label = statement.run('DrawApple:');
        assertEqual(label.result.type, 'LABEL');
        assertEqual(label.result.name, 'DRAWAPPLE');

        const gt = statement.run('GOTO MainLoop');
        assertEqual(gt.result.type, 'GOTO');
        assertEqual(gt.result.label, 'MAINLOOP');

        const gs = statement.run('GOSUB PlayBuzzer');
        assertEqual(gs.result.type, 'GOSUB');
        assertEqual(gs.result.label, 'PLAYBUZZER');

        const ret = statement.run('RETURN');
        assertEqual(ret.result.type, 'RETURN');
    });

    test('Should parse PRINT and PRINT USING', () => {
        const print1 = statement.run('PRINT "Hello"');
        assertEqual(print1.result.type, 'PRINT');
        assertEqual(print1.result.usingFormat, null);

        const print2 = statement.run('PRINT USING "#,###"; score');
        assertEqual(print2.result.type, 'PRINT');
        assertEqual(print2.result.usingFormat.value, "#,###");
        assertEqual(print2.result.values[0].value, 'SCORE');
    });

    test('Should parse DATA, READ, and RESTORE', () => {
        const data = statement.run('DATA 15, "Color", 0');
        assertEqual(data.result.type, 'DATA');
        assertEqual(data.result.values.length, 3);

        const rest1 = statement.run('RESTORE');
        assertEqual(rest1.result.type, 'RESTORE');
        assertEqual(rest1.result.label, null);

        const rest2 = statement.run('RESTORE InitColors');
        assertEqual(rest2.result.type, 'RESTORE');
        assertEqual(rest2.result.label, 'INITCOLORS');
    });

    test('Should parse WINDOW statements with math coordinates', () => {
        // Mandelbrot coordinate mapping
        const win = statement.run('WINDOW (-2, 1.5)-(2, -1.5)');
        
        assertEqual(win.result.type, 'WINDOW');
        assertEqual(win.result.invertY, false);
        
        // Ensure negative numbers are parsed properly (Unary Operations)
        assertEqual(win.result.x1.type, 'UNARY_OP');
        assertEqual(win.result.x1.argument.value, 2);
        assertEqual(win.result.y1.value, 1.5);
        
        assertEqual(win.result.x2.value, 2);
        assertEqual(win.result.y2.type, 'UNARY_OP');
        assertEqual(win.result.y2.argument.value, 1.5);

        // QBasic allows WINDOW SCREEN to invert axis
        const winScreen = statement.run('WINDOW SCREEN (0, 0)-(320, 200)');
        assertEqual(winScreen.result.invertY, true);
        assertEqual(winScreen.result.x2.value, 320);
    });

    test('Should parse PSET pixel drawing statements', () => {
        const pset = statement.run('PSET (x, y), c');
        
        assertEqual(pset.result.type, 'PSET');
        assertEqual(pset.result.isStep, false);
        assertEqual(pset.result.x.value, 'X');
        assertEqual(pset.result.y.value, 'Y');
        assertEqual(pset.result.color.value, 'C');

        // Without color parameter (uses default)
        const psetNoColor = statement.run('PSET (10, 20)');
        assertEqual(psetNoColor.result.color, null);
    });

    test('Should parse Gorillas Geometry (LINE, CIRCLE, PAINT) with optional args', () => {
        // 1. LINE with missing color and BF flag
        const line = statement.run('LINE (10, 10)-(20, 20), , BF');
        assertEqual(line.result.type, 'LINE');
        assertEqual(line.result.startX.value, 10);
        assertEqual(line.result.color, null); // Color was omitted
        assertEqual(line.result.box, 'BF');   // Box fill correctly identified

        // 2. CIRCLE with step and radians (Sun Smile)
        const circle = statement.run('CIRCLE STEP (x, y), 8, 0, 3.14, 6.28');
        assertEqual(circle.result.type, 'CIRCLE');
        assertEqual(circle.result.isStep, true);
        assertEqual(circle.result.radius.value, 8);
        assertEqual(circle.result.color.value, 0);
        assertEqual(circle.result.start.value, 3.14);

        // 3. PAINT
        const paint = statement.run('PAINT (x, y), SUNATTR');
        assertEqual(paint.result.type, 'PAINT');
        assertEqual(paint.result.paintColor.value, 'SUNATTR');
        assertEqual(paint.result.borderColor, null);
    });

});
