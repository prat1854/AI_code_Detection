const test = require('node:test');
const assert = require('node:assert');
const { runDeterministicAnalysis } = require('../src/analysis/manager');
const { SAMPLE_CODES } = require('../src/analysis/samples');

test('Deterministic Analysis - JavaScript SQL Injection & Syntax', () => {
  const result = runDeterministicAnalysis(SAMPLE_CODES.javascript.code, 'javascript');
  assert.strictEqual(result.status, 'valid');
  assert.ok(result.issues.length >= 3);
  const sqli = result.issues.find(i => i.ruleId === 'security-sql-injection');
  assert.ok(sqli, 'Should detect SQL injection in JavaScript sample');
  assert.strictEqual(sqli.severity, 'critical');
  assert.strictEqual(sqli.category, 'security');

  const xss = result.issues.find(i => i.ruleId === 'security-xss-innerhtml');
  assert.ok(xss, 'Should detect XSS in JavaScript sample');
});

test('Deterministic Analysis - JavaScript Broken Syntax is strictly INVALID', () => {
  const brokenCode = 'function broken( { const x = ;';
  const result = runDeterministicAnalysis(brokenCode, 'javascript');
  assert.strictEqual(result.status, 'invalid');
  assert.strictEqual(result.isValid, false);
  assert.ok(result.issues.some(i => i.category === 'syntax'));
  assert.ok(result.score <= 35, 'Invalid syntax score must be heavily penalized');
});

test('Deterministic Analysis - TypeScript Type Safety & Any Keyword', () => {
  const result = runDeterministicAnalysis(SAMPLE_CODES.typescript.code, 'typescript');
  assert.strictEqual(result.status, 'valid');
  assert.ok(result.issues.some(i => i.ruleId === 'ts-no-explicit-any'));
});

test('Deterministic Analysis - Python Security Patterns', () => {
  const result = runDeterministicAnalysis(SAMPLE_CODES.python.code, 'python');
  assert.ok(result.issues.some(i => i.ruleId === 'python-sql-injection'));
});

test('Deterministic Analysis - C++ Buffer Overflow (gets/strcpy)', () => {
  const result = runDeterministicAnalysis(SAMPLE_CODES.cpp.code, 'cpp');
  assert.ok(result.issues.some(i => i.ruleId === 'cpp-banned-gets'));
  assert.ok(result.issues.some(i => i.ruleId === 'cpp-format-string-vulnerability'));
});

test('Deterministic Analysis - Go SQLi and Missing Package', () => {
  const validGo = runDeterministicAnalysis(SAMPLE_CODES.go.code, 'go');
  assert.ok(validGo.issues.some(i => i.ruleId === 'go-sql-injection'));

  const brokenGo = runDeterministicAnalysis('func main() {}', 'go');
  assert.strictEqual(brokenGo.status, 'invalid');
  assert.ok(brokenGo.issues.some(i => i.ruleId === 'go-missing-package-declaration'));
});
