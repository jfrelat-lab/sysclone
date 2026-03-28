// src/parser/qbasic/linter/rules/duplicate_sub.js

function checkRoutine(node, state) {
    state.definedRoutines = state.definedRoutines || new Set();
    const upperName = node.name.toUpperCase();
    if (state.definedRoutines.has(upperName)) {
        state.errors.push(`Linter Error: Duplicate SUB/FUNCTION definition '${upperName}'`);
    } else {
        state.definedRoutines.add(upperName);
    }
}

/**
 * Rule: Prevents the redefinition of Subroutines, Functions, or Macro-Functions.
 */
export const duplicateRoutineRule = {
    SUB_DEF: checkRoutine,
    FUNCTION_DEF: checkRoutine,
    DEF_FN: checkRoutine
};