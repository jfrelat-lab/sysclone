// src/parser/qbasic/linter/rules/no_native_assignment.js
import { BuiltInTokens } from '../../tokens.js';

const builtIns = new Set(Object.values(BuiltInTokens));

/**
 * Rule: Prevents assigning values to QBasic native functions or keywords.
 * Example caught: LEN = 5, or FOR ABS = 1 TO 10
 */
export const noNativeAssignmentRule = {
    ASSIGN: (node, state) => {
        let root = node.target;
        // Drill down through member access or array calls to find the base identifier
        while (root.type === 'MEMBER_ACCESS' || root.type === 'CALL') {
            root = root.object || root.callee;
        }
        
        let targetName = null;
        if (root.type === 'IDENTIFIER') targetName = root.value;
        if (root.type === 'ENV') targetName = root.name;

        if (targetName && builtIns.has(targetName.toUpperCase())) {
            state.errors.push(`Linter Error: Cannot assign value to native function or built-in '${targetName.toUpperCase()}'`);
        }
    },
    
    FOR: (node, state) => {
        const targetName = node.variable;
        if (targetName && builtIns.has(targetName.toUpperCase())) {
            state.errors.push(`Linter Error: Cannot use native function or built-in '${targetName.toUpperCase()}' as a FOR loop iterator`);
        }
    }
};