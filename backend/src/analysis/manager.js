/**
 * CodeGuard AI - Unified Deterministic Analysis Manager
 * Coordinates language-specific static analysis, syntax validation,
 * and metric computation.
 */

const { analyzeJavaScript } = require('./languages/javascript');
const { analyzeTypeScript } = require('./languages/typescript');
const { analyzePython } = require('./languages/python');
const { analyzeJava } = require('./languages/java');
const { analyzeCpp } = require('./languages/cpp');
const { analyzeGo } = require('./languages/go');
const { calculateMetrics } = require('./metrics');

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go'];

function normalizeLanguage(lang) {
  if (!lang) return 'javascript';
  const clean = lang.toLowerCase().trim();
  if (clean === 'js' || clean === 'node') return 'javascript';
  if (clean === 'ts') return 'typescript';
  if (clean === 'py') return 'python';
  if (clean === 'c++' || clean === 'c' || clean === 'cc') return 'cpp';
  if (clean === 'golang') return 'go';
  return clean;
}

function runDeterministicAnalysis(code, rawLanguage = 'javascript', fileName = 'code.txt') {
  const language = normalizeLanguage(rawLanguage);

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported language "${rawLanguage}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
  }

  let analysisResult;
  switch (language) {
    case 'javascript':
      analysisResult = analyzeJavaScript(code);
      break;
    case 'typescript':
      analysisResult = analyzeTypeScript(code);
      break;
    case 'python':
      analysisResult = analyzePython(code);
      break;
    case 'java':
      analysisResult = analyzeJava(code);
      break;
    case 'cpp':
      analysisResult = analyzeCpp(code);
      break;
    case 'go':
      analysisResult = analyzeGo(code);
      break;
    default:
      analysisResult = analyzeJavaScript(code);
  }

  const { isValid, issues } = analysisResult;

  // Add file attribute to every issue
  issues.forEach(issue => {
    issue.file = fileName;
  });

  // Calculate detailed complexity, maintainability, and security metrics
  const metrics = calculateMetrics(code, language, issues);

  // Status is strictly "valid" or "invalid" based on deterministic compiler/parser checks
  const status = isValid ? 'valid' : 'invalid';

  return {
    status,
    isValid,
    language,
    fileName,
    score: metrics.overallScore,
    securityScore: metrics.securityScore,
    qualityScore: metrics.qualityScore,
    complexityScore: metrics.complexityScore,
    metrics: {
      linesOfCode: metrics.linesOfCode,
      codeLines: metrics.codeLines,
      blankLines: metrics.blankLines,
      commentLines: metrics.commentLines,
      cyclomaticComplexity: metrics.cyclomaticComplexity,
      maxNestingDepth: metrics.maxNestingDepth,
      maintainabilityIndex: metrics.maintainabilityIndex
    },
    severityCounts: metrics.severityCounts,
    categoryCounts: metrics.categoryCounts,
    issuesCount: issues.length,
    issues,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  runDeterministicAnalysis,
  normalizeLanguage,
  SUPPORTED_LANGUAGES
};
