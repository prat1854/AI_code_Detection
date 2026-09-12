const test = require('node:test');
const assert = require('node:assert');
const { runDeterministicAnalysis } = require('../src/analysis/manager');

// 1. JavaScript Suite
test('JavaScript: 1) Valid, 2) Invalid Syntax, 3) Security, 4) Code Quality', () => {
  // 1. Valid
  const valid = runDeterministicAnalysis('function add(a, b) { return a + b; }', 'javascript');
  assert.strictEqual(valid.status, 'valid');
  assert.strictEqual(valid.isValid, true);

  // 2. Invalid syntax
  const invalid = runDeterministicAnalysis('const x = (;', 'javascript');
  assert.strictEqual(invalid.status, 'invalid');
  assert.strictEqual(invalid.isValid, false);
  assert.ok(invalid.issues.some(i => i.category === 'syntax'));

  // 3. Security (SQLi & XSS)
  const sec = runDeterministicAnalysis('const q = "SELECT * FROM users WHERE id=" + id; element.innerHTML = userInput;', 'javascript');
  assert.ok(sec.issues.some(i => i.category === 'security' && i.severity === 'critical'));
  assert.ok(sec.issues.some(i => i.ruleId.includes('xss') || i.ruleId.includes('sql')));

  // 4. Code quality (loose equality, debugger)
  const quality = runDeterministicAnalysis('if (a == b) { debugger; }', 'javascript');
  assert.ok(quality.issues.some(i => i.ruleId === 'quality-require-strict-equality' || i.ruleId === 'quality-no-debugger'));
});

// 2. TypeScript Suite
test('TypeScript: 1) Valid, 2) Invalid Syntax, 3) Security, 4) Code Quality', () => {
  // 1. Valid
  const valid = runDeterministicAnalysis('interface User { id: number; name: string; } const u: User = { id: 1, name: "Alice" };', 'typescript');
  assert.strictEqual(valid.status, 'valid');

  // 2. Invalid syntax
  const invalid = runDeterministicAnalysis('const x: number = ;', 'typescript');
  assert.strictEqual(invalid.status, 'invalid');
  assert.ok(invalid.issues.some(i => i.category === 'syntax'));

  // 3. Security
  const sec = runDeterministicAnalysis('const query = `SELECT * FROM users WHERE id=${id}`;', 'typescript');
  assert.ok(sec.issues.some(i => i.category === 'security'));

  // 4. Code quality ('any' type & suppression)
  const quality = runDeterministicAnalysis('let data: any = 123; // @ts-ignore\nconst b = data!.val;', 'typescript');
  assert.ok(quality.issues.some(i => i.ruleId === 'ts-no-explicit-any' || i.ruleId === 'ts-no-suppression-comments'));
});

// 3. Python Suite
test('Python: 1) Valid, 2) Invalid Syntax, 3) Security, 4) Code Quality', () => {
  // 1. Valid
  const valid = runDeterministicAnalysis('def calculate(x, y):\n    return x + y\n', 'python');
  assert.strictEqual(valid.status, 'valid');

  // 2. Invalid syntax
  const invalid = runDeterministicAnalysis('def broken(\n   return 1', 'python');
  assert.strictEqual(invalid.status, 'invalid');

  // 3. Security (pickle / eval / sql)
  const sec = runDeterministicAnalysis('import pickle\nuser = pickle.loads(raw_data)', 'python');
  assert.ok(sec.issues.some(i => i.ruleId === 'python-insecure-deserialization'));

  // 4. Code quality (mutable default arg & bare except)
  const quality = runDeterministicAnalysis('def foo(bar=[]):\n    try:\n        pass\n    except:\n        pass', 'python');
  assert.ok(quality.issues.some(i => i.ruleId === 'python-mutable-default-arg' || i.ruleId === 'python-bare-except'));
});

// 4. Java Suite
test('Java: 1) Valid, 2) Invalid Syntax, 3) Security, 4) Code Quality', () => {
  // 1. Valid
  const validCode = 'public class MathUtils { public static int sum(int a, int b) { return a + b; } }';
  const valid = runDeterministicAnalysis(validCode, 'java');
  assert.strictEqual(valid.status, 'valid');

  // 2. Invalid syntax (unbalanced braces)
  const invalidCode = 'public class Broken { public void run() { ';
  const invalid = runDeterministicAnalysis(invalidCode, 'java');
  assert.strictEqual(invalid.status, 'invalid');

  // 3. Security (SQLi & Runtime.exec)
  const secCode = 'public class Sec { void query(Statement stmt, String id) { stmt.executeQuery("SELECT * FROM users WHERE id=" + id); } }';
  const sec = runDeterministicAnalysis(secCode, 'java');
  assert.ok(sec.issues.some(i => i.ruleId === 'java-sql-injection'));

  // 4. Code quality (empty catch)
  const qualCode = 'public class Qual { void run() { try {} catch (Exception e) {} } }';
  const qual = runDeterministicAnalysis(qualCode, 'java');
  assert.ok(qual.issues.some(i => i.ruleId === 'java-empty-catch-block'));
});

// 5. C++ Suite
test('C++: 1) Valid, 2) Invalid Syntax, 3) Security, 4) Code Quality', () => {
  // 1. Valid
  const validCode = '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }';
  const valid = runDeterministicAnalysis(validCode, 'cpp');
  assert.strictEqual(valid.status, 'valid');

  // 2. Invalid syntax (unbalanced)
  const invalidCode = 'int main() { if (true) { return 0; ';
  const invalid = runDeterministicAnalysis(invalidCode, 'cpp');
  assert.strictEqual(invalid.status, 'invalid');

  // 3. Security (gets, strcpy, format string)
  const secCode = 'void foo() { char buf[32]; gets(buf); printf(buf); }';
  const sec = runDeterministicAnalysis(secCode, 'cpp');
  assert.ok(sec.issues.some(i => i.ruleId === 'cpp-banned-gets' || i.ruleId === 'cpp-format-string-vulnerability'));

  // 4. Code quality (raw new memory leak)
  const qualCode = 'void leak() { int* x = new int[100]; }';
  const qual = runDeterministicAnalysis(qualCode, 'cpp');
  assert.ok(qual.issues.some(i => i.ruleId === 'cpp-potential-memory-leak'));
});

// 6. Go Suite
test('Go: 1) Valid, 2) Invalid Syntax, 3) Security, 4) Code Quality', () => {
  // 1. Valid
  const validCode = 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("ok")\n}';
  const valid = runDeterministicAnalysis(validCode, 'go');
  assert.strictEqual(valid.status, 'valid');

  // 2. Invalid syntax (missing package or unbalanced braces)
  const invalidCode = 'func main() { fmt.Println("missing package") }';
  const invalid = runDeterministicAnalysis(invalidCode, 'go');
  assert.strictEqual(invalid.status, 'invalid');

  // 3. Security (SQLi & Command injection)
  const secCode = 'package main\nimport ("database/sql"; "fmt")\nfunc q(db *sql.DB, id string) {\n\tquery := fmt.Sprintf("SELECT * FROM users WHERE id=%s", id)\n\tdb.Query(query)\n}';
  const sec = runDeterministicAnalysis(secCode, 'go');
  assert.ok(sec.issues.some(i => i.ruleId === 'go-sql-injection'));

  // 4. Code quality (discarded error return)
  const qualCode = 'package main\nfunc run() {\n\tval, _ := compute()\n}';
  const qual = runDeterministicAnalysis(qualCode, 'go');
  assert.ok(qual.issues.some(i => i.ruleId === 'go-discarded-error'));
});
