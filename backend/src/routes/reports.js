/**
 * CodeGuard AI - Report Export Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateHtmlReport } = require('../services/reportGenerator');

// Get Report (JSON or HTML via format query / accept header)
router.get('/:id', async (req, res) => {
  try {
    const analysis = await db.getAnalysisById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Analysis not found.' });
    }

    const format = (req.query.format || '').toLowerCase();
    if (format === 'html' || req.headers.accept?.includes('text/html')) {
      const html = generateHtmlReport(analysis);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    res.json({
      reportId: `rep_${analysis.id}`,
      analysisId: analysis.id,
      generatedAt: new Date().toISOString(),
      report: analysis
    });
  } catch (err) {
    res.status(500).json({ error: 'Report Generation Failed', message: err.message });
  }
});

// Download HTML Report
router.get('/:id/html', async (req, res) => {
  try {
    const analysis = await db.getAnalysisById(req.params.id);
    if (!analysis) {
      return res.status(404).send('Analysis not found.');
    }

    const html = generateHtmlReport(analysis);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="codeguard-report-${analysis.id}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).send('Error generating HTML report: ' + err.message);
  }
});

// Download JSON Report
router.get('/:id/json', async (req, res) => {
  try {
    const analysis = await db.getAnalysisById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Analysis not found.' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="codeguard-report-${analysis.id}.json"`);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Error generating JSON report', message: err.message });
  }
});

module.exports = router;
