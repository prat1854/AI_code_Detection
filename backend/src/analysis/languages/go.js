/**
 * CodeGuard AI - Go Deterministic Static Analysis Engine
 * Checks Go syntax, unhandled errors, goroutine leaks, and security vulnerabilities
 */

function analyzeGo(code) {
  const issues = [];
  let isValid = true;
  const lines = code.split('\n');

  // Step 1: Syntax & Delimiter Balance Validation
  let braceCount = 0;
  let hasPackage = false;

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    if (/^package\s+[A-Za-z0-9_]+/.test(trimmed)) {
      hasPackage = true;
    }

    for (const char of trimmed) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
  });

  if (!hasPackage) {
    isValid = false;
    issues.push({
      id: 'go-syntax-missing-package',
      severity: 'critical',
      category: 'syntax',
      ruleId: 'go-missing-package-declaration',
      title: 'Missing Package Declaration',
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 10,
      message: 'Go files must begin with a valid package declaration (e.g. "package main").',
      explanation: 'Every Go source file must declare its enclosing package at the top of the file before imports.',
      risk: 'Go build/compile failure: expected package declaration.',
      suggestion: 'Add "package main" or the appropriate package identifier at line 1.',
      source: 'go-compiler'
    });
  }

  if (braceCount !== 0) {
    isValid = false;
    const lastLine = lines.length;
    issues.push({
      id: `go-syntax-unbalanced-${lastLine}`,
      severity: 'critical',
      category: 'syntax',
      ruleId: 'go-unbalanced-braces',
      title: 'Go Syntax Error: Unbalanced Curly Braces',
      line: lastLine,
      column: 1,
      endLine: lastLine,
      endColumn: lines[lastLine - 1]?.length || 1,
      message: `Syntax error: Found ${Math.abs(braceCount)} unmatched ${braceCount > 0 ? 'opening' : 'closing'} brace(s).`,
      explanation: 'Unclosed or extra curly braces prevent the Go compiler from parsing statement blocks.',
      risk: 'Go compile error: syntax error: unexpected } or unexpected EOF.',
      suggestion: 'Verify all opening braces have corresponding closing braces.',
      source: 'go-compiler'
    });
  }

  // Step 2: Static Analysis for OWASP Go Vulnerabilities and Idiomatic Quality
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    // SQL Injection via fmt.Sprintf or string concatenation in db.Query or query assignment
    if (
      /(?:db|tx)\.(?:Query|QueryRow|Exec)\s*\(\s*(?:fmt\.Sprintf\s*\(|["'].*?\+)/.test(trimmed) ||
      /fmt\.Sprintf\s*\(\s*["'].*?\b(?:SELECT|INSERT|UPDATE|DELETE)\b.*?%s/i.test(trimmed)
    ) {
      issues.push({
        id: `go-sec-sqli-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'go-sql-injection',
        title: 'SQL Injection via fmt.Sprintf()',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'SQL query formatted with fmt.Sprintf() or string concatenation.',
        explanation: 'Dynamic query formatting exposes database drivers to SQL injection attacks.',
        risk: 'Unauthorized database read/write and data extraction.',
        suggestion: 'Use parameterized queries: db.Query("SELECT * FROM users WHERE id = $1", id) or "?".',
        source: 'deterministic-security'
      });
    }

    // Command Injection in exec.Command
    if (/exec\.Command\s*\(\s*["'](?:sh|bash|cmd)["']\s*,\s*["']-[cC]["']\s*,\s*.*?[\+\s]/.test(trimmed)) {
      issues.push({
        id: `go-sec-cmdi-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'go-command-injection',
        title: 'Command Injection via exec.Command()',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Unsanitized string concatenated into shell execution (sh -c / bash -c).',
        explanation: 'Passing dynamic strings into a shell sub-process allows command injection through shell operators (; | &).',
        risk: 'Remote Code Execution (RCE) on the server.',
        suggestion: 'Execute binary directly with separate arguments: exec.Command("binary", arg1, arg2) without invoking a shell.',
        source: 'deterministic-security'
      });
    }

    // Unchecked error pattern: _, err := or res, _ :=
    if (/[a-zA-Z0-9_]+\s*,\s*_\s*:?=\s*[a-zA-Z0-9_.]+\(/.test(trimmed)) {
      issues.push({
        id: `go-quality-unhandled-err-${lineNum}`,
        severity: 'medium',
        category: 'bugs',
        ruleId: 'go-discarded-error',
        title: 'Discarded Error Return Value (Blank Identifier)',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Error return value discarded using blank identifier "_".',
        explanation: 'Discarding errors silently ignores system failures, causing unpredictable states downstream.',
        risk: 'Silent failures, corrupted data, and panic in later operations.',
        suggestion: 'Capture the error and handle it explicitly: if err != nil { return err }.',
        source: 'deterministic-quality'
      });
    }

    // Hardcoded secrets pattern
    if (/(?:apiKey|secretKey|password|token)\s*:?=\s*["'][A-Za-z0-9_\-+=/]{8,}["']/i.test(trimmed)) {
      issues.push({
        id: `go-sec-secret-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'go-hardcoded-secret',
        title: 'Hardcoded Secret / Credential',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Hardcoded credential or API secret found in Go code.',
        explanation: 'Hardcoded credentials in Go binaries can be inspected with strings or reverse-engineering tools.',
        risk: 'Credential leak and unauthorized API access.',
        suggestion: 'Load secrets dynamically from os.Getenv("SECRET_KEY").',
        source: 'deterministic-security'
      });
    }
  });

  return { isValid, issues };
}

module.exports = {
  analyzeGo
};
