import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as ValidIcon,
  Cancel as InvalidIcon,
  ShieldOutlined as SecurityIcon,
  AutoAwesomeOutlined as QualityIcon,
  SpeedOutlined as ComplexityIcon
} from '@mui/icons-material';
import { AnalysisResult } from '../types';
import { useAppTheme } from '../context/ThemeContext';

interface AnalysisSummaryCardProps {
  result: AnalysisResult;
}

export const AnalysisSummaryCard: React.FC<AnalysisSummaryCardProps> = ({ result }) => {
  const { mode } = useAppTheme();
  const isSyntaxValid = result.status === 'valid' || result.isValid;

  const severityCounts = result.severityCounts || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };

  const syntaxErrorCount = result.issues?.filter(i => i.category === 'syntax').length || 0;
  const totalIssuesCount = result.issuesCount || result.issues?.length || 0;

  // Qualitative health status label
  const getHealthStatus = (score: number) => {
    if (!isSyntaxValid) return { label: 'Compilation Blocked', color: '#f43f5e' };
    if (score < 40) return { label: 'Critical Risk', color: '#f43f5e' };
    if (score < 70) return { label: 'Needs Attention', color: '#f97316' };
    if (score < 85) return { label: 'Good Health', color: '#38bdf8' };
    return { label: 'Excellent', color: '#10b981' };
  };

  const healthStatus = getHealthStatus(result.score);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#38bdf8';
    if (score >= 40) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 1.5,
        flexShrink: 0,
        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
        border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
        borderRadius: 2
      }}
    >
      <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
        {/* Top Summary Bar: Health Score + Syntax Validity */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            p: 1.5,
            mb: 1.5,
            borderRadius: 1.5,
            bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc',
            border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
          }}
        >
          {/* Dominant Health Score */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                Overall Health Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: healthStatus.color,
                    lineHeight: 1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {result.score}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  / 100
                </Typography>
                <Chip
                  size="small"
                  label={healthStatus.label}
                  sx={{
                    ml: 0.5,
                    bgcolor: `${healthStatus.color}20`,
                    color: healthStatus.color,
                    border: `1px solid ${healthStatus.color}40`,
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    height: 20
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Syntax Validity Block */}
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: 1.2,
                py: 0.4,
                borderRadius: '6px',
                bgcolor: isSyntaxValid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                border: `1px solid ${isSyntaxValid ? '#10b981' : '#f43f5e'}40`,
                color: isSyntaxValid ? '#10b981' : '#f43f5e',
                mb: 0.3
              }}
            >
              {isSyntaxValid ? (
                <ValidIcon sx={{ fontSize: 14 }} />
              ) : (
                <InvalidIcon sx={{ fontSize: 14 }} />
              )}
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.04em', fontSize: '0.72rem' }}>
                {isSyntaxValid ? 'SYNTAX VALID' : 'SYNTAX INVALID'}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
              {isSyntaxValid
                ? totalIssuesCount > 0
                  ? `${totalIssuesCount} issue${totalIssuesCount === 1 ? '' : 's'} require attention`
                  : 'Clean parse — no issues detected'
                : `${syntaxErrorCount || 1} syntax error(s) detected`}
            </Typography>
          </Box>
        </Box>

        {/* Severity Badges Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            flexWrap: 'wrap',
            mb: 1.5
          }}
        >
          <Chip
            size="small"
            label={`${severityCounts.critical || 0} Critical`}
            sx={{
              bgcolor: severityCounts.critical > 0 ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
              color: severityCounts.critical > 0 ? '#f43f5e' : 'text.secondary',
              border: `1px solid ${severityCounts.critical > 0 ? '#f43f5e' : mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22
            }}
          />
          <Chip
            size="small"
            label={`${severityCounts.high || 0} High`}
            sx={{
              bgcolor: severityCounts.high > 0 ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
              color: severityCounts.high > 0 ? '#f97316' : 'text.secondary',
              border: `1px solid ${severityCounts.high > 0 ? '#f97316' : mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22
            }}
          />
          <Chip
            size="small"
            label={`${severityCounts.medium || 0} Medium`}
            sx={{
              bgcolor: severityCounts.medium > 0 ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: severityCounts.medium > 0 ? '#f59e0b' : 'text.secondary',
              border: `1px solid ${severityCounts.medium > 0 ? '#f59e0b' : mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22
            }}
          />
          <Chip
            size="small"
            label={`${severityCounts.low || 0} Low`}
            sx={{
              bgcolor: 'transparent',
              color: 'text.secondary',
              border: `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}`,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22
            }}
          />
        </Box>

        {/* Sub-Score Breakdown (Security, Quality, Complexity) */}
        <Grid container spacing={1}>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1.2,
                bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc',
                border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SecurityIcon sx={{ fontSize: 13, color: '#38bdf8' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem' }}>
                    Security
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: getScoreColor(result.securityScore), fontSize: '0.72rem' }}>
                  {result.securityScore}/100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={result.securityScore}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: mode === 'dark' ? '#1e293b' : '#e2e8f0',
                  '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(result.securityScore) }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1.2,
                bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc',
                border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <QualityIcon sx={{ fontSize: 13, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem' }}>
                    Quality
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: getScoreColor(result.qualityScore), fontSize: '0.72rem' }}>
                  {result.qualityScore}/100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={result.qualityScore}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: mode === 'dark' ? '#1e293b' : '#e2e8f0',
                  '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(result.qualityScore) }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 1,
                borderRadius: 1.2,
                bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc',
                border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ComplexityIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem' }}>
                    Complexity
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: getScoreColor(result.complexityScore), fontSize: '0.72rem' }}>
                  {result.complexityScore}/100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={result.complexityScore}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: mode === 'dark' ? '#1e293b' : '#e2e8f0',
                  '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(result.complexityScore) }
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
