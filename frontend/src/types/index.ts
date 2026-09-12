export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'go';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type IssueCategory = 'syntax' | 'bugs' | 'security' | 'quality' | 'performance';

export interface CodeIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  ruleId: string;
  title: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  explanation?: string;
  risk?: string;
  suggestion?: string;
  source: string;
  file?: string;
}

export interface AnalysisMetrics {
  linesOfCode: number;
  codeLines: number;
  blankLines: number;
  commentLines: number;
  cyclomaticComplexity: number;
  maxNestingDepth: number;
  maintainabilityIndex: number;
}

export interface AnalysisResult {
  id: string;
  status: 'valid' | 'invalid';
  isValid: boolean;
  language: SupportedLanguage;
  fileName: string;
  score: number;
  securityScore: number;
  qualityScore: number;
  complexityScore: number;
  metrics: AnalysisMetrics;
  severityCounts: Record<IssueSeverity, number>;
  categoryCounts: Record<IssueCategory, number>;
  issuesCount: number;
  issues: CodeIssue[];
  rawCode: string;
  timestamp: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface FixResult {
  fixId: string;
  originalCode: string;
  fixedCode: string;
  diffSummary: string;
  explanation: string;
  confidence: number;
}

export interface AIExplanation {
  title: string;
  whatIsWrong: string;
  whyItMatters: string;
  whatCouldHappen: string;
  suggestedFix: string;
  source: string;
}

export interface AICodeReview {
  readabilityScore: number;
  maintainabilityScore: number;
  architectureSummary: string;
  recommendations: Array<{ category: string; text: string }>;
  source: string;
}
