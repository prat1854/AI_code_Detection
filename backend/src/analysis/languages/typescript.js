/**
 * CodeGuard AI - TypeScript Deterministic Static Analysis Engine
 * Uses official TypeScript Compiler API (ts.createSourceFile) + AST visitor
 */

const ts = require('typescript');
const { analyzeJavaScript } = require('./javascript');

function analyzeTypeScript(code) {
  const issues = [];
  let isValid = true;

  // Step 1: Parse using TypeScript Compiler API
  const sourceFile = ts.createSourceFile(
    'input.ts',
    code,
    ts.ScriptTarget.Latest,
    true, // setParentNodes
    ts.ScriptKind.TS
  );

  // Check syntactic diagnostics
  const parseDiagnostics = sourceFile.parseDiagnostics || [];
  if (parseDiagnostics.length > 0) {
    isValid = false;
    for (const diag of parseDiagnostics) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(diag.start || 0);
      const lineNum = line + 1;
      const colNum = character + 1;
      const msg = typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText;

      issues.push({
        id: `ts-syntax-err-${lineNum}-${colNum}`,
        severity: 'critical',
        category: 'syntax',
        ruleId: `ts-${diag.code}`,
        title: 'TypeScript Syntax Error',
        line: lineNum,
        column: colNum,
        endLine: lineNum,
        endColumn: colNum + (diag.length || 5),
        message: msg,
        explanation: `TypeScript compiler reported a syntax violation at line ${lineNum}, column ${colNum}: ${msg}`,
        risk: 'Compilation will fail. Build cannot produce valid JavaScript output.',
        suggestion: 'Correct the syntax issue per the TypeScript compiler diagnostic.',
        source: 'typescript-compiler'
      });
    }
  }

  // Step 2: AST Walk for TypeScript-specific code smells
  function visit(node) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const lineNum = line + 1;
    const colNum = character + 1;

    // Detect 'any' type annotation
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      issues.push({
        id: `ts-any-${lineNum}-${colNum}`,
        severity: 'medium',
        category: 'quality',
        ruleId: 'ts-no-explicit-any',
        title: 'Explicit "any" Type Usage',
        line: lineNum,
        column: colNum,
        endLine: lineNum,
        endColumn: colNum + 3,
        message: 'Explicit use of "any" type disables TypeScript static type safety.',
        explanation: 'Using "any" tells the TypeScript compiler to skip type checking, eliminating the safety guarantees and autocompletion benefits of TypeScript.',
        risk: 'Undetected runtime type errors and degraded code maintainability.',
        suggestion: 'Specify a strict type, generic parameter, or "unknown" if the type is truly dynamic.',
        source: 'typescript-ast'
      });
    }

    // Detect non-null assertion: foo!.bar
    if (node.kind === ts.SyntaxKind.NonNullExpression) {
      issues.push({
        id: `ts-non-null-${lineNum}-${colNum}`,
        severity: 'low',
        category: 'bugs',
        ruleId: 'ts-no-non-null-assertion',
        title: 'Non-Null Assertion Operator (!)',
        line: lineNum,
        column: colNum,
        endLine: lineNum,
        endColumn: colNum + 1,
        message: 'Non-null assertion operator (!) used to override null/undefined safety.',
        explanation: 'The non-null assertion operator (!) asserts to the compiler that a value cannot be null or undefined without actually performing a runtime check.',
        risk: 'Potential "Cannot read properties of undefined/null" TypeError at runtime if assumption fails.',
        suggestion: 'Use optional chaining (?.) or an explicit if/null check instead of forcing assertion.',
        source: 'typescript-ast'
      });
    }

    ts.forEachChild(node, visit);
  }

  try {
    visit(sourceFile);
  } catch (err) {
    console.warn('TS AST visit warning:', err.message);
  }

  // Check for @ts-ignore / @ts-nocheck in comments
  const lines = code.split('\n');
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    if (/@ts-ignore|@ts-nocheck/.test(lineText)) {
      issues.push({
        id: `ts-suppress-${lineNum}`,
        severity: 'medium',
        category: 'quality',
        ruleId: 'ts-no-suppression-comments',
        title: 'TypeScript Error Suppression Directive',
        line: lineNum,
        column: 1,
        endLine: lineNum,
        endColumn: lineText.length,
        message: 'Direct compiler suppression comment (@ts-ignore or @ts-nocheck) found.',
        explanation: 'Suppressing compiler diagnostics masks underlying type bugs and leads to technical debt.',
        risk: 'Hidden runtime errors and false confidence in type safety.',
        suggestion: 'Resolve the root type mismatch rather than suppressing the compiler warning.',
        source: 'typescript-linter'
      });
    }
  });

  // Step 3: Run JavaScript security and vulnerability checks on the code as well
  const jsResults = analyzeJavaScript(code);
  for (const jsIssue of jsResults.issues) {
    // Avoid duplicate syntax errors if TS already reported them
    if (jsIssue.category !== 'syntax' || parseDiagnostics.length === 0) {
      if (!issues.some(i => i.line === jsIssue.line && i.ruleId === jsIssue.ruleId)) {
        issues.push(jsIssue);
      }
    }
  }

  return { isValid, issues };
}

module.exports = {
  analyzeTypeScript
};
