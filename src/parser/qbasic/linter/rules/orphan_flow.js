// src/parser/qbasic/linter/rules/orphan_flow.js

/**
 * Rule: Prevents control flow statements (like EXIT FOR) from existing outside their valid blocks.
 * Leverages the Traverser's `_exit` hook to maintain context stacks.
 */
export const orphanFlowRule = {
    // State initialization helper
    _init: (state) => {
        state.loopStack = state.loopStack || [];
        state.routineStack = state.routineStack || [];
    },

    // Block Entry
    FOR: (node, state) => { orphanFlowRule._init(state); state.loopStack.push('FOR'); },
    DO_PRE_COND: (node, state) => { orphanFlowRule._init(state); state.loopStack.push('DO'); },
    DO_POST_COND: (node, state) => { orphanFlowRule._init(state); state.loopStack.push('DO'); },
    SUB_DEF: (node, state) => { orphanFlowRule._init(state); state.routineStack.push('SUB'); },
    FUNCTION_DEF: (node, state) => { orphanFlowRule._init(state); state.routineStack.push('FUNCTION'); },

    // Block Exit
    FOR_exit: (node, state) => state.loopStack.pop(),
    DO_PRE_COND_exit: (node, state) => state.loopStack.pop(),
    DO_POST_COND_exit: (node, state) => state.loopStack.pop(),
    SUB_DEF_exit: (node, state) => state.routineStack.pop(),
    FUNCTION_DEF_exit: (node, state) => state.routineStack.pop(),

    // The Checker
    EXIT: (node, state) => {
        orphanFlowRule._init(state);
        const target = node.target.toUpperCase();
        
        if (target === 'FOR' && !state.loopStack.includes('FOR')) {
            state.errors.push(`Linter Error: EXIT FOR outside of a FOR loop`);
        }
        if (target === 'DO' && !state.loopStack.includes('DO')) {
            state.errors.push(`Linter Error: EXIT DO outside of a DO loop`);
        }
        if (target === 'SUB' && !state.routineStack.includes('SUB')) {
            state.errors.push(`Linter Error: EXIT SUB outside of a SUB`);
        }
        if (target === 'FUNCTION' && !state.routineStack.includes('FUNCTION')) {
            state.errors.push(`Linter Error: EXIT FUNCTION outside of a FUNCTION`);
        }
    }
};