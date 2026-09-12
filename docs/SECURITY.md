# CodeGuard AI — Security Architecture & Execution Isolation Model

Security is a foundational design requirement for CodeGuard AI. This document outlines the defense-in-depth controls implemented across the API, static analysis pipelines, container networking, and code execution sandboxing.

---

## 1. Threat Model & Perimeter Defenses

| Layer | Defense Mechanism | Configuration & Implementation |
|---|---|---|
| **HTTP Headers** | Helmet Middleware | Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security` |
| **CORS Policy** | Explicit Origin Allowlisting | Rejects unauthorized cross-origin requests in production |
| **Rate Limiting** | Express-Rate-Limit | 120 req/min for API endpoints; 30 attempts / 15 min for auth endpoints |
| **Payload Guards** | Strict Payload Size Caps | Body parser capped at 2MB; source code submissions limited to 512 KB |
| **Authentication** | JWT + bcryptjs | Salt rounds = 10; tokens signed with 256-bit secret and expiration window |
| **Injection Safety** | Parameterized Queries | Prevents SQL injection across PostgreSQL database operations |

---

## 2. Safe Code Execution Sandboxing Architecture

When running dynamic execution tests or compiler evaluations on untrusted user code:

> **CRITICAL RULE**: Untrusted code is NEVER executed on the host system or inside the Node.js / FastAPI web containers.

### Sandboxed Container Execution Blueprint

```text
       Submitted Code
              │
              ▼
   [Backend Sandbox Dispatcher]
              │
              ▼
   [Ephemeral Docker Container]
   Flags:
   • --network=none           (Network access completely disabled)
   • --read-only              (Root filesystem is read-only)
   • --tmpfs /tmp:size=16M    (Volatile in-memory scratch space only)
   • --cpus=0.5               (Hard cap on CPU execution)
   • --memory=128m            (Hard cap on RAM to prevent OOM DOS)
   • --pids-limit=64          (Fork-bomb prevention)
   • --user=1001:1001         (Unprivileged non-root user)
   • --rm                     (Self-destructs immediately on exit)
              │
              ▼
   Execute Compiler / Runner (Timeout: 3000 ms)
              │
              ▼
   Capture stdout & stderr
              │
              ▼
   Forcefully kill & destroy container
```

### Docker Sandbox Command Reference
```bash
docker run --rm \
  --network none \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --memory 128m \
  --cpus 0.5 \
  --pids-limit 64 \
  --user 1000:1000 \
  --security-opt no-new-privileges \
  codeguard-sandbox-runner:latest \
  timeout 3s ./run-script
```

---

## 3. OWASP Top 10 Static Coverage

CodeGuard AI's deterministic engine inspects source code for the following vulnerabilities:

1. **A01: Broken Access Control**:
   - Hardcoded master API keys, tokens, and credentials in source code.
2. **A02: Cryptographic Failures**:
   - Use of broken hashing algorithms (MD5, SHA-1).
   - Insecure ciphers (DES) and lack of salt.
3. **A03: Injection**:
   - SQL Injection via string concatenation, format strings, and unescaped queries.
   - Command Injection via `child_process.exec`, `os.system`, `Runtime.getRuntime().exec`, and `exec.Command`.
   - Cross-Site Scripting (XSS) via `innerHTML` and unescaped DOM insertion.
4. **A05: Security Misconfiguration**:
   - Unhandled exceptions and empty catch blocks.
   - Debugger statements left in production code.
5. **A08: Software and Data Integrity Failures**:
   - Insecure deserialization via Python `pickle.loads` and Java `ObjectInputStream.readObject`.
   - Unsafe YAML loading (`yaml.load` without SafeLoader).
