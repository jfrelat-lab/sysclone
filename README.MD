# Sysclone 🚀

A purist, dependency-free Universal Interpreter and Just-In-Time (JIT) compiler built entirely in JavaScript, designed to run directly in the browser. 

The ultimate goal of this project is to execute historical and modern programming languages—starting with MS-DOS / QBasic—with absolute fidelity, without modifying the original source code, and without freezing the browser's main thread.

![Status](https://img.shields.io/badge/Status-Milestone%201%20Completed-success)
![Language](https://img.shields.io/badge/Language-JavaScript%20(ES6)-yellow)
![Dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen)

## 📖 Documentation

To keep this repository organized, our documentation is split into dedicated files. Please explore them to understand the project's vision, inner workings, and future:

* 🎯 **[The Goal & Vision (GOAL.MD)](./GOAL.MD)**: Why this project exists and what it aims to achieve.
* 🏗️ **[Engine Architecture (ARCHITECTURE.MD)](./ARCHITECTURE.MD)**: Deep dive into the Monadic Parsers, Virtual CPU, and Hardware Abstraction Layer.
* 🗺️ **[Project Roadmap (ROADMAP.MD)](./ROADMAP.MD)**: Current progress (Milestone 1 complete!) and what's coming next (JIT, Audio, New Languages).

## 🤖 Built with AI Collaboration (Agentic Workflow)

This project is developed using a rigorous **Agentic Workflow**, where multiple AI models act as specialized engineering departments. This ensures that even though the code is AI-generated, it follows strict architectural constraints and historical accuracy.

### The Methodology

1. **Full Context Reprompting**: Every major development cycle begins with a full-context synchronization using a custom reprompting tool. This tool aggregates the entire codebase and all specification files into a single context stream.
2. **Document-Driven Development (DDD)**: All specifications are formalized in Markdown files (`GOAL.MD`, `ARCHITECTURE.MD`, `ROADMAP.MD`) before any code is written. These act as the "Source of Truth" for the agents.
3. **Cross-Model Reviews**: We utilize a "multi-agent" approach for validation. Architecture designed by one model is audited by another to identify potential edge cases or compatibility issues with MS-DOS legacy behaviors.
4. **Agentic Audits**: Dedicated `code-reviews/` files are generated to document technical debt, performance bottlenecks, and compatibility gaps, ensuring a continuous improvement loop.
5. **Quality Harness & CI/CD Ready**: 
    * **Unit Testing**: A custom test runner (`test_runner.js`) is used to validate every engine component (Parsers, Evaluator, Memory) against expected QBasic behaviors.
    * **Version Control (Git)**: Strict use of semantic commits and co-authoring metadata to track the evolution of the AI-human collaboration.
    * **Static Analysis (Planned)**: Integration of strict linting rules to ensure consistency across all AI-generated modules.

### AI Stack & Model Roles

* **Lead Architect & Auditor**: **Gemini 3.1 Pro**. Used for high-level reasoning, complex debugging, cross-module compatibility audits, and architectural planning.
* **Software Engineer**: **Gemini 3.0 Flash**. Used for rapid code generation, unit test writing, and technical documentation updates based on the lead architect's specifications.
* **Legacy Expert**: **Gemini 3.1 Pro**. Specifically tasked with validating the behavior of the Virtual CPU against documented 1990s QBasic and x86 Real Mode behaviors.

Special thanks to the **Gemini** family of models for acting as a tireless co-author and compiler expert.

## 🛠️ Quick Start (Run Locally)

Since this project has **zero external dependencies**, running it is incredibly simple:

1. Clone the repository:
   ```bash
   git clone https://github.com/jfrelat-lab/sysclone.git
   cd sysclone
   ```

2. Start the local dev server (default port 3000):
   ```bash
   npm start
   # or simply run: node server.js
   ```

3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

To run the custom test suite:
```bash
npm test
```