/**
 * CodeGuard AI - Python Deterministic Static Analysis Engine
 * Uses Python AST parser runner + static rule analyzer
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Locate python executable
function getPythonCommand() {
  const possiblePaths = [
    path.resolve(__dirname, '../../../../ai-service/.venv/Scripts/python.exe'),
    path.resolve(__dirname, '../../../../ai-service/.venv/bin/python'),
    'python',
    'python3'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'python';
}

function analyzePython(code) {
  const issues = [];
  let isValid = true;
  const scriptPath = path.resolve(__dirname, '../scripts/py_ast_check.py');

  // Step 1: Run native Python AST analysis if Python interpreter is available
  try {
    const pythonCmd = getPythonCommand();
    const result = spawnSync(pythonCmd, [scriptPath], {
      input: code,
      encoding: 'utf-8',
      timeout: 5000
    });

    if (result.status === 0 && result.stdout) {
      try {
        const parsed = JSON.parse(result.stdout.trim());
        isValid = parsed.isValid;
        issues.push(...parsed.issues);
      } catch (err) {
        console.warn('Failed to parse Python AST script output:', err);
      }
    }
  } catch (err) {
    console.warn('Python child_process execution unavailable:', err.message);
  }

  // Step 2: In-depth static patterns (SQLi, hardcoded credentials, weak crypto)
  const lines = code.split('\n');
  const secretPattern = /(?:api[_-]?key|secret|password|token)\s*=\s*['"][A-Za-z0-9_\-+=/]{8,}['"]/i;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // SQL Injection: cursor.execute with format string / % / + or dynamic SQL string construction
    if (
      /cursor\.execute\s*\(\s*(?:f["']|["'].*?%|["'].*?\+)/.test(lineText) ||
      /(?:f["'].*?\b(?:SELECT|INSERT|UPDATE|DELETE)\b.*?\{)|(?:["'].*?\b(?:SELECT|INSERT|UPDATE|DELETE)\b.*?["']\s*[\+%])/i.test(lineText)
    ) {
      if (!issues.some(i => i.line === lineNum && i.ruleId === 'python-sql-injection')) {
        issues.push({
          id: `py-sec-sqli-${lineNum}`,
          severity: 'critical',
          category: 'security',
          ruleId: 'python-sql-injection',
          title: 'SQL Injection in cursor.execute()',
          line: lineNum,
          column: 1,
          endLine: lineNum,
          endColumn: lineText.length,
          message: 'Raw SQL query formatted using Python string interpolation or concatenation.',
          explanation: 'Formatting SQL queries using f-strings, %, or string concatenation bypasses database driver parameter escaping and creates SQL injection vulnerabilities.',
          risk: 'Unauthorized database exfiltration, query manipulation, and privilege escalation.',
          suggestion: 'Pass query parameters as a tuple/dictionary: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))',
          source: 'deterministic-security'
        });
      }
    }

    // Hardcoded secrets
    if (secretPattern.test(lineText) && !lineText.includes('os.environ') && !lineText.includes('os.getenv')) {
      if (!issues.some(i => i.line === lineNum && i.ruleId === 'python-hardcoded-secret')) {
        issues.push({
          id: `py-sec-secret-${lineNum}`,
          severity: 'critical',
          category: 'security',
          ruleId: 'python-hardcoded-secret',
          title: 'Hardcoded Secret or API Key',
          line: lineNum,
          column: 1,
          endLine: lineNum,
          endColumn: lineText.length,
          message: 'Hardcoded credentials or API keys found in source code.',
          explanation: 'Hardcoded credentials can easily be extracted by unauthorized users or leaked through version control history.',
          risk: 'Unauthorized API access and infrastructure compromise.',
          suggestion: 'Load credentials securely using os.environ.get("SECRET_KEY") or python-dotenv.',
          source: 'deterministic-security'
        });
      }
    }

    // Weak cryptography: hashlib.md5 or hashlib.sha1
    if (/hashlib\.(md5|sha1)\s*\(/.test(lineText)) {
      issues.push({
        id: `py-sec-crypto-${lineNum}`,
        severity: 'high',
        category: 'security',
        ruleId: 'python-weak-hash',
        title: 'Weak Cryptographic Hash (MD5/SHA-1)',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Use of MD5 or SHA1 hash function detected.',
        explanation: 'MD5 and SHA1 are cryptographically broken algorithms susceptible to hash collision attacks.',
        risk: 'Digital signature forgery and password compromise.',
        suggestion: 'Use hashlib.sha256() or hashlib.sha512(), or dedicated password hashers like bcrypt or argon2.',
        source: 'deterministic-security'
      });
    }

    // Insecure tempfile usage (mktemp)
    if (/tempfile\.mktemp\s*\(/.test(lineText)) {
      issues.push({
        id: `py-sec-mktemp-${lineNum}`,
        severity: 'high',
        category: 'security',
        ruleId: 'python-insecure-tempfile',
        title: 'Insecure Temporary File Creation (mktemp)',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'tempfile.mktemp() is deprecated and vulnerable to race conditions (TOCTOU).',
        explanation: 'mktemp() creates a race condition between name generation and file creation, allowing attackers to hijack the temporary file.',
        risk: 'Symlink attacks and unauthorized file overwrites.',
        suggestion: 'Use tempfile.NamedTemporaryFile() or tempfile.TemporaryDirectory().',
        source: 'deterministic-security'
      });
    }
  });

  return { isValid, issues };
}

module.exports = {
  analyzePython
};
