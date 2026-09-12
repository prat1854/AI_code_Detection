const test = require('node:test');
const assert = require('node:assert');
const { app } = require('../src/server');
const db = require('../src/database');

let server;
let baseUrl;

test.before(async () => {
  await db.initDatabase();
  await new Promise(resolve => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

test('Integration: GET /api/health returns healthy', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'healthy');
});

test('Integration: GET /api/analysis/samples returns all 6 languages', async () => {
  const res = await fetch(`${baseUrl}/api/analysis/samples`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.samples.javascript);
  assert.ok(data.samples.typescript);
  assert.ok(data.samples.python);
  assert.ok(data.samples.java);
  assert.ok(data.samples.cpp);
  assert.ok(data.samples.go);
});

test('Integration: 1-Click Demo Login & Token Issuance', async () => {
  const res = await fetch(`${baseUrl}/api/auth/demo`, { method: 'POST' });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  assert.strictEqual(data.user.name, 'Demo Engineer');
});

test('Integration: End-to-End Analysis, Explain, Fix, and Report Flow', async () => {
  // 1. Submit Code for Analysis
  const sampleCode = `
    const express = require('express');
    const query = "SELECT * FROM users WHERE id=" + req.query.id;
    eval("console.log(query)");
  `;
  const analyzeRes = await fetch(`${baseUrl}/api/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: sampleCode, language: 'javascript' })
  });

  assert.strictEqual(analyzeRes.status, 201);
  const analysis = await analyzeRes.json();
  assert.ok(analysis.id);
  assert.strictEqual(analysis.status, 'valid');
  assert.ok(analysis.issues.length >= 2);

  // 2. Request AI Explanation
  const explainRes = await fetch(`${baseUrl}/api/analysis/${analysis.id}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issueId: analysis.issues[0].id })
  });
  assert.strictEqual(explainRes.status, 200);
  const explanation = await explainRes.json();
  assert.ok(explanation.whatIsWrong);
  assert.ok(explanation.whyItMatters);
  assert.ok(explanation.suggestedFix);

  // 3. Request AI Fix
  const fixRes = await fetch(`${baseUrl}/api/analysis/${analysis.id}/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issueId: analysis.issues[0].id })
  });
  assert.strictEqual(fixRes.status, 200);
  const fix = await fixRes.json();
  assert.ok(fix.fixedCode);
  assert.ok(fix.diffSummary);

  // 4. Download HTML Report
  const reportRes = await fetch(`${baseUrl}/api/reports/${analysis.id}/html`);
  assert.strictEqual(reportRes.status, 200);
  const html = await reportRes.text();
  assert.ok(html.includes('CodeGuard AI'));
  assert.ok(html.includes(analysis.id));

  // 5. Check History
  const historyRes = await fetch(`${baseUrl}/api/analysis/history`);
  assert.strictEqual(historyRes.status, 200);
  const history = await historyRes.json();
  assert.ok(history.analyses.some(a => a.id === analysis.id));

  // 6. Check Analytics
  const analyticsRes = await fetch(`${baseUrl}/api/analysis/analytics`);
  assert.strictEqual(analyticsRes.status, 200);
  const analytics = await analyticsRes.json();
  assert.ok(analytics.totalAnalyses >= 1);
});
