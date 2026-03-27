// src/runtime/qbasic/qbasic_test_utils.js
import { QBasicEvaluator } from './qbasic_evaluator.js';
import { QBasicEnvironment as Environment } from './qbasic_environment.js';
import { block } from '../../parser/qbasic/controlFlow.js';

/**
 * Universal test orchestrator for the QBasic Virtual Machine.
 * Parses the code, bootstraps the 3-Tier architecture, injects hardware mocks, 
 * and synchronously drives the generator to completion.
 * @param {string} sourceCode - The QBasic code to execute.
 * @param {Object} config - Optional overrides { env, hardware }.
 * @returns {{ env: Environment, hw: Object, cpu: Evaluator }} The final VM state.
 */
export function executeQBasic(sourceCode, config = {}) {
    const env = config.env || null;
    const hw = config.hardware || { vga: null, io: null, memory: null };    
    
    const parseState = block.run(sourceCode);
    if (parseState.isError) {
        throw new Error("Parse Error in test: " + parseState.error);
    }
    
    const cpu = new QBasicEvaluator(env, hw);
    const process = cpu.evaluate(parseState.result);
    
    // Synchronous generator drain (runSync built-in)
    let state = process.next();
    while (!state.done) {
        state = process.next();
    }
    
    return { env: cpu.env, hw, cpu };
}