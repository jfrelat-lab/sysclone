// src/parser/ast_traverser.js

export const Traverser = {
    // Unique Symbol to signal the traverser to stop descending into a node's children
    SKIP: Symbol('SKIP_TRAVERSAL')
};

/**
 * Universal AST Traverser.
 * Operates at high speed without instantiating complex Path objects.
 * Supports both entry hooks and exit hooks for stateful static analysis.
 * * @param {Object|Array} node - The AST node to traverse.
 * @param {Object} visitor - A dictionary of functions keyed by node type.
 * @param {Object} state - An optional shared state object passed to visitor methods.
 */
export function traverse(node, visitor, state = {}) {
    if (!node) return;

    // Handle arrays of nodes (e.g., block arrays containing multiple statements)
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            traverse(node[i], visitor, state);
        }
        return;
    }

    // Handle standard AST node objects
    if (typeof node === 'object') {
        let skipChildren = false;

        // 1. ENTRY HOOK: Execute the visitor rule if it exists for this node type
        if (node.type && typeof visitor[node.type] === 'function') {
            const result = visitor[node.type](node, state);
            
            // Check if the visitor requested to halt the descent for this specific branch
            if (result === Traverser.SKIP) {
                skipChildren = true;
            }
        }

        // 2. RECURSION: Drill down into child properties unless explicitly told to SKIP
        if (!skipChildren) {
            for (let key in node) {
                // Only traverse complex objects (skip primitives like strings or numbers)
                if (node.hasOwnProperty(key) && typeof node[key] === 'object') {
                    traverse(node[key], visitor, state);
                }
            }
        }

        // 3. EXIT HOOK: Execute post-traversal logic after all children have been visited.
        // Vital for maintaining context stacks (e.g., popping 'FOR' out of a loop stack).
        if (node.type && typeof visitor[node.type + '_exit'] === 'function') {
            visitor[node.type + '_exit'](node, state);
        }
    }
}