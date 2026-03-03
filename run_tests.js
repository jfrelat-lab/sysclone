// run_tests.js
import { runMonadTests } from './src/parser/monad.test.js';
import { runLexerTests } from './src/parser/lexers.test.js';
import { runDeclarationsTests } from './src/parser/declarations.test.js';
import { runControlFlowTests } from './src/parser/controlFlow.test.js';
import { runSubroutinesTests } from './src/parser/subroutines.test.js';
import { runExpressionsTests } from './src/parser/expressions.test.js';
import { runStatementsTests } from './src/parser/statements.test.js';
import { runEnvironmentTests } from './src/runtime/environment.test.js';
import { runEvaluatorTests } from './src/runtime/evaluator.test.js';

console.log("🚀 Launching tests in Terminal (Node.js)...");
runMonadTests();
runLexerTests();
runDeclarationsTests();
runControlFlowTests();
runSubroutinesTests();
runExpressionsTests();
runStatementsTests();
runEnvironmentTests();
runEvaluatorTests();