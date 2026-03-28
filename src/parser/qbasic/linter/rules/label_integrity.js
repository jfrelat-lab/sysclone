// src/parser/qbasic/linter/rules/label_integrity.js

/**
 * Rule: Ensures no duplicate labels exist, and that all GOTO/GOSUB targets are valid.
 */
export const labelIntegrityRule = {
    LABEL: (node, state) => {
        const upperName = node.name.toUpperCase();
        if (state.definedLabels.has(upperName)) {
            state.errors.push(`Linter Error: Duplicate label definition '${upperName}'`);
        } else {
            state.definedLabels.add(upperName);
        }
    },

    GOTO:    (node, state) => { if (node.label) state.usedLabels.push({ name: node.label.toUpperCase(), type: node.type }); },
    GOSUB:   (node, state) => { if (node.label) state.usedLabels.push({ name: node.label.toUpperCase(), type: node.type }); },
    RESTORE: (node, state) => { if (node.label) state.usedLabels.push({ name: node.label.toUpperCase(), type: node.type }); },
    
    ON_ERROR: (node, state) => {
        // Ignore "ON ERROR GOTO 0" (numeric hardware reset)
        if (typeof node.target === 'string') {
            state.usedLabels.push({ name: node.target.toUpperCase(), type: 'ON ERROR GOTO' });
        }
    },
    
    RESUME: (node, state) => {
        // Ignore simple "RESUME" and "RESUME NEXT"
        if (node.target && node.target !== 'NEXT') {
            state.usedLabels.push({ name: node.target.toUpperCase(), type: 'RESUME' });
        }
    },

    /**
     * Post-traversal validation hook.
     * Evaluated after the entire AST has been scanned.
     */
    finalize: (state) => {
        for (const usage of state.usedLabels) {
            if (!state.definedLabels.has(usage.name)) {
                state.errors.push(`Linter Error: Label not found '${usage.name}' (Targeted by ${usage.type})`);
            }
        }
    }
};