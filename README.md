# 🛡️ CodeGuard AI — AI Code Detection & Analysis Platform

> A production-style developer platform that combines **deterministic compiler/AST static analysis** with **modular AI remediation** to detect syntax errors, security vulnerabilities, code quality smells, and performance bottlenecks across 6 programming languages.

---

## 🌟 Platform Highlights

* **Multi-Language Deterministic Analysis**:
  * Comprehensive parser and static rule engines for **JavaScript**, **TypeScript**, **Python**, **Java**, **C++**, and **Go**.
  * 100% reproducible syntax validation and AST checking.
  * **Strict Distinction**: Compilers/parsers determine code validity; AI models never claim broken code is valid.
* **Professional Monaco Code Editor**:
  * Syntax highlighting, line numbers, error/warning markers, minimap, formatting, and live line jumping.
  * Clicking an issue automatically moves and highlights the cursor on the exact line.
* **Synchronized Diff Viewer**:
  * Side-by-side Monaco DiffEditor comparing original vulnerable code with AI-generated fixes.
  * 1-Click "Accept & Apply Fix" with automatic re-analysis.
* **OWASP Vulnerability Scanners**:
  * SQL Injection, Cross-Site Scripting (DOM XSS), Command Injection, Insecure Deserialization (`pickle`/`ObjectInputStream`), Banned Functions (`gets`/`strcpy`), Buffer Overflows, Hardcoded Credentials, and Weak Hashes (MD5/SHA-1).
* **Modular AI Microservice (Python + FastAPI)**:
  * Pluggable provider layer supporting **Google Gemini**, **OpenAI GPT-4o**, **Anthropic Claude**, and a **Built-in Offline Heuristic Provider**.
  * Detailed root-cause explanations: *What is wrong?*, *Why it matters*, *Potential risks*, and *Recommended fixes*.
* **Analytics & Historical Audits**:
  * Recharts dashboards visualizing pass/fail ratios, issues by severity, category breakdowns, and language usage.
  * Exportable reports in **HTML** (standalone styled & printable) and **JSON**.
* **Containerized & Kubernetes-Ready**:
  * Multi-stage Dockerfiles, production `docker-compose.yml`, health checks, resource limits, and full Kubernetes manifests (`k8s/`).

---

## 🏗️ Architecture Overview

```text
                        ┌────────────────────────────────────────┐
                        │        Frontend (React + Vite)         │
                        │   Monaco Editor, DiffViewer, Charts    │
                        │   MUI Dashboard, History, Reports      │
                        └───────────────────┬────────────────────┘
                                            │ HTTP / REST
                                            ▼
                        ┌────────────────────────────────────────┐
                        │       Backend API (Node.js/Express)    │
                        │   Auth, Rate-limiting, DB, Redis       │
                        │   Orchestration & Workflow Engine      │
                        └─────────┬──────────────────────┬───────┘
                                  │                      │
                   Internal IPC   │                      │ Internal HTTP
                                  ▼                      ▼
         ┌───────────────────────────────┐     ┌───────────────────────────────┐
         │  Deterministic Analysis Engine│     │     AI Service (FastAPI)      │
         │  • Syntax / Parser Validation │     │  • Modular Provider Architecture│
         │  • Static Linters & AST Rules │     │    (Gemini, OpenAI, Claude,   │
         │  • Security Scanners (SQLi/XSS│     │     Heuristic / Rule Engine)  │
         │  • Complexity & Code Quality  │     │  • Explanation, Why It Matters│
         │  [JS, TS, Python, Java, C++, Go]│   │  • Fix Generation & Review    │
         └───────────────────────────────┘     └───────────────────────────────┘
                                  │                      │
                                  ▼                      ▼
                        ┌────────────────────────────────────────┐
                        │     PostgreSQL (Data) & Redis (Cache)  │
                        │  Users, Analyses, Issues, Fixes, Reports│
                        └────────────────────────────────────────┘
```

---

## 💻 Tech Stack

* **Frontend**: React 18, Vite, TypeScript, Material UI (`@mui/material`), Monaco Editor (`@monaco-editor/react`), Recharts, Axios, React Router.
* **Backend**: Node.js 22, Express.js, Babel Parser (`@babel/parser`), TypeScript Compiler API (`typescript`), JWT, bcryptjs, PostgreSQL (`pg`), Redis (`ioredis`), Helmet.
* **AI Service**: Python 3.11, FastAPI, Uvicorn, Pydantic, HTTPX, pytest.
* **DevOps**: Docker, Docker Compose, Nginx, Kubernetes manifests (`k8s/`), GitHub Actions CI/CD.

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
* **Node.js** >= 18 (Node 22 recommended)
* **Python** >= 3.10 with `uv` or `pip`
* **Docker & Docker Compose** (Optional for containerized run)

### 2. Instant Local Run (Without Docker)

CodeGuard AI is architected with **dual-mode storage** (PostgreSQL in production, automatic embedded storage for zero-friction standalone local development).

#### Step A: Start the Backend API
```bash
cd backend
npm install
npm run dev
# Active on http://localhost:5000
```

#### Step B: Start the AI Service
```bash
cd ai-service
# Using uv (recommended) or standard venv:
uv venv
uv pip install fastapi "uvicorn[standard]" pydantic httpx python-dotenv pytest pytest-asyncio
uvicorn app.main:app --reload --port 8000
# Active on http://localhost:8000
```

#### Step C: Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
# Active on http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## 🐳 Running with Docker Compose

To start the complete multi-container stack (PostgreSQL, Redis, AI Service, Backend API, and Nginx Frontend):

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Launch all services
docker compose up -d --build

# 3. View running services
docker compose ps

# 4. Access the platform
# Open http://localhost in your browser
```

To stop all containers:
```bash
docker compose down
```

---

## 🧪 Testing Suite

### Run Backend Unit & Analysis Tests
```bash
cd backend
npm test
```
*Tests coverage includes JavaScript SQLi/XSS, syntax error invalidation, TypeScript type-safety diagnostics, Python security patterns, C++ buffer overflows, and Go SQLi/package validation.*

### Run AI Microservice Tests
```bash
cd ai-service
export PYTHONPATH=.
pytest tests
```

### Build Frontend Production Bundle
```bash
cd frontend
npm run build
```

---

## 🔑 Environment Configuration (`.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Backend Express server port |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `DATABASE_URL` | `postgresql://codeguard:codeguard_secret@localhost:5432/codeguard_db` | PostgreSQL connection URI |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URI |
| `AI_SERVICE_URL` | `http://localhost:8000` | URL of the Python AI microservice |
| `AI_PROVIDER` | `heuristic` | LLM Provider: `heuristic`, `gemini`, `openai`, `anthropic` |
| `GEMINI_API_KEY` | `""` | Google Gemini API Key |
| `OPENAI_API_KEY` | `""` | OpenAI API Key |
| `ANTHROPIC_API_KEY` | `""` | Anthropic Claude API Key |

---

## 📊 Curated Vulnerability Test Cases

CodeGuard includes built-in realistic code snippets for all 6 languages, selectable directly from the workspace dropdown:

1. **JavaScript**: SQL injection via string concatenation, DOM XSS via `innerHTML`, MD5 hashing, debugger statement, assignment in conditional.
2. **TypeScript**: Bypassing type safety via explicit `any`, `@ts-ignore` compiler suppression, non-null assertion on nullable objects.
3. **Python**: SQL injection in `sqlite3`, remote code execution via `pickle.loads()`, subshell injection in `os.system()`, weak MD5 hash.
4. **Java**: Classic JDBC `Statement.executeQuery()` SQL injection, subshell command injection via `Runtime.getRuntime().exec()`, swallowed exceptions.
5. **C++**: Stack buffer overflow via banned `gets()`, unbounded `strcpy()`, format string vulnerability in `printf()`, heap memory leak.
6. **Go**: SQL injection in `fmt.Sprintf()`, command injection in `exec.Command("sh", "-c", ...)`, unchecked discarded errors (`rows, _ :=`).

---

## ☸️ Kubernetes Deployment

Production Kubernetes manifests are located in `k8s/`:
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmaps-secrets.yaml
kubectl apply -f k8s/02-postgres.yaml
kubectl apply -f k8s/03-redis.yaml
kubectl apply -f k8s/04-ai-service.yaml
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml
kubectl apply -f k8s/08-hpa.yaml
```

---

## 🛡️ Security Model

See [`docs/SECURITY.md`](docs/SECURITY.md) for full execution sandboxing specifications, container isolation flags, and defense-in-depth principles.
#   A I _ c o d e _ D e t e c t i o n  
 