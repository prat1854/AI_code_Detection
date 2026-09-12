/**
 * CodeGuard AI - C++ Deterministic Static Analysis Engine
 * Checks C++ syntax integrity, memory safety, buffer overflows, and CWE vulnerabilities
 */

function analyzeCpp(code) {
  const issues = [];
  let isValid = true;
  const lines = code.split('\n');

  // Step 1: Syntax & Delimiter Balance Validation
  let braceCount = 0;
  let parenCount = 0;

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

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
      id: `cpp-syntax-unbalanced-${lastLine}`,
      severity: 'critical',
      category: 'syntax',
      ruleId: 'cpp-syntax-unbalanced-delimiters',
      title: 'C++ Syntax Error: Unbalanced Braces or Parentheses',
      line: lastLine,
      column: 1,
      endLine: lastLine,
      endColumn: lines[lastLine - 1]?.length || 1,
      message: `Syntax error: Found ${Math.abs(braceCount)} unmatched ${braceCount > 0 ? 'opening' : 'closing'} brace(s) / ${Math.abs(parenCount)} unmatched paren(s).`,
      explanation: 'C++ source code must have matched braces and parentheses for function bodies, control flow, and namespace blocks.',
      risk: 'Compiler error (g++ / clang++ fails to build binary).',
      suggestion: 'Check block delimiters and close all open braces and parentheses.',
      source: 'cpp-validator'
    });
  }

  // Step 2: Static Analysis for Memory Safety and Vulnerabilities
  let hasNewAllocation = false;
  let hasDeleteDeallocation = false;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // Track new / delete
    if (/\bnew\s+[A-Za-z0-9_]+/.test(trimmed)) hasNewAllocation = true;
    if (/\bdelete\b/.test(trimmed)) hasDeleteDeallocation = true;

    // Unsafe C-string functions: strcpy, strcat, sprintf, gets
    if (/\bgets\s*\(/.test(trimmed)) {
      issues.push({
        id: `cpp-sec-gets-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'cpp-banned-gets',
        title: 'Banned Function: gets() [CWE-120]',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'gets() cannot prevent buffer overflow and is banned in standard C++.',
        explanation: 'gets() does not check buffer boundaries, allowing arbitrary input to overflow stack buffers.',
        risk: 'Classic stack-based buffer overflow allowing arbitrary code execution or crash.',
        suggestion: 'Use std::string and std::getline(std::cin, str) or fgets() with explicit buffer size.',
        source: 'deterministic-security'
      });
    }

    if (/\bstrcpy\s*\(/.test(trimmed) || /\bstrcat\s*\(/.test(trimmed)) {
      issues.push({
        id: `cpp-sec-strcpy-${lineNum}`,
        severity: 'high',
        category: 'security',
        ruleId: 'cpp-unsafe-strcpy',
        title: 'Unbounded String Copy (strcpy/strcat) [CWE-120]',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Use of unbounded string copy function (strcpy or strcat).',
        explanation: 'These functions copy memory until encountering a null terminator without verifying that the destination buffer is large enough.',
        risk: 'Buffer overflow, memory corruption, and potential code execution.',
        suggestion: 'Use std::string or bounded alternatives like strncpy() / snprintf() with exact length limits.',
        source: 'deterministic-security'
      });
    }

    if (/\bsprintf\s*\(/.test(trimmed)) {
      issues.push({
        id: `cpp-sec-sprintf-${lineNum}`,
        severity: 'high',
        category: 'security',
        ruleId: 'cpp-unsafe-sprintf',
        title: 'Unbounded sprintf() Call [CWE-134]',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Use of sprintf() risks buffer overflow if output exceeds target buffer size.',
        explanation: 'sprintf does not take a destination size limit, which can overflow buffers when rendering dynamic data.',
        risk: 'Buffer overrun and memory corruption.',
        suggestion: 'Use snprintf(buf, sizeof(buf), ...) or std::ostringstream / std::format in C++20.',
        source: 'deterministic-security'
      });
    }

    // Format String Vulnerability: printf(var) without format string
    if (/\bprintf\s*\(\s*[A-Za-z0-9_]+\s*\)/.test(trimmed)) {
      issues.push({
        id: `cpp-sec-format-string-${lineNum}`,
        severity: 'critical',
        category: 'security',
        ruleId: 'cpp-format-string-vulnerability',
        title: 'Format String Vulnerability [CWE-134]',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Dynamic variable passed as format argument to printf().',
        explanation: 'Passing user-controlled data directly as the format string allows format specifiers (%x, %n) to inspect stack memory or overwrite arbitrary addresses.',
        risk: 'Arbitrary memory read/write and remote code execution.',
        suggestion: 'Always specify a format literal: printf("%s", variable).',
        source: 'deterministic-security'
      });
    }
  });

  // Potential Memory Leak: raw new without delete
  if (hasNewAllocation && !hasDeleteDeallocation) {
    issues.push({
      id: `cpp-leak-raw-new`,
      severity: 'medium',
      category: 'quality',
      ruleId: 'cpp-potential-memory-leak',
      title: 'Potential Memory Leak (Missing delete)',
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 10,
      message: 'Raw "new" operator detected without corresponding "delete" or smart pointer.',
      explanation: 'Manual memory management with raw "new" is error-prone and often leads to unreleased heap memory.',
      risk: 'Memory leak causing process degradation and Out-Of-Memory (OOM) crashes over time.',
      suggestion: 'Adopt RAII using smart pointers: std::unique_ptr or std::make_shared.',
      source: 'deterministic-quality'
    });
  }

  return { isValid, issues };
}

module.exports = {
  analyzeCpp
};
