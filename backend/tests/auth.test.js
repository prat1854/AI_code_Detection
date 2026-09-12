const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../src/config');
const db = require('../src/database');

test('Authentication - Password Hashing and JWT Token Verification', async () => {
  const password = 'SecureDevPassword2026!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const isValid = await bcrypt.compare(password, hash);
  assert.strictEqual(isValid, true);

  const token = jwt.sign(
    { id: 'usr_test_123', email: 'test@codeguard.dev', role: 'developer' },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const decoded = jwt.verify(token, config.jwtSecret);
  assert.strictEqual(decoded.id, 'usr_test_123');
  assert.strictEqual(decoded.email, 'test@codeguard.dev');
});

test('Database Operations - Save & Retrieve Analysis', async () => {
  await db.initDatabase();

  const mockAnalysis = {
    id: 'anl_unit_test_999',
    language: 'javascript',
    status: 'valid',
    score: 85,
    securityScore: 90,
    qualityScore: 80,
    complexityScore: 85,
    rawCode: 'console.log("unit test");',
    metrics: { linesOfCode: 1, cyclomaticComplexity: 1 },
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    categoryCounts: { syntax: 0, bugs: 0, security: 0, quality: 0, performance: 0 }
  };

  await db.saveAnalysis(mockAnalysis, []);
  const retrieved = await db.getAnalysisById('anl_unit_test_999');

  assert.ok(retrieved, 'Should retrieve saved analysis');
  assert.strictEqual(retrieved.id, 'anl_unit_test_999');
  assert.strictEqual(retrieved.status, 'valid');
  assert.strictEqual(retrieved.score, 85);
});
