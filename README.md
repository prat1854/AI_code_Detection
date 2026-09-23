# CodeGuard AI 🛡️

CodeGuard AI is a code analysis platform that detects **syntax errors, security vulnerabilities, code quality issues, and performance problems** across multiple programming languages.

It combines traditional static analysis with AI to explain issues and suggest possible fixes.

## Features

* Static code analysis using parsers and AST rules
* Supports **JavaScript, TypeScript, Python, Java, C++ and Go**
* Detects common security issues like SQL Injection, XSS, Command Injection and weak hashing
* Monaco Editor with error/warning markers
* AI-powered explanations and fix suggestions
* Side-by-side diff for reviewing suggested fixes
* Analysis history and dashboard
* HTML and JSON report export
* Docker and Kubernetes support
* PostgreSQL and Redis integration

## Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* Material UI
* Monaco Editor
* Recharts

**Backend**

* Node.js
* Express.js
* PostgreSQL
* Redis
* JWT

**AI Service**

* Python
* FastAPI
* Gemini
* OpenAI
* Anthropic
* Offline heuristic provider

**DevOps**

* Docker
* Docker Compose
* Nginx
* Kubernetes
* GitHub Actions

## Architecture

```text
React Frontend
      |
      v
Node.js / Express API
      |
      +---------> Static Analysis Engine
      |
      +---------> AI Service (FastAPI)
      |
      v
PostgreSQL + Redis
```

## Run Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

### AI Service

```bash
cd ai-service
uv venv
uv pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Docker

```bash
cp .env.example .env
docker compose up -d --build
```

## Testing

Backend:

```bash
cd backend
npm test
```

AI service:

```bash
cd ai-service
pytest tests
```

## Project Structure

```text
codeguard-ai/
├── frontend/
├── backend/
├── ai-service/
├── k8s/
├── docs/
├── docker-compose.yml
└── .env.example
```

## Author

**Prateek Bajpai**

Full Stack Developer

Built with React, Node.js, Python, PostgreSQL, Docker and AI.

---

**CodeGuard AI — Detect issues. Understand the problem. Fix the code.**
