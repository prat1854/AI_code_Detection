import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow as AnalyzeIcon,
  FormatAlignLeft as FormatIcon,
  DeleteOutline as ClearIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  PsychologyOutlined as ReviewIcon,
  Terminal as TerminalIcon,
  CheckCircleOutline as CheckStepIcon,
  RadioButtonChecked as ActiveStepIcon,
  RadioButtonUnchecked as PendingStepIcon,
  Refresh as RetryIcon
} from '@mui/icons-material';
import { MonacoEditorPane } from '../components/MonacoEditorPane';
import { AnalysisSummaryCard } from '../components/AnalysisSummaryCard';
import { IssueList } from '../components/IssueList';
import { DiffViewerModal } from '../components/DiffViewerModal';
import { analysisApi } from '../services/api';
import {
  AnalysisResult,
  SupportedLanguage,
  CodeIssue,
  FixResult,
  AIExplanation,
  AICodeReview
} from '../types';
import { useAppTheme } from '../context/ThemeContext';

export const WorkspacePage: React.FC = () => {
  const { mode } = useAppTheme();

  // Workspace State
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('app.js');
  const [samples, setSamples] = useState<Record<string, any>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [targetLine, setTargetLine] = useState<number | null>(null);

  // AI Actions State
  const [activeFix, setActiveFix] = useState<FixResult | null>(null);
  const [isFixModalOpen, setIsFixModalOpen] = useState<boolean>(false);
  const [isFixing, setIsFixing] = useState<boolean>(false);

  const [activeExplanation, setActiveExplanation] = useState<AIExplanation | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const [codeReview, setCodeReview] = useState<AICodeReview | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorInstanceRef = useRef<any>(null);

  // Load sample snippets on mount
  useEffect(() => {
    async function fetchSamples() {
      try {
        const loadedSamples = await analysisApi.getSamples();
        setSamples(loadedSamples);
        if (loadedSamples.javascript?.code && !code) {
          setCode(loadedSamples.javascript.code);
          setFileName('app.js');
        }
      } catch (err) {
        console.warn('Could not load samples from backend:', err);
      }
    }
    fetchSamples();
  }, []);

  // Handle language change
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const extMap: Record<SupportedLanguage, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go'
    };
    setFileName(`main.${extMap[newLang] || 'txt'}`);

    if (samples[newLang]?.code) {
      setCode(samples[newLang].code);
      setAnalysisResult(null);
      setAnalysisError(null);
    }
  };

  // Run Analysis
  const handleRunAnalysis = async () => {
    if (!code.trim()) {
      setToastMessage('Please write, paste, or upload code to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analysisApi.runAnalysis({
        code,
        language,
        fileName
      });
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err.response?.data?.message || 'We could not analyze this code snippet. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setCode(text);
      setFileName(file.name);

      // Guess language by file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'js' || ext === 'jsx') setLanguage('javascript');
      else if (ext === 'ts' || ext === 'tsx') setLanguage('typescript');
      else if (ext === 'py') setLanguage('python');
      else if (ext === 'java') setLanguage('java');
      else if (ext === 'cpp' || ext === 'c' || ext === 'cc' || ext === 'h') setLanguage('cpp');
      else if (ext === 'go') setLanguage('go');

      setAnalysisResult(null);
      setAnalysisError(null);
      setToastMessage(`Loaded file: ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Format Code
  const handleFormatCode = () => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.getAction('editor.action.formatDocument')?.run();
      setToastMessage('Code formatted.');
    }
  };

  // Clear Code
  const handleClearCode = () => {
    setCode('');
    setAnalysisResult(null);
    setAnalysisError(null);
    setTargetLine(null);
  };

  // Jump to Line on Issue Click
  const handleSelectIssueLine = (line: number) => {
    setTargetLine(line);
  };

  // Generate Fix
  const handleGenerateFix = async (issue: CodeIssue) => {
    if (!analysisResult) return;
    setIsFixing(true);
    try {
      const fix = await analysisApi.generateFix(analysisResult.id, issue.id);
      setActiveFix(fix);
      setIsFixModalOpen(true);
    } catch (err: any) {
      setToastMessage(`Fix generation failed: ${err.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Accept Fix & Automatically Re-Analyze
  const handleAcceptFix = (fixedCode: string) => {
    setCode(fixedCode);
    setIsFixModalOpen(false);
    setActiveFix(null);
    setToastMessage('Fix applied successfully. Re-analyzing updated code...');

    // Automatically trigger analysis on updated code
    setTimeout(async () => {
      try {
        const result = await analysisApi.runAnalysis({
          code: fixedCode,
          language,
          fileName
        });
        setAnalysisResult(result);
        setToastMessage(`Re-analysis complete: Health Score is now ${result.score}/100.`);
      } catch (err: any) {
        console.error('Re-analysis error:', err);
      }
    }, 250);
  };

  // AI Explain Issue
  const handleExplainIssue = async (issue: CodeIssue) => {
    if (!analysisResult) return;
    setIsExplaining(true);
    try {
      const exp = await analysisApi.explainIssue(analysisResult.id, issue.id);
      setActiveExplanation(exp);
      setIsExplainModalOpen(true);
    } catch (err: any) {
      setToastMessage(`Explanation failed: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  // AI Qualitative Code Review
  const handleRunReview = async () => {
    if (!analysisResult) return;
    setIsReviewing(true);
    try {
      const rev = await analysisApi.reviewCode(analysisResult.id);
      setCodeReview(rev);
      setIsReviewModalOpen(true);
    } catch (err: any) {
      setToastMessage(`Code review failed: ${err.message}`);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        height: { xs: 'auto', lg: 'calc(100vh - 64px)' },
        minHeight: { xs: 'auto', lg: 'calc(100vh - 64px)' },
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Workspace Toolbar (Consistent 38px button/input heights) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.2,
          pb: 1.5,
          borderBottom: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
          mb: 1.5,
          flexShrink: 0
        }}
      >
        {/* Left Toolbar Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={language}
              label="Language"
              onChange={e => handleLanguageChange(e.target.value as SupportedLanguage)}
              sx={{ height: 38 }}
            >
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="typescript">TypeScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="java">Java</MenuItem>
              <MenuItem value="cpp">C++</MenuItem>
              <MenuItem value="go">Go</MenuItem>
            </Select>
          </FormControl>

          {/* Sample Snippet Selector */}
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Sample Snippet</InputLabel>
            <Select
              value={language}
              label="Sample Snippet"
              onChange={e => handleLanguageChange(e.target.value as SupportedLanguage)}
              sx={{ height: 38 }}
            >
              <MenuItem value="javascript">JS: Express SQLi & XSS</MenuItem>
              <MenuItem value="typescript">TS: Type & Any Flaws</MenuItem>
              <MenuItem value="python">Python: Pickle & SQLi</MenuItem>
              <MenuItem value="java">Java: JDBC SQLi & Runtime.exec</MenuItem>
              <MenuItem value="cpp">C++: Buffer Overflow & Leak</MenuItem>
              <MenuItem value="go">Go: Sprintf SQLi & Errors</MenuItem>
            </Select>
          </FormControl>

          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cc,.h,.go,.txt"
          />
          <Tooltip title="Upload local source file">
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<UploadIcon sx={{ fontSize: 17 }} />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ height: 38, borderColor: mode === 'dark' ? '#334155' : '#cbd5e1', color: 'text.primary' }}
            >
              Upload
            </Button>
          </Tooltip>

          {/* Format Code */}
          <Tooltip title="Format Code">
            <IconButton
              size="small"
              onClick={handleFormatCode}
              sx={{ height: 38, width: 38, border: mode === 'dark' ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius: 1 }}
            >
              <FormatIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Clear Editor */}
          <Tooltip title="Clear Editor">
            <IconButton
              size="small"
              onClick={handleClearCode}
              sx={{ height: 38, width: 38, border: mode === 'dark' ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius: 1 }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right Toolbar Actions (AI Review secondary, Analyze Code primary) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          {analysisResult && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<ReviewIcon sx={{ color: 'secondary.main', fontSize: 18 }} />}
              onClick={handleRunReview}
              disabled={isReviewing}
              sx={{ height: 38, borderColor: mode === 'dark' ? '#334155' : '#cbd5e1', fontWeight: 600 }}
            >
              {isReviewing ? 'Reviewing...' : 'AI Review'}
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={isAnalyzing ? <CircularProgress size={16} color="inherit" /> : <AnalyzeIcon sx={{ fontSize: 18 }} />}
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            sx={{
              height: 38,
              px: 2.8,
              fontWeight: 700,
              fontSize: '0.88rem'
            }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
          </Button>
        </Box>
      </Box>

      {/* Main Workspace Body (Desktop 55% / 45% Split) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 2,
          width: '100%'
        }}
      >
        {/* Left Column: Monaco Code Editor */}
        <Box
          sx={{
            flex: { xs: 'none', lg: '0 0 55%' },
            width: { xs: '100%', lg: '55%' },
            height: { xs: '450px', lg: '100%' },
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <MonacoEditorPane
            code={code}
            language={language}
            onChange={val => setCode(val || '')}
            issues={analysisResult?.issues || []}
            targetLine={targetLine}
            onEditorReady={(editor) => {
              editorInstanceRef.current = editor;
            }}
          />
        </Box>

        {/* Right Column: Analysis Results & Findings Panel */}
        <Box
          sx={{
            flex: { xs: 'none', lg: '0 0 calc(45% - 16px)' },
            width: { xs: '100%', lg: 'calc(45% - 16px)' },
            height: { xs: 'auto', lg: '100%' },
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {isAnalyzing ? (
            /* Loading State with Progressive Verification Steps */
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                borderRadius: 2
              }}
            >
              <CircularProgress size={36} sx={{ color: 'primary.main', mb: 2.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Analyzing your code...
              </Typography>

              <Box sx={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckStepIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Parsing source AST
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckStepIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Syntax & compiler validation
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ActiveStepIcon sx={{ fontSize: 18, color: '#38bdf8' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#38bdf8' }}>
                    Security & vulnerability scan
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingStepIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Code quality & complexity
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingStepIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    AI explanation & remediation
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : analysisError ? (
            /* Error State with Retry */
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                textAlign: 'center',
                bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                borderRadius: 2
              }}
            >
              <Alert severity="error" sx={{ mb: 2.5, width: '100%', maxWidth: 420 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Analysis Failed
                </Typography>
                <Typography variant="body2">
                  {analysisError}
                </Typography>
              </Alert>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RetryIcon />}
                onClick={handleRunAnalysis}
              >
                Try Again
              </Button>
            </Box>
          ) : analysisResult ? (
            /* Active Analysis Results & Findings Panel */
            <Box sx={{ height: { xs: 'auto', lg: '100%' }, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Top Summary Card */}
              <AnalysisSummaryCard result={analysisResult} />

              {/* Findings Section Header & Reports */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                  px: 0.5,
                  flexShrink: 0
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: 'text.secondary',
                    textTransform: 'uppercase'
                  }}
                >
                  DETAILED FINDINGS ({analysisResult.issuesCount || analysisResult.issues?.length || 0})
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    component="a"
                    href={analysisApi.getReportHtmlUrl(analysisResult.id)}
                    target="_blank"
                    startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
                    sx={{ fontSize: '0.72rem', py: 0.2, color: 'text.secondary' }}
                  >
                    HTML
                  </Button>
                  <Button
                    size="small"
                    component="a"
                    href={analysisApi.getReportJsonUrl(analysisResult.id)}
                    target="_blank"
                    startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
                    sx={{ fontSize: '0.72rem', py: 0.2, color: 'text.secondary' }}
                  >
                    JSON
                  </Button>
                </Box>
              </Box>

              {/* Scrollable Findings List Container */}
              <Box sx={{ flex: { xs: 'none', lg: 1 }, minHeight: 0, height: { xs: 'auto', lg: '100%' }, display: 'flex', flexDirection: 'column' }}>
                <IssueList
                  issues={analysisResult.issues}
                  onSelectIssueLine={handleSelectIssueLine}
                  onGenerateFix={handleGenerateFix}
                  onExplainIssue={handleExplainIssue}
                  activeLine={targetLine}
                  isFixing={isFixing}
                />
              </Box>
            </Box>
          ) : (
            /* Restrained, Clean Empty State */
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                textAlign: 'center',
                bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                borderRadius: 2
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '12px',
                  bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
                }}
              >
                <TerminalIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.8 }}>
                No analysis yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320, mb: 2.5 }}>
                Paste code or upload a file to start your first security, syntax, and code quality analysis.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                sx={{ fontWeight: 600 }}
              >
                Start Analysis
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Professional Diff Viewer Modal */}
      <DiffViewerModal
        open={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        fixResult={activeFix}
        language={language}
        onAcceptFix={handleAcceptFix}
      />

      {/* AI Explanation Dialog */}
      <Dialog
        open={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <ReviewIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          AI Issue Explanation
          <Chip
            size="small"
            label="AI Augmented"
            sx={{
              ml: 'auto',
              bgcolor: 'rgba(56, 189, 248, 0.12)',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.65rem'
            }}
          />
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
          {activeExplanation && (
            <>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  WHAT IS WRONG:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary', fontSize: '0.88rem' }}>
                  {activeExplanation.whatIsWrong}
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc', borderLeft: '3px solid #f43f5e' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  WHY IT MATTERS & RISK:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary', fontSize: '0.85rem' }}>
                  {activeExplanation.whyItMatters}
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc', borderLeft: '3px solid #10b981' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SUGGESTED FIX:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.primary', fontSize: '0.85rem' }}>
                  {activeExplanation.suggestedFix}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIsExplainModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* AI Code Review Dialog */}
      <Dialog
        open={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReviewIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
            AI Code Review
          </Box>
          <Chip
            size="small"
            label="Qualitative Review"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '0.65rem'
            }}
          />
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          {codeReview && (
            <>
              {/* Score Breakdown Grid */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc', textAlign: 'center', border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Readability</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.3 }}>
                      {codeReview.readabilityScore}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc', textAlign: 'center', border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Maintainability</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'secondary.main', mt: 0.3 }}>
                      {codeReview.maintainabilityScore}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc', textAlign: 'center', border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Security</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#f43f5e', mt: 0.3 }}>
                      {analysisResult?.securityScore ?? 65}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc', textAlign: 'center', border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Complexity</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#f59e0b', mt: 0.3 }}>
                      {analysisResult?.complexityScore ?? 75}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Summary */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  SUMMARY
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5, fontSize: '0.88rem' }}>
                  {codeReview.architectureSummary}
                </Typography>
              </Box>

              {/* Numbered Recommendations */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1, display: 'block' }}>
                  RECOMMENDATIONS
                </Typography>
                {codeReview.recommendations.map((rec, i) => (
                  <Box
                    key={i}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc',
                      border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block' }}>
                      {i + 1}. {rec.category}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.3, fontSize: '0.84rem' }}>
                      {rec.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setIsReviewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Toast */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  );
};
