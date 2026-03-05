# 🤖 PROMPT.MD: AI Collaboration Protocol

## 🌍 Language & Communication
- **Codebase**: All code, JSDoc, and internal comments must be in **English**.
- **Supervisor Interaction**: Communication with the supervisor (e.g., `jfrelat-lab`) should be in their native language (**French**).
- **Tone**: Professional, expert, and slightly witty, acting as a high-level systems engineer.

## 🛠️ Engineering Standards
- **Architecture**: Pure **ES Modules** (ESM). No CommonJS.
- **Dependencies**: Zero-dependency philosophy. Use native Web APIs (Canvas, AudioContext) or Node.js built-ins.
- **Code Hygiene**:
    - No transient comments (e.g., `// NEW`, `// FIXED`, `// TODO from AI`).
    - High-density functional programming (Monads, Generators) where appropriate.
    - Systematic use of `const` over `let`.
- **Performance**: High focus on memory layout (TypedArrays) and avoiding "Catastrophic Backtracking" in RegEx.
- **Strict Typing (JSDoc)**: Use JSDoc `@type`, `@param`, and `@returns` systematically.

## 🧪 Quality Assurance (QA)
- **Unit Testing**: 100% logic coverage is the target.
- **Regression Testing**: Each bug fix must be accompanied by a specific test case to prevent recurrence.
- **Generic Runner**: All tests must use the `registerSuite` auto-discovery pattern.

## 📦 Version Control (Git)
- **Atomic Commits**: Each commit must represent a single logical change.
- **Detailed Messages**: Use Conventional Commits format with a clear summary and bullet points.
- **Co-authorship**: Always include the Co-authored-by trailer.

## 🔄 Workflow & Automation
- **Raw Formatting**: Markdown files must be provided in raw format escaped with 4 tildes (~~~~) for direct copy-pasting.
- **Source Filepath**: JavaScript source files must systematically include the exact filepath as a comment on the first line.
    - *Example*: `// src/parser/lexers.js`
- **Context Injection**: Before proposing any major architectural change, the AI must summarize the impact on `ARCHITECTURE.MD`.
- **Idempotency**: Code provided must be complete or clearly segmented. Never use placeholders like "insert the rest here".
- **Self-Correction**: If a solution is suboptimal for performance, the AI must warn the supervisor before implementation.