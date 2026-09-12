/**
 * CodeGuard AI - Metrics and Scoring Engine
 * Computes Cyclomatic Complexity, Nesting Depth, SLOC, Maintainability Index,
 * and component scores (Overall, Security, Quality, Complexity).
 */

function calculateMetrics(code, language, issues) {
  const lines = code.split('\n');
  const totalLines = lines.length;
  let blankLines = 0;
  let commentLines = 0;
  let maxNestingDepth = 0;
  let currentNesting = 0;

  // Regex patterns for branches (cyclomatic complexity)
  const branchPatterns = {
    javascript: /\b(if|else\s+if|for|while|case|catch|\?|&&|\|\|)\b/g,
    typescript: /\b(if|else\s+if|for|while|case|catch|\?|&&|\|\|)\b/g,
    python: /\b(if|elif|for|while|except|and|or)\b/g,
    java: /\b(if|else\s+if|for|while|case|catch|\?|&&|\|\|)\b/g,
    cpp: /\b(if|else\s+if|for|while|case|catch|\?|&&|\|\|)\b/g,
    go: /\b(if|else\s+if|for|case|select|&&|\|\|)\b/g
  };

  const branchRegex = branchPatterns[language] || branchPatterns.javascript;
  let cyclomaticComplexity = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blankLines++;
      continue;
    }

    // Comment detection
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*')
    ) {
      commentLines++;
      continue;
    }

    // Branch matching
    const matches = trimmed.match(branchRegex);
    if (matches) {
      cyclomaticComplexity += matches.length;
    }

    // Nesting depth calculation
    if (language === 'python') {
      const leadingSpaces = line.search(/\S/);
      if (leadingSpaces > 0) {
        const indentLevel = Math.floor(leadingSpaces / 4);
        if (indentLevel > maxNestingDepth) maxNestingDepth = indentLevel;
      }
    } else {
      for (const char of trimmed) {
        if (char === '{' || char === '(') {
          currentNesting++;
          if (currentNesting > maxNestingDepth) maxNestingDepth = currentNesting;
        } else if (char === '}' || char === ')') {
          currentNesting = Math.max(0, currentNesting - 1);
        }
      }
    }
  }

  const codeLines = Math.max(1, totalLines - blankLines - commentLines);

  // Maintainability Index (simplified standard formula)
  // MI = 171 - 5.2 * ln(Halstead Volume approx) - 0.23 * Cyclomatic - 16.2 * ln(LOC)
  const approxVolume = codeLines * 12;
  const rawMI = 171 - (5.2 * Math.log(approxVolume)) - (0.23 * cyclomaticComplexity) - (16.2 * Math.log(codeLines));
  const maintainabilityIndex = Math.max(0, Math.min(100, Math.round((rawMI * 100) / 171)));

  // Calculate issue counts by severity and category
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };

  const categoryCounts = {
    syntax: 0,
    bugs: 0,
    security: 0,
    quality: 0,
    performance: 0
  };

  for (const issue of issues) {
    const sev = (issue.severity || 'low').toLowerCase();
    const cat = (issue.category || 'quality').toLowerCase();
    if (severityCounts[sev] !== undefined) severityCounts[sev]++;
    if (categoryCounts[cat] !== undefined) categoryCounts[cat]++;
  }

  // Security score calculation (out of 100)
  // Deductions: Critical -35, High -20, Medium -10, Low -3
  let securityScore = 100;
  for (const issue of issues) {
    if (issue.category === 'security') {
      if (issue.severity === 'critical') securityScore -= 35;
      else if (issue.severity === 'high') securityScore -= 20;
      else if (issue.severity === 'medium') securityScore -= 10;
      else securityScore -= 3;
    }
  }
  securityScore = Math.max(0, Math.min(100, securityScore));

  // Quality score calculation (out of 100)
  let qualityScore = Math.min(100, maintainabilityIndex);
  for (const issue of issues) {
    if (issue.category === 'quality' || issue.category === 'bugs' || issue.category === 'performance') {
      if (issue.severity === 'critical') qualityScore -= 20;
      else if (issue.severity === 'high') qualityScore -= 12;
      else if (issue.severity === 'medium') qualityScore -= 6;
      else qualityScore -= 2;
    }
  }
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  // Complexity score (100 is best/simple, lower is complex)
  let complexityScore = 100 - (cyclomaticComplexity * 2.5) - (maxNestingDepth * 5);
  complexityScore = Math.max(10, Math.min(100, Math.round(complexityScore)));

  // Overall score: Weighted combination
  // If syntax errors exist, overall score is strictly capped at 40
  const hasSyntaxErrors = categoryCounts.syntax > 0 || severityCounts.critical > 0;
  let overallScore = Math.round(
    (securityScore * 0.45) + (qualityScore * 0.35) + (complexityScore * 0.20)
  );

  if (categoryCounts.syntax > 0) {
    overallScore = Math.min(35, overallScore);
  } else if (severityCounts.critical > 0) {
    overallScore = Math.min(50, overallScore);
  }

  return {
    linesOfCode: totalLines,
    codeLines,
    blankLines,
    commentLines,
    cyclomaticComplexity,
    maxNestingDepth,
    maintainabilityIndex,
    overallScore: Math.max(0, Math.min(100, overallScore)),
    securityScore,
    qualityScore,
    complexityScore,
    severityCounts,
    categoryCounts
  };
}

module.exports = {
  calculateMetrics
};
