/**
 * CodeGuard AI - Unified Database Layer
 * Connects to PostgreSQL in production/Docker, with an embedded persistence
 * engine fallback for standalone local development without PostgreSQL.
 */

const { Pool } = require('pg');
const config = require('../config');
const { SCHEMA_SQL } = require('./migrations');
const fs = require('fs');
const path = require('path');

let pool = null;
let isPgConnected = false;

// Embedded Fallback Store
const fallbackStore = {
  users: new Map(),
  projects: new Map(),
  analyses: new Map(),
  issues: new Map(),
  ai_reviews: new Map(),
  fixes: new Map(),
  reports: new Map()
};

const storageFilePath = path.resolve(__dirname, '../../data/storage.json');

function loadLocalBackup() {
  try {
    if (fs.existsSync(storageFilePath)) {
      const data = JSON.parse(fs.readFileSync(storageFilePath, 'utf8'));
      for (const key of Object.keys(fallbackStore)) {
        if (data[key]) {
          fallbackStore[key] = new Map(Object.entries(data[key]));
        }
      }
    }
  } catch (err) {
    console.warn('Could not load local storage backup:', err.message);
  }
}

function persistLocalBackup() {
  try {
    const dir = path.dirname(storageFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const obj = {};
    for (const [key, map] of Object.entries(fallbackStore)) {
      obj[key] = Object.fromEntries(map);
    }
    fs.writeFileSync(storageFilePath, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not persist local storage backup:', err.message);
  }
}

async function initDatabase() {
  loadLocalBackup();

  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 2000
    });

    const client = await pool.connect();
    await client.query(SCHEMA_SQL);
    client.release();
    isPgConnected = true;
    console.log('✓ PostgreSQL connected and migrations applied successfully.');
  } catch (err) {
    isPgConnected = false;
    console.log(`ℹ PostgreSQL not detected (${err.message}). Using local embedded storage.`);
  }
}

// User Operations
async function createUser(user) {
  if (isPgConnected) {
    const query = `
      INSERT INTO users (id, email, password_hash, name, role, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, email, name, role, created_at
    `;
    const res = await pool.query(query, [user.id, user.email, user.passwordHash, user.name, user.role || 'developer']);
    return res.rows[0];
  } else {
    fallbackStore.users.set(user.id, {
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      name: user.name,
      role: user.role || 'developer',
      created_at: new Date().toISOString()
    });
    persistLocalBackup();
    const u = fallbackStore.users.get(user.id);
    return { id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.created_at };
  }
}

async function getUserByEmail(email) {
  if (isPgConnected) {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return res.rows[0] || null;
  } else {
    for (const u of fallbackStore.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }
}

async function getUserById(id) {
  if (isPgConnected) {
    const res = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  } else {
    const u = fallbackStore.users.get(id);
    if (!u) return null;
    return { id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.created_at };
  }
}

// Analysis Operations
async function saveAnalysis(analysis, issuesList = []) {
  if (isPgConnected) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertAnalysis = `
        INSERT INTO analyses (
          id, user_id, project_id, language, status, score,
          security_score, quality_score, complexity_score, raw_code,
          metrics, severity_counts, category_counts, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING *
      `;
      const res = await client.query(insertAnalysis, [
        analysis.id,
        analysis.userId || null,
        analysis.projectId || null,
        analysis.language,
        analysis.status,
        analysis.score,
        analysis.securityScore,
        analysis.qualityScore,
        analysis.complexityScore,
        analysis.rawCode,
        JSON.stringify(analysis.metrics || {}),
        JSON.stringify(analysis.severityCounts || {}),
        JSON.stringify(analysis.categoryCounts || {})
      ]);

      for (const issue of issuesList) {
        const insertIssue = `
          INSERT INTO issues (
            id, analysis_id, severity, category, rule_id, title,
            line, column_num, end_line, end_column, message, explanation, risk, suggestion, source, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        `;
        await client.query(insertIssue, [
          issue.id,
          analysis.id,
          issue.severity,
          issue.category,
          issue.ruleId,
          issue.title,
          issue.line,
          issue.column || 1,
          issue.endLine || issue.line,
          issue.endColumn || 1,
          issue.message,
          issue.explanation || '',
          issue.risk || '',
          issue.suggestion || '',
          issue.source || 'deterministic'
        ]);
      }

      await client.query('COMMIT');
      return res.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    fallbackStore.analyses.set(analysis.id, {
      ...analysis,
      created_at: new Date().toISOString()
    });

    for (const issue of issuesList) {
      fallbackStore.issues.set(issue.id, {
        ...issue,
        analysis_id: analysis.id,
        column_num: issue.column || 1,
        created_at: new Date().toISOString()
      });
    }

    persistLocalBackup();
    return fallbackStore.analyses.get(analysis.id);
  }
}

async function getAnalysisById(id) {
  if (isPgConnected) {
    const analysisRes = await pool.query('SELECT * FROM analyses WHERE id = $1', [id]);
    if (analysisRes.rows.length === 0) return null;
    const analysis = analysisRes.rows[0];

    const issuesRes = await pool.query('SELECT * FROM issues WHERE analysis_id = $1 ORDER BY line ASC', [id]);
    const fixesRes = await pool.query('SELECT * FROM fixes WHERE analysis_id = $1', [id]);

    return {
      ...analysis,
      column: undefined,
      issues: issuesRes.rows.map(i => ({
        ...i,
        column: i.column_num,
        ruleId: i.rule_id,
        endLine: i.end_line,
        endColumn: i.end_column
      })),
      fixes: fixesRes.rows
    };
  } else {
    const analysis = fallbackStore.analyses.get(id);
    if (!analysis) return null;

    const issues = [];
    for (const issue of fallbackStore.issues.values()) {
      if (issue.analysis_id === id) {
        issues.push({
          ...issue,
          column: issue.column_num || issue.column,
          ruleId: issue.rule_id || issue.ruleId
        });
      }
    }

    const fixes = [];
    for (const fix of fallbackStore.fixes.values()) {
      if (fix.analysis_id === id) fixes.push(fix);
    }

    return {
      ...analysis,
      issues,
      fixes
    };
  }
}

async function getAnalysesHistory(userId = null, limit = 50, filters = {}) {
  let list = [];

  if (isPgConnected) {
    let query = 'SELECT * FROM analyses WHERE 1=1';
    const params = [];

    if (userId) {
      params.push(userId);
      query += ` AND (user_id = $${params.length} OR user_id IS NULL)`;
    }
    if (filters.language) {
      params.push(filters.language.toLowerCase());
      query += ` AND language = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status.toLowerCase());
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await pool.query(query, params);
    list = res.rows;
  } else {
    list = Array.from(fallbackStore.analyses.values());
    if (userId) {
      list = list.filter(a => a.userId === userId || !a.userId || a.user_id === userId);
    }
    if (filters.language) {
      list = list.filter(a => a.language.toLowerCase() === filters.language.toLowerCase());
    }
    if (filters.status) {
      list = list.filter(a => a.status.toLowerCase() === filters.status.toLowerCase());
    }
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    list = list.slice(0, limit);
  }

  return list;
}

// Fix Operations
async function saveFix(fix) {
  if (isPgConnected) {
    const query = `
      INSERT INTO fixes (id, analysis_id, issue_id, original_code, fixed_code, diff_summary, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const res = await pool.query(query, [
      fix.id, fix.analysisId, fix.issueId || null, fix.originalCode, fix.fixedCode, fix.diffSummary || '', fix.status || 'applied'
    ]);
    return res.rows[0];
  } else {
    fallbackStore.fixes.set(fix.id, {
      ...fix,
      analysis_id: fix.analysisId,
      issue_id: fix.issueId,
      original_code: fix.originalCode,
      fixed_code: fix.fixedCode,
      diff_summary: fix.diffSummary,
      created_at: new Date().toISOString()
    });
    persistLocalBackup();
    return fallbackStore.fixes.get(fix.id);
  }
}

// Analytics Aggregation
async function getAnalyticsSummary(userId = null) {
  const history = await getAnalysesHistory(userId, 500);

  const totalAnalyses = history.length;
  let validCount = 0;
  let invalidCount = 0;
  const languageDistribution = {};
  const severityTotals = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const categoryTotals = { syntax: 0, bugs: 0, security: 0, quality: 0, performance: 0 };

  history.forEach(item => {
    if (item.status === 'valid') validCount++;
    else invalidCount++;

    const lang = item.language || 'unknown';
    languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;

    const sev = item.severity_counts || item.severityCounts || {};
    for (const [k, v] of Object.entries(sev)) {
      if (severityTotals[k] !== undefined) severityTotals[k] += Number(v) || 0;
    }

    const cat = item.category_counts || item.categoryCounts || {};
    for (const [k, v] of Object.entries(cat)) {
      if (categoryTotals[k] !== undefined) categoryTotals[k] += Number(v) || 0;
    }
  });

  return {
    totalAnalyses,
    validCount,
    invalidCount,
    languageDistribution,
    severityTotals,
    categoryTotals,
    recentAnalyses: history.slice(0, 5)
  };
}

module.exports = {
  initDatabase,
  createUser,
  getUserByEmail,
  getUserById,
  saveAnalysis,
  getAnalysisById,
  getAnalysesHistory,
  saveFix,
  getAnalyticsSummary
};
