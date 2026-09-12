/**
 * CodeGuard AI - Java Deterministic Static Analysis Engine
 * Checks syntax integrity, OWASP Java vulnerabilities, and code quality rules
 */

function analyzeJava(code) {
  const issues = [];
  let isValid = true;
  const lines = code.split('\n');

  // Step 1: Syntax Balance & Grammar Validation
  let braceCount = 0;
  let parenCount = 0;
  let hasClassDeclaration = false;

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    if (/\b(class|interface|enum|record)\s+[A-Za-z0-9_]+/.test(trimmed)) {
      hasClassDeclaration = true;
    }

    // Brace & paren tracking
    for (const char of trimmed) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
    }
  });

  if (braceCount !== 0 || parenCount !== 0) {
    isValid = false;
    const lastLine = lines.length;
    issues.push({
      id: `java-syntax-unbalanced-${lastLine}`,
      severity: 'critical',
      category: 'syntax',
      ruleId: 'java-syntax-unbalanced-delimiters',
      title: 'Java Syntax Error: Unbalanced Braces or Parentheses',
      line: lastLine,
      column: 1,
      endLine: lastLine,
      endColumn: lines[lastLine - 1]?.length || 1,
      message: `Syntax error: Found ${Math.abs(braceCount)} unmatched ${braceCount > 0 ? 'opening' : 'closing'} brace(s) / ${Math.abs(parenCount)} unmatched paren(s).`,
      explanation: 'Java requires all class, method, and statement block delimiters to be properly closed and balanced.',
      risk: 'Compilation failure (javac error). Class cannot be compiled into bytecode.',
      suggestion: 'Ensure every opening "{" and "(" has a corresponding closing "}" and ")".',
      source: 'java-validator'
    });
  }

  // Step 2: Line-by-Line Security & Quality Static Analysis
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // SQL Injection in Statement.executeQuery / executeUpdate
    if (/(?:statement|stmt)\.(?:executeQuery|executeUpdate|execute)\s*\(\s*["'].*?\+/i.test(trimmed)) {
      issues.push({
        id: `java-sec-sqli-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'java-sql-injection',
        title: 'SQL Injection via String Concatenation',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'SQL query dynamically constructed with string concatenation in Statement execution.',
        explanation: 'Concatenating untrusted inputs into java.sql.Statement allows SQL injection attacks.',
        risk: 'Direct database compromise, privilege escalation, or unauthorized data destruction.',
        suggestion: 'Use java.sql.PreparedStatement with positional parameters (?) instead of Statement concatenation.',
        source: 'deterministic-security'
      });
    }

    // Command Injection: Runtime.getRuntime().exec()
    if (/Runtime\.getRuntime\(\)\.exec\s*\(/.test(trimmed)) {
      if (trimmed.includes('+')) {
        issues.push({
          id: `java-sec-cmdi-${lineNum}`,
          severity: 'critical',
          category: 'security',
          ruleId: 'java-command-injection',
          title: 'Command Injection via Runtime.exec()',
          line: lineNum,
          column: 1,
          endLine: lineNum,
          endColumn: lineText.length,
          message: 'Unsanitized input concatenated into Runtime.getRuntime().exec().',
          explanation: 'Executing system commands with dynamic strings allows attackers to append shell metacharacters and execute unauthorized commands.',
          risk: 'Remote Code Execution (RCE) on the host machine.',
          suggestion: 'Use ProcessBuilder with a pre-validated command array (List<String>) without invoking a shell.',
          source: 'deterministic-security'
        });
      }
    }

    // Insecure Deserialization: ObjectInputStream.readObject()
    if (/new\s+ObjectInputStream\b/.test(trimmed) || /\.readObject\s*\(/.test(trimmed)) {
      issues.push({
        id: `java-sec-deserialization-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'java-insecure-deserialization',
        title: 'Insecure Object Deserialization',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'ObjectInputStream.readObject() called on potentially untrusted input.',
        explanation: 'Native Java deserialization allows attackers to construct gadget chains (e.g. Apache Commons Collections) that execute arbitrary code.',
        risk: 'Remote Code Execution (RCE) via serialized gadget payloads.',
        suggestion: 'Use safe data serialization such as Jackson JSON, Protocol Buffers, or implement ValidatingObjectInputStream.',
        source: 'deterministic-security'
      });
    }

    // Weak Crypto: MD5 / SHA-1 / DES
    if (/MessageDigest\.getInstance\s*\(\s*["'](MD5|SHA-1)["']\s*\)/i.test(trimmed)) {
      issues.push({
        id: `java-sec-crypto-${lineNum}`,
        severity: 'high',
        category: 'security',
        ruleId: 'java-weak-cryptography',
        title: 'Weak MessageDigest Algorithm (MD5 / SHA-1)',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Use of deprecated cryptographic hash algorithm (MD5 or SHA-1).',
        explanation: 'MD5 and SHA-1 have known collision vulnerabilities and do not satisfy modern security standards.',
        risk: 'Cryptographic collision attacks and token forgery.',
        suggestion: 'Use MessageDigest.getInstance("SHA-256") or a dedicated password hashing library (Argon2 / BCrypt).',
        source: 'deterministic-security'
      });
    }

    // Empty Catch Block
    if (/catch\s*\([^)]+\)\s*\{\s*\}/.test(trimmed)) {
      issues.push({
        id: `java-bug-empty-catch-${lineNum}`,
        severity: 'medium',
        category: 'bugs',
        ruleId: 'java-empty-catch-block',
        title: 'Empty Catch Block (Swallowed Exception)',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Exception caught and discarded without logging or recovery.',
        explanation: 'Ignoring caught exceptions conceals critical failure states and makes tracking system faults impossible.',
        risk: 'Silent failures and unrecoverable state divergence.',
        suggestion: 'Log the exception with a logger (e.g. log.error("...", e)) or rethrow a custom RuntimeException.',
        source: 'deterministic-quality'
      });
    }

    // Hardcoded secret pattern
    if (/(?:password|apiKey|secretKey|token)\s*=\s*["'][A-Za-z0-9_\-+=/]{8,}["']/i.test(trimmed)) {
      issues.push({
        id: `java-sec-secret-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'java-hardcoded-credential',
        title: 'Hardcoded Secret / Password',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Hardcoded credential or API secret found in Java source code.',
        explanation: 'Storing credentials in compiled source code allows them to be extracted via decompilation (javap, jad, etc.).',
        risk: 'Credential theft from compiled JAR or source repository.',
        suggestion: 'Store secrets in external configuration, environment variables, or a secret manager (AWS Secrets Manager / Vault).',
        source: 'deterministic-security'
      });
    }
  });

  return { isValid, issues };
}

module.exports = {
  analyzeJava
};
