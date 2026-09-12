# CodeGuard AI — Architecture & System Design

CodeGuard AI is an enterprise-grade AI Code Detection & Analysis Platform built on a decoupled, microservice architecture. It enforces strict separation between **deterministic analysis** (compilers, parsers, and static security analyzers) and **AI analysis** (explanations, risk modeling, and fix generation).

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|                                                                                   |
|    React 18 + Vite + TypeScript + Material UI + Monaco Editor + Recharts          |
|    (Single Page Application with Dark/Light Theme & Synchronized Diff Viewer)     |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / REST
                                           v
+------------------------------------------+----------------------------------------+
|                            REVERSE PROXY & GATEWAY                                |
|                                                                                   |
|         Nginx Reverse Proxy (SSL Termination, Rate Limiting, Static Assets)       |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                             BACKEND ORCHESTRATOR                                  |
|                                                                                   |
|   Node.js & Express.js REST API                                                   |
|   • Authentication & Authorization (JWT + bcryptjs)                               |
|   • Request Validation & Rate Limiting (Helmet, Express-Rate-Limit)               |
|   • Orchestration Engine (Coordinates Parsers, Scanners & AI Service)            |
|   • Report Generation (JSON, Standalone Styled HTML, Print/PDF)                   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                  DETERMINISTIC ANALYSIS ENGINE                            |   |
|   |                                                                           |   |
|   |   • JavaScript Analyzer (@babel/parser AST + Security Rule Visitors)      |   |
|   |   • TypeScript Analyzer (TypeScript Compiler API ts.createSourceFile)     |   |
|   |   • Python Analyzer (Python AST Compiler Syntax Check + Security Scanner) |   |
|   |   • Java Analyzer (Grammar Validator + JDBC/Runtime.exec OWASP Rules)     |   |
|   |   • C++ Analyzer (Syntax Checker + CWE-120/134 Memory Safety Scanner)     |   |
|   |   • Go Analyzer (Compiler Validator + fmt.Sprintf SQLi/Command Injection) |   |
|   |   • Metrics Engine (Cyclomatic Complexity, Nesting, Maintainability, LOC) |   |
|   +---------------------------------------------------------------------------+   |
+---------------------+---------------------------------------+---------------------+
                      |                                       |
        Internal HTTP |                                       | SQL / TCP
                      v                                       v
+-----------------------------------+   +-------------------------------------------+
|         AI MICROSERVICE           |   |              DATA STORAGE                 |
|                                   |   |                                           |
|   FastAPI + Python 3.11           |   |   • PostgreSQL 16 (Relational DB)         |
|   Modular Provider Interface:     |   |     Users, Analyses, Issues, Fixes        |
|   • Google Gemini Provider        |   |                                           |
|   • OpenAI Provider               |   |   • Redis 7 (Caching & Job State)         |
|   • Anthropic Claude Provider     |   |                                           |
|   • Offline Heuristic Engine      |   |   • SQLite Fallback (Zero-friction local) |
+-----------------------------------+   +-------------------------------------------+
```

---

## 2. Deterministic vs. AI Separation Principle

A core architectural invariant of CodeGuard AI is:
> **The AI model alone NEVER determines whether code is valid or invalid.**

### The Hierarchy of Truth
1. **Compiler / Parser Layer**:
   - Checks lexical tokens, grammar, brackets, and syntax validity.
   - If any compiler or parser exception occurs, status is immediately marked `invalid`.
2. **Deterministic Static Analyzers**:
   - Walks the Abstract Syntax Tree (AST) to identify CWEs, injection points, memory leaks, and unused variables.
   - Every finding is tagged with line, column, rule ID, and detector source (e.g. `deterministic-ast`, `typescript-compiler`, `python-ast`).
3. **Metrics Calculator**:
   - Computes cyclomatic complexity, nesting depth, and Halstead maintainability mathematically.
4. **AI Review Layer**:
   - Enriches findings with human explanations:
     - *What is wrong?*
     - *Why does it matter?*
     - *What could happen if exploited?*
     - *Suggested remediation code diff.*
   - Generates contextual before/after patches for user review and approval.

---

## 3. Data Flow

```text
User Submits Code
       │
       ▼
[Backend API] /api/analysis
       │
       ├─► [Language Normalization & Size Guard] (Max 512 KB)
       │
       ├─► [Deterministic Analysis Engine]
       │     ├─ Syntax Check ──► Sets isValid (true/false)
       │     ├─ AST Security Scanning ──► Detects SQLi, XSS, CmdI, etc.
       │     └─ Metric Calculation ──► Overall, Security, Quality Scores
       │
       ├─► [Database Persistence]
       │     └─ Stores analysis, issues, and severity breakdown
       │
       ▼
[Unified Result] returned to Frontend Monaco Editor & Dashboard
       │
       ├─► User clicks issue ──► Monaco jumps to exact line & column
       │
       ├─► User clicks "Generate Fix"
       │     └─► Backend calls AI Microservice (Gemini/OpenAI/Claude/Heuristic)
       │     └─► AI produces fixedCode & diffSummary
       │     └─► Monaco DiffViewer renders side-by-side comparison
       │
       └─► User clicks "Accept Fix"
             └─► Editor updates with fixed code
             └─► Automatic re-analysis verifies that issues have been resolved
```
