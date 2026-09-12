# CodeGuard AI — REST API Documentation

Base URL: `/api`

All requests and responses use `application/json` unless specified otherwise.

---

## 1. Authentication Endpoints

### Register User
`POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Jane Developer",
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_7d9e4a8b1c2d3e4f",
    "email": "jane@example.com",
    "name": "Jane Developer",
    "role": "developer"
  }
}
```

### Login
`POST /api/auth/login`

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

### 1-Click Demo Login
`POST /api/auth/demo`

Instantly authenticates as the built-in demo engineer account without typing credentials.

---

## 2. Analysis Endpoints

### Run Code Analysis
`POST /api/analysis`

*Headers (Optional):* `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "code": "const query = 'SELECT * FROM users WHERE id = ' + req.query.id;\ndb.query(query);",
  "language": "javascript",
  "fileName": "app.js"
}
```

**Response (201 Created):**
```json
{
  "id": "anl_3f8a9b2c1d4e5f6a",
  "status": "valid",
  "isValid": true,
  "language": "javascript",
  "fileName": "app.js",
  "score": 39,
  "securityScore": 65,
  "qualityScore": 72,
  "complexityScore": 95,
  "metrics": {
    "linesOfCode": 2,
    "codeLines": 2,
    "blankLines": 0,
    "commentLines": 0,
    "cyclomaticComplexity": 1,
    "maxNestingDepth": 0,
    "maintainabilityIndex": 72
  },
  "severityCounts": {
    "critical": 1,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0
  },
  "issuesCount": 1,
  "issues": [
    {
      "id": "sec-sqli-1",
      "severity": "critical",
      "category": "security",
      "ruleId": "security-sql-injection",
      "title": "SQL Injection via String Concatenation",
      "line": 1,
      "column": 1,
      "endLine": 1,
      "endColumn": 58,
      "message": "SQL statement constructed via string concatenation.",
      "explanation": "Concatenating untrusted dynamic variables into SQL query strings enables SQL injection.",
      "risk": "Direct database exfiltration, unauthorized administrative access, or database deletion.",
      "suggestion": "Use parameterized queries with placeholders ($1, ?, or named parameters).",
      "source": "deterministic-security",
      "file": "app.js"
    }
  ],
  "rawCode": "const query = 'SELECT * FROM users WHERE id = ' + req.query.id;\ndb.query(query);",
  "timestamp": "2026-09-13T00:00:00.000Z"
}
```

### Get Single Analysis
`GET /api/analysis/:id`

### Get Analysis History
`GET /api/analysis/history?language=javascript&status=valid&limit=50`

### Get Curated Samples
`GET /api/analysis/samples`

Returns pre-configured vulnerable code samples for all 6 languages (JavaScript, TypeScript, Python, Java, C++, Go).

### Get Dashboard Analytics
`GET /api/analysis/analytics`

Returns aggregated metrics: total analyses, valid/invalid pass rate, severity counts, and language distribution.

---

## 3. AI Enrichment Endpoints

### AI Explanation
`POST /api/analysis/:id/explain`

**Request Body:**
```json
{
  "issueId": "sec-sqli-1"
}
```

**Response (200 OK):**
```json
{
  "title": "SQL Injection via String Concatenation",
  "whatIsWrong": "User input is directly concatenated into a raw SQL query string.",
  "whyItMatters": "Bypasses database escape mechanisms and allows attacker to control SQL execution.",
  "whatCouldHappen": "Attackers may read credentials, alter tables, or execute administrative commands.",
  "suggestedFix": "Use parameterized queries ($1) with parameter arrays.",
  "source": "ai-heuristic-engine"
}
```

### AI Fix Generation
`POST /api/analysis/:id/fix`

**Request Body:**
```json
{
  "issueId": "sec-sqli-1"
}
```

**Response (200 OK):**
```json
{
  "fixId": "fix_9948201a9b",
  "originalCode": "...",
  "fixedCode": "...",
  "diffSummary": "Replaced concatenated query with parameterized $1 placeholder.",
  "explanation": "Use parameterized queries with placeholders ($1, ?).",
  "confidence": 0.98
}
```

### AI Qualitative Code Review
`POST /api/analysis/:id/review`

---

## 4. Reports & Health Endpoints

### Download HTML Report
`GET /api/reports/:id/html`

Returns standalone, printable HTML document with embedded CSS.

### Download JSON Report
`GET /api/reports/:id/json`

### Health Check
`GET /api/health`
