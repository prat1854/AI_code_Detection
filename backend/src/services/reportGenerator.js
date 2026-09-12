/**
 * CodeGuard AI - Report Generation Service
 * Generates JSON, HTML, and Printable Reports.
 */

function generateHtmlReport(analysis) {
  const issues = analysis.issues || [];
  const statusBadge = analysis.status === 'valid'
    ? '<span class="badge badge-success">VALID CODE</span>'
    : '<span class="badge badge-danger">INVALID CODE / SYNTAX ISSUES</span>';

  const issueRows = issues.map((issue, idx) => `
    <tr class="issue-row severity-${issue.severity}">
      <td class="num">${idx + 1}</td>
      <td>
        <span class="badge badge-${issue.severity}">${issue.severity.toUpperCase()}</span>
      </td>
      <td><strong>${issue.category.toUpperCase()}</strong></td>
      <td>Line ${issue.line}${issue.column ? ':' + issue.column : ''}</td>
      <td>
        <div class="issue-title">${issue.title || issue.message}</div>
        <div class="issue-desc">${issue.explanation || ''}</div>
        ${issue.risk ? `<div class="issue-risk"><strong>Risk:</strong> ${issue.risk}</div>` : ''}
        ${issue.suggestion ? `<div class="issue-suggestion"><strong>Suggested Fix:</strong> ${issue.suggestion}</div>` : ''}
      </td>
      <td><span class="source-tag">${issue.source || 'deterministic'}</span></td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CodeGuard AI - Analysis Report (${analysis.id})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      margin: 0;
      padding: 40px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-success { background: #059669; color: #fff; }
    .badge-danger { background: #dc2626; color: #fff; }
    .badge-critical { background: #ef4444; color: #fff; }
    .badge-high { background: #f97316; color: #fff; }
    .badge-medium { background: #eab308; color: #000; }
    .badge-low { background: #3b82f6; color: #fff; }
    .badge-info { background: #64748b; color: #fff; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .metric-card {
      background: #0f172a;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #334155;
    }
    .metric-value {
      font-size: 32px;
      font-weight: 800;
      color: #38bdf8;
    }
    .metric-label {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      text-align: left;
      padding: 12px;
      background: #0f172a;
      border-bottom: 2px solid #334155;
      color: #94a3b8;
      font-size: 13px;
    }
    td {
      padding: 14px 12px;
      border-bottom: 1px solid #334155;
      font-size: 13px;
      vertical-align: top;
    }
    .issue-title { font-weight: 600; color: #f8fafc; font-size: 14px; margin-bottom: 4px; }
    .issue-desc { color: #cbd5e1; margin-bottom: 6px; }
    .issue-risk { color: #f87171; font-size: 12px; margin-bottom: 4px; }
    .issue-suggestion { color: #34d399; font-size: 12px; }
    .source-tag { font-family: monospace; font-size: 11px; background: #334155; padding: 2px 6px; border-radius: 4px; color: #94a3b8; }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #334155;
      padding-top: 16px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { box-shadow: none; padding: 0; }
      .metric-card { background: #f8fafc; border-color: #cbd5e1; }
      .metric-value { color: #0284c7; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="logo">🛡️ CodeGuard AI</div>
        <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Static Analysis & Security Audit Report</div>
      </div>
      <div style="text-align: right;">
        <div>${statusBadge}</div>
        <div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">ID: ${analysis.id}</div>
        <div style="color: #94a3b8; font-size: 12px;">Date: ${new Date(analysis.created_at || analysis.timestamp).toLocaleString()}</div>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${analysis.score || 0} / 100</div>
        <div class="metric-label">Overall Health Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysis.security_score || analysis.securityScore || 0}%</div>
        <div class="metric-label">Security Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysis.quality_score || analysis.qualityScore || 0}%</div>
        <div class="metric-label">Code Quality Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${issues.length}</div>
        <div class="metric-label">Issues Detected</div>
      </div>
    </div>

    <h3>Detected Findings (${issues.length})</h3>
    ${issues.length === 0 ? '<p style="color: #10b981;">No issues detected. Code satisfies static safety rules.</p>' : `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Severity</th>
          <th>Category</th>
          <th>Location</th>
          <th>Description & Remediation</th>
          <th>Detector</th>
        </tr>
      </thead>
      <tbody>
        ${issueRows}
      </tbody>
    </table>`}

    <div class="footer">
      Generated automatically by CodeGuard AI — Deterministic Static Verification & AI Remediation Platform.
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateHtmlReport
};
