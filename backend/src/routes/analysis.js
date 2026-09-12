/**
 * CodeGuard AI - Analysis Orchestration Routes
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const db = require('../database');
const { optionalAuthToken } = require('../middleware/auth');
const { runDeterministicAnalysis, normalizeLanguage } = require('../analysis/manager');
const { SAMPLE_CODES } = require('../analysis/samples');
const aiClient = require('../services/aiClient');

// Get Curated Sample Codes
router.get('/samples', (req, res) => {
  res.json({ samples: SAMPLE_CODES });
});

// Get Analytics Summary
router.get('/analytics', optionalAuthToken, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const summary = await db.getAnalyticsSummary(userId);
    res.json(summary);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// Get Analysis History
router.get('/history', optionalAuthToken, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { language, status, limit } = req.query;

    const list = await db.getAnalysesHistory(userId, parseInt(limit || '50', 10), {
      language,
      status
    });

    res.json({ analyses: list });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// Run Code Analysis
router.post('/', optionalAuthToken, async (req, res) => {
  try {
    const { code, language, fileName, projectId } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Validation Error', message: 'Code string is required.' });
    }

    if (Buffer.byteLength(code, 'utf8') > config.maxCodeLengthBytes) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Code exceeds maximum allowed size (${config.maxCodeLengthBytes / 1024} KB).`
      });
    }

    const normalizedLang = normalizeLanguage(language || 'javascript');

    // Deterministic Multi-Tier Static Analysis
    const analysisResult = runDeterministicAnalysis(code, normalizedLang, fileName || `code.${normalizedLang}`);

    const analysisId = `anl_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const userId = req.user ? req.user.id : null;

    const record = {
      id: analysisId,
      userId,
      projectId: projectId || null,
      language: analysisResult.language,
      status: analysisResult.status,
      score: analysisResult.score,
      securityScore: analysisResult.securityScore,
      qualityScore: analysisResult.qualityScore,
      complexityScore: analysisResult.complexityScore,
      rawCode: code,
      metrics: analysisResult.metrics,
      severityCounts: analysisResult.severityCounts,
      categoryCounts: analysisResult.categoryCounts
    };

    await db.saveAnalysis(record, analysisResult.issues);

    res.status(201).json({
      id: analysisId,
      ...analysisResult,
      rawCode: code
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis Failed', message: err.message });
  }
});

// Get Single Analysis Details
router.get('/:id', async (req, res) => {
  try {
    const analysis = await db.getAnalysisById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Analysis record not found.' });
    }
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// AI Explanation for Issue
router.post('/:id/explain', async (req, res) => {
  try {
    const { issueId } = req.body;
    const analysis = await db.getAnalysisById(req.params.id);

    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Analysis not found.' });
    }

    const issue = analysis.issues?.find(i => i.id === issueId) || analysis.issues?.[0];
    if (!issue) {
      return res.status(404).json({ error: 'Not Found', message: 'Specified issue not found.' });
    }

    const explanation = await aiClient.explainIssue({
      code: analysis.raw_code || analysis.rawCode,
      language: analysis.language,
      issue
    });

    res.json(explanation);
  } catch (err) {
    console.error('Explain error:', err);
    res.status(500).json({ error: 'Explanation Failed', message: err.message });
  }
});

// AI Fix Generation
router.post('/:id/fix', async (req, res) => {
  try {
    const { issueId } = req.body;
    const analysis = await db.getAnalysisById(req.params.id);

    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Analysis not found.' });
    }

    const issue = issueId ? analysis.issues?.find(i => i.id === issueId) : analysis.issues?.[0];
    const rawCode = analysis.raw_code || analysis.rawCode;

    const fixResult = await aiClient.generateFix({
      code: rawCode,
      language: analysis.language,
      issue
    });

    const fixId = `fix_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    await db.saveFix({
      id: fixId,
      analysisId: analysis.id,
      issueId: issue?.id || null,
      originalCode: rawCode,
      fixedCode: fixResult.fixedCode,
      diffSummary: fixResult.diffSummary,
      status: 'generated'
    });

    res.json({
      fixId,
      originalCode: rawCode,
      fixedCode: fixResult.fixedCode,
      diffSummary: fixResult.diffSummary,
      explanation: fixResult.explanation,
      confidence: fixResult.confidence
    });
  } catch (err) {
    console.error('Fix generation error:', err);
    res.status(500).json({ error: 'Fix Generation Failed', message: err.message });
  }
});

// AI Qualitative Code Review
router.post('/:id/review', async (req, res) => {
  try {
    const analysis = await db.getAnalysisById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Analysis not found.' });
    }

    const review = await aiClient.reviewCode({
      code: analysis.raw_code || analysis.rawCode,
      language: analysis.language,
      issues: analysis.issues,
      metrics: analysis.metrics
    });

    res.json(review);
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Review Failed', message: err.message });
  }
});

module.exports = router;
