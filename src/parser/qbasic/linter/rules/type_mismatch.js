// src/parser/qbasic/linter/rules/type_mismatch.js

/**
 * Rule: Prevents basic static type mismatches during assignment.
 * Catches explicit literal errors like A% = "Hello" or A$ = 10.
 */
export const typeMismatchRule = {
    ASSIGN: (node, state) => {
        let root = node.target;
        while (root.type === 'MEMBER_ACCESS' || root.type === 'CALL') root = root.object || root.callee;
        
        let targetName = "";
        if (root.type === 'IDENTIFIER') targetName = root.value.toUpperCase();
        if (root.type === 'ENV') targetName = root.name.toUpperCase();

        if (!targetName) return;

        const isStringTarget = targetName.endsWith('$');
        const isNumericTarget = targetName.endsWith('%') || targetName.endsWith('&') || targetName.endsWith('!') || targetName.endsWith('#');
        
        // Extremely basic static check (only catches explicit literal assignments to prevent false positives)
        if (isStringTarget && node.value.type === 'NUMBER') {
            state.errors.push(`Linter Error: Type mismatch. Cannot assign a NUMBER to STRING variable '${targetName}'`);
        } else if (isNumericTarget && node.value.type === 'STRING') {
            state.errors.push(`Linter Error: Type mismatch. Cannot assign a STRING to NUMERIC variable '${targetName}'`);
        }
    }
};