/**
 * CodeGuard AI - JavaScript Deterministic Static Analysis Engine
 * Uses Babel Parser AST + Rule-Based AST Walking & Heuristic Scanners
 */

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function analyzeJavaScript(code) {
  const issues = [];
  let isValid = true;
  let ast = null;

  // Step 1: Deterministic Syntax Parsing
  try {
    ast = parser.parse(code, {
      sourceType: 'unambiguous',
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'asyncGenerators',
        'classProperties',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'nullishCoalescingOperator',
        'optionalChaining',
        'objectRestSpread'
      ]
    });
  } catch (err) {
    isValid = false;
    const line = err.loc ? err.loc.line : 1;
    const column = err.loc ? err.loc.column + 1 : 1;
    issues.push({
      id: `syntax-err-${line}-${column}`,
      severity: 'critical',
      category: 'syntax',
      ruleId: 'js-syntax-error',
      title: 'JavaScript Syntax Error',
      line,
      column,
      endLine: line,
      endColumn: column + 5,
      message: err.message.replace(/\s*\(\d+:\d+\)$/, ''),
      explanation: `The JavaScript engine failed to parse this code at line ${line}, column ${column}. Syntax errors prevent execution and compilation.`,
      risk: 'Execution halted. Code cannot run or build in Node.js or browser runtimes.',
      suggestion: 'Correct the syntax error at the indicated line. Ensure all braces, parentheses, and keywords are properly formed.',
      source: 'deterministic-parser'
    });
    return { isValid, issues };
  }

  // Step 2: AST Static Analysis and Vulnerability Detection
  const definedVariables = new Set();
  const usedVariables = new Set();

  try {
    traverse(ast, {
      // Catch eval() / new Function()
      CallExpression(path) {
        const callee = path.node.callee;
        const line = path.node.loc?.start.line || 1;
        const column = path.node.loc?.start.column || 1;

        if (callee.type === 'Identifier' && callee.name === 'eval') {
          issues.push({
            id: `sec-eval-${line}`,
            severity: 'critical',
            category: 'security',
            ruleId: 'security-no-eval',
            title: 'Dangerous Code Execution via eval()',
            line,
            column: column + 1,
            endLine: path.node.loc?.end.line || line,
            endColumn: path.node.loc?.end.column || column + 6,
            message: 'Use of eval() detected. Arbitrary code execution vulnerability.',
            explanation: 'eval() passes a string directly into the JavaScript interpreter. If user input flows into eval(), attackers can execute arbitrary code.',
            risk: 'Remote Code Execution (RCE) and full application compromise.',
            suggestion: 'Refactor to parse JSON using JSON.parse() or use safe data mappings instead of dynamic code execution.',
            source: 'deterministic-ast'
          });
        }

        // Child process command injection: exec("..." + var)
        if (
          (callee.type === 'MemberExpression' &&
            callee.property?.name === 'exec' &&
            (callee.object?.name === 'child_process' || callee.object?.name === 'cp')) ||
          (callee.type === 'Identifier' && callee.name === 'exec')
        ) {
          const firstArg = path.node.arguments[0];
          if (firstArg && (firstArg.type === 'BinaryExpression' || firstArg.type === 'TemplateLiteral')) {
            issues.push({
              id: `sec-cmdi-${line}`,
              severity: 'critical',
              category: 'security',
              ruleId: 'security-command-injection',
              title: 'Command Injection Vulnerability',
              line,
              column: column + 1,
              endLine: path.node.loc?.end.line || line,
              endColumn: path.node.loc?.end.column || column + 20,
              message: 'Unsanitized input concatenated into system command execution.',
              explanation: 'Invoking child_process.exec with string concatenation allows shell metacharacters (; | &) to execute unauthorized system commands.',
              risk: 'Attacker gains remote shell access on the host operating system.',
              suggestion: 'Use child_process.execFile() or spawn() with arguments passed as an array without invoking a shell.',
              source: 'deterministic-ast'
            });
          }
        }

        // SQL Injection via query concatenation
        if (
          callee.type === 'MemberExpression' &&
          (callee.property?.name === 'query' || callee.property?.name === 'execute')
        ) {
          const firstArg = path.node.arguments[0];
          if (firstArg && (firstArg.type === 'BinaryExpression' || (firstArg.type === 'TemplateLiteral' && firstArg.expressions.length > 0))) {
            issues.push({
              id: `sec-sqli-${line}`,
              severity: 'critical',
              category: 'security',
              ruleId: 'security-sql-injection',
              title: 'SQL Injection via Query Concatenation',
              line,
              column: column + 1,
              endLine: path.node.loc?.end.line || line,
              endColumn: path.node.loc?.end.column || column + 25,
              message: 'Raw SQL query constructed using string concatenation or template literal interpolation.',
              explanation: 'Directly concatenating dynamic values into SQL query strings bypasses database escaping and allows query manipulation.',
              risk: 'Unauthorized database read/write, credential exfiltration, or database destruction.',
              suggestion: 'Use parameterized queries with placeholders ($1, ?, or named parameters) and pass arguments separately.',
              source: 'deterministic-ast'
            });
          }
        }

        // Weak Crypto: MD5 or SHA1
        if (
          callee.type === 'MemberExpression' &&
          callee.property?.name === 'createHash' &&
          path.node.arguments[0]?.type === 'StringLiteral'
        ) {
          const alg = path.node.arguments[0].value.toLowerCase();
          if (alg === 'md5' || alg === 'sha1') {
            issues.push({
              id: `sec-crypto-${line}`,
              severity: 'high',
              category: 'security',
              ruleId: 'security-weak-crypto',
              title: `Weak Cryptographic Hash Algorithm (${alg.toUpperCase()})`,
              line,
              column: column + 1,
              endLine: path.node.loc?.end.line || line,
              endColumn: path.node.loc?.end.column || column + 20,
              message: `Use of broken cryptographic hash algorithm: ${alg}.`,
              explanation: `${alg.toUpperCase()} is vulnerable to collision attacks and should never be used for password hashing, digital signatures, or security tokens.`,
              risk: 'Hash collision attacks and security token forgery.',
              suggestion: 'Use SHA-256 / SHA-512 for integrity, or bcrypt / argon2 / scrypt for password hashing.',
              source: 'deterministic-ast'
            });
          }
        }
      },

      // XSS via assignment to innerHTML or outerHTML
      AssignmentExpression(path) {
        const left = path.node.left;
        const line = path.node.loc?.start.line || 1;
        const column = path.node.loc?.start.column || 1;

        if (
          left.type === 'MemberExpression' &&
          (left.property?.name === 'innerHTML' || left.property?.name === 'outerHTML')
        ) {
          issues.push({
            id: `sec-xss-${line}`,
            severity: 'high',
            category: 'security',
            ruleId: 'security-xss-innerhtml',
            title: 'Cross-Site Scripting (XSS) via innerHTML',
            line,
            column: column + 1,
            endLine: path.node.loc?.end.line || line,
            endColumn: path.node.loc?.end.column || column + 15,
            message: `Direct assignment to ${left.property.name} risks DOM Cross-Site Scripting (XSS).`,
            explanation: 'Setting innerHTML directly with dynamic content allows malicious scripts to execute within the victim browser session.',
            risk: 'Session hijacking, credential theft, and unauthorized actions on behalf of the user.',
            suggestion: 'Use element.textContent, innerText, or sanitize HTML using DOMPurify before inserting.',
            source: 'deterministic-ast'
          });
        }

        // Accidental assignment in condition check: if (a = b)
        if (path.parentPath?.isIfStatement() || path.parentPath?.isWhileStatement()) {
          issues.push({
            id: `bug-assign-in-cond-${line}`,
            severity: 'high',
            category: 'bugs',
            ruleId: 'bug-assignment-in-conditional',
            title: 'Accidental Assignment in Conditional Statement',
            line,
            column: column + 1,
            endLine: path.node.loc?.end.line || line,
            endColumn: path.node.loc?.end.column || column + 10,
            message: 'Assignment operator (=) found inside conditional statement where comparison (===) was likely intended.',
            explanation: 'This assigns a value rather than comparing it, resulting in the condition always evaluating to truthy/falsy based on the assigned value.',
            risk: 'Logic errors, accidental infinite loops, or bypassed security checks.',
            suggestion: 'Replace "=" with "===" for strict equality comparison.',
            source: 'deterministic-ast'
          });
        }
      },

      // Comparison with == instead of ===
      BinaryExpression(path) {
        const line = path.node.loc?.start.line || 1;
        const column = path.node.loc?.start.column || 1;

        if (path.node.operator === '==' || path.node.operator === '!=') {
          issues.push({
            id: `quality-eqeqeq-${line}-${column}`,
            severity: 'low',
            category: 'quality',
            ruleId: 'quality-require-strict-equality',
            title: `Loose Equality Operator (${path.node.operator})`,
            line,
            column: column + 1,
            endLine: path.node.loc?.end.line || line,
            endColumn: path.node.loc?.end.column || column + 5,
            message: `Use of loose equality '${path.node.operator}' instead of strict '${path.node.operator}='.`,
            explanation: 'Loose equality causes implicit type coercion which frequently produces unintuitive bugs (e.g. 0 == false is true).',
            risk: 'Unintended type coercion and subtle conditional branch bugs.',
            suggestion: `Use strict comparison '${path.node.operator}=' to compare both value and type.`,
            source: 'deterministic-ast'
          });
        }
      },

      // Debugger statement
      DebuggerStatement(path) {
        const line = path.node.loc?.start.line || 1;
        issues.push({
          id: `quality-debugger-${line}`,
          severity: 'medium',
          category: 'quality',
          ruleId: 'quality-no-debugger',
          title: 'Debugger Statement in Code',
          line,
          column: 1,
          endLine: line,
          endColumn: 9,
          message: 'Unexpected "debugger" statement found.',
          explanation: 'Debugger statements halt execution when developer tools are open and must never be committed to production code.',
          risk: 'Application freezing in client browsers and accidental exposure of runtime state.',
          suggestion: 'Remove debugger statement before committing or deploying.',
          source: 'deterministic-ast'
        });
      },

      // Empty catch blocks
      CatchClause(path) {
        const line = path.node.loc?.start.line || 1;
        if (path.node.body?.body?.length === 0) {
          issues.push({
            id: `bug-empty-catch-${line}`,
            severity: 'medium',
            category: 'bugs',
            ruleId: 'bug-empty-catch-block',
            title: 'Empty Catch Block (Swallowed Error)',
            line,
            column: path.node.loc?.start.column || 1,
            endLine: path.node.loc?.end.line || line,
            endColumn: path.node.loc?.end.column || 10,
            message: 'Empty catch block suppresses exceptions without logging or handling.',
            explanation: 'Swallowing errors without logging conceals runtime failures and makes production debugging nearly impossible.',
            risk: 'Silent failures, inconsistent application state, and unhandled crashes.',
            suggestion: 'Log the error with a logger or rethrow the exception after handling.',
            source: 'deterministic-ast'
          });
        }
      },

      // Long functions (> 60 lines)
      Function(path) {
        const startLine = path.node.loc?.start.line || 1;
        const endLine = path.node.loc?.end.line || 1;
        const length = endLine - startLine + 1;
        if (length > 60) {
          issues.push({
            id: `quality-long-func-${startLine}`,
            severity: 'low',
            category: 'quality',
            ruleId: 'quality-function-length',
            title: `Excessive Function Length (${length} lines)`,
            line: startLine,
            column: path.node.loc?.start.column || 1,
            endLine: startLine,
            endColumn: (path.node.loc?.start.column || 1) + 15,
            message: `Function is ${length} lines long, exceeding recommended threshold of 60 lines.`,
            explanation: 'Large functions violate the Single Responsibility Principle, are difficult to read, and have high defect rates.',
            risk: 'Poor maintainability, difficult unit testing, and higher defect rates.',
            suggestion: 'Decompose this function into smaller, single-purpose helper functions.',
            source: 'deterministic-ast'
          });
        }
      }
    });
  } catch (astErr) {
    // If traversal fails for any reason, non-fatal fallback
    console.warn('AST Traversal warning:', astErr.message);
  }

  // Step 3: Source Code Level Scans (Hardcoded Secrets & Prototype Pollution)
  const lines = code.split('\n');
  const secretPattern = /(?:api[_-]?key|secret|password|auth[_-]?token|private[_-]?key)\s*[:=]\s*['"][A-Za-z0-9_\-+=/]{8,}['"]/i;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // SQL Injection via string concatenation or template interpolation
    if (
      /(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b.*?['"]\s*\+\s*[a-zA-Z]/i.test(lineText) ||
      /`\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b.*?\$\{/i.test(lineText)
    ) {
      if (!issues.some(i => i.line === lineNum && i.ruleId === 'security-sql-injection')) {
        issues.push({
          id: `sec-sqli-${lineNum}`,
          severity: 'critical',
          category: 'security',
          ruleId: 'security-sql-injection',
          title: 'SQL Injection via String Concatenation',
          line: lineNum,
          column: 1,
          endLine: lineNum,
          endColumn: lineText.length,
          message: 'SQL statement constructed via string concatenation or interpolated template literals.',
          explanation: 'Concatenating untrusted dynamic variables into SQL query strings enables SQL injection.',
          risk: 'Direct database exfiltration, unauthorized administrative access, or database deletion.',
          suggestion: 'Use parameterized queries with placeholders ($1, ?, or named parameters) and pass arguments separately.',
          source: 'deterministic-security'
        });
      }
    }

    // Hardcoded secrets
    if (secretPattern.test(lineText) && !lineText.includes('process.env')) {
      issues.push({
        id: `sec-hardcoded-secret-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'security-hardcoded-credential',
        title: 'Hardcoded Secret or API Key Detected',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Hardcoded secret, API key, or credential found in source code.',
        explanation: 'Committing hardcoded secrets into version control exposes credentials to anyone with repository read access or data leaks.',
        risk: 'Credential leak, unauthorized API access, and infrastructure compromise.',
        suggestion: 'Store secrets in environment variables (.env) and access via process.env.',
        source: 'deterministic-security'
      });
    }

    // Prototype pollution pattern
    if (lineText.includes('__proto__') || lineText.includes('prototype[')) {
      issues.push({
        id: `sec-proto-pollution-${lineNum}`,
        severity: 'high',
        category: 'security',
        ruleId: 'security-prototype-pollution',
        title: 'Potential Prototype Pollution',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Direct access or assignment to __proto__ detected.',
        explanation: 'Modifying Object.prototype or __proto__ alters the behavior of all objects in the runtime, which attackers can exploit for Denial of Service or RCE.',
        risk: 'Object prototype modification leading to logic bypass or remote code execution.',
        suggestion: 'Use Map, Object.create(null), or validate object keys against an allowlist before assignment.',
        source: 'deterministic-security'
      });
    }

    // Inefficient loop / potential O(n^2) nested loops
    if (/\bfor\s*\(/.test(lineText) && idx > 0 && /\bfor\s*\(/.test(lines[idx - 1])) {
      issues.push({
        id: `perf-nested-loops-${lineNum}`,
        severity: 'medium',
        category: 'performance',
        ruleId: 'performance-nested-loops',
        title: 'Directly Nested Loop (Potential O(n²) Complexity)',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Nested loop structure detected. May lead to O(n²) performance degradation on large datasets.',
        explanation: 'Nested loops iterate over the full dataset for every item in the outer loop, rapidly degrading response times as data scales.',
        risk: 'High CPU utilization, event loop blocking, and denial of service under high load.',
        suggestion: 'Consider using a Hash Map, Set lookup, or indexed lookup to reduce time complexity to O(n).',
        source: 'deterministic-perf'
      });
    }
  });

  return { isValid, issues };
}

module.exports = {
  analyzeJavaScript
};
