import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  AutoFixHigh as FixIcon,
  PsychologyOutlined as AiIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { CodeIssue, IssueSeverity, IssueCategory } from '../types';
import { useAppTheme } from '../context/ThemeContext';

interface IssueListProps {
  issues: CodeIssue[];
  onSelectIssueLine: (line: number) => void;
  onGenerateFix: (issue: CodeIssue) => void;
  onExplainIssue: (issue: CodeIssue) => void;
  activeLine?: number | null;
  isFixing?: boolean;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onSelectIssueLine,
  onGenerateFix,
  onExplainIssue,
  activeLine,
  isFixing
}) => {
  const { mode } = useAppTheme();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIssues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getSeverityStyle = (sev: IssueSeverity) => {
    switch (sev) {
      case 'critical':
        return {
          bg: 'rgba(244, 63, 94, 0.12)',
          text: '#f43f5e',
          border: '#f43f5e',
          cardBorder: 'rgba(244, 63, 94, 0.3)'
        };
      case 'high':
        return {
          bg: 'rgba(249, 115, 22, 0.12)',
          text: '#f97316',
          border: '#f97316',
          cardBorder: 'rgba(249, 115, 22, 0.3)'
        };
      case 'medium':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#f59e0b',
          border: '#f59e0b',
          cardBorder: 'rgba(245, 158, 11, 0.3)'
        };
      case 'low':
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          text: '#3b82f6',
          border: '#3b82f6',
          cardBorder: 'rgba(59, 130, 246, 0.3)'
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.12)',
          text: '#94a3b8',
          border: '#64748b',
          cardBorder: 'rgba(100, 116, 139, 0.3)'
        };
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (issue.title || '').toLowerCase().includes(q);
      const matchMsg = (issue.message || '').toLowerCase().includes(q);
      const matchRule = (issue.ruleId || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchRule) return false;
    }
    return true;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%' }}>
      {/* Search & Filter Controls (Fixed at top of findings panel) */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.2, flexWrap: 'wrap', flexShrink: 0 }}>
        <TextField
          size="small"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.2 }}>
                  <ClearIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{
            flex: 1,
            minWidth: 140,
            '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem' }
          }}
        />

        <FormControl size="small" sx={{ minWidth: 115, '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem' } }}>
          <InputLabel sx={{ top: -3, fontSize: '0.8rem' }}>Severity</InputLabel>
          <Select
            value={severityFilter}
            label="Severity"
            onChange={e => setSeverityFilter(e.target.value)}
            sx={{ height: 34, fontSize: '0.8rem' }}
          >
            <MenuItem value="all">All Severities</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 115, '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem' } }}>
          <InputLabel sx={{ top: -3, fontSize: '0.8rem' }}>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={e => setCategoryFilter(e.target.value)}
            sx={{ height: 34, fontSize: '0.8rem' }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="syntax">Syntax</MenuItem>
            <MenuItem value="security">Security</MenuItem>
            <MenuItem value="bugs">Bugs</MenuItem>
            <MenuItem value="quality">Quality</MenuItem>
            <MenuItem value="performance">Performance</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Findings List (Scrollable container) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          pr: 0.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2
        }}
      >
        {filteredIssues.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
              border: mode === 'dark' ? '1px dashed #1e293b' : '1px dashed #cbd5e1',
              my: 'auto'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              No findings match your filters.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
              Try changing the severity or category filter.
            </Typography>
          </Box>
        ) : (
          filteredIssues.map((issue, idx) => {
            const sev = getSeverityStyle(issue.severity);
            const isSelectedLine = activeLine === issue.line;
            const issueKey = issue.id || `issue-${idx}`;
            // By default, critical/high findings or clicked findings are expanded
            const isExpanded = expandedIssues[issueKey] ?? (idx === 0 || issue.severity === 'critical');

            const handleCardClick = () => {
              onSelectIssueLine(issue.line);
              setExpandedIssues(prev => ({ ...prev, [issueKey]: true }));
            };

            return (
              <Card
                key={issueKey}
                elevation={0}
                onClick={handleCardClick}
                sx={{
                  height: 'auto',
                  minHeight: 'min-content',
                  flexShrink: 0,
                  cursor: 'pointer',
                  borderRadius: 2,
                  bgcolor: isSelectedLine
                    ? mode === 'dark'
                      ? 'rgba(56, 189, 248, 0.05)'
                      : 'rgba(2, 132, 199, 0.04)'
                    : mode === 'dark'
                    ? '#0f172a'
                    : '#ffffff',
                  border: isSelectedLine
                    ? '1.5px solid #38bdf8'
                    : mode === 'dark'
                    ? '1px solid #1e293b'
                    : '1px solid #e2e8f0',
                  borderLeft: `4px solid ${sev.text}`,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#38bdf8',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <CardContent sx={{ p: 1.8, '&:last-child': { pb: 1.8 } }}>
                  {/* Top Header Row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={issue.severity.toUpperCase()}
                        sx={{
                          bgcolor: sev.bg,
                          color: sev.text,
                          border: `1px solid ${sev.border}40`,
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          height: 20
                        }}
                      />
                      <Chip
                        size="small"
                        label={issue.category.toUpperCase()}
                        sx={{
                          bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9',
                          color: 'text.secondary',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20
                        }}
                      />
                    </Box>

                    {/* Clickable Line Number */}
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIssueLine(issue.line);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.3,
                        borderRadius: 1,
                        bgcolor: mode === 'dark' ? '#0b0f19' : '#f1f5f9',
                        color: isSelectedLine ? 'primary.main' : 'text.secondary',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: isSelectedLine ? 'primary.main' : 'transparent',
                        '&:hover': {
                          color: 'primary.main',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <LocationIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                      Line {issue.line}{issue.column ? `:${issue.column}` : ''}
                    </Box>
                  </Box>

                  {/* Finding Title & Message */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    {issue.title || issue.message}
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem', mb: 1.2 }}>
                    {issue.message}
                  </Typography>

                  {/* Collapsible Details */}
                  <Collapse in={isExpanded} timeout="auto">
                    <Box
                      sx={{
                        mt: 1.2,
                        pt: 1.2,
                        borderTop: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.2
                      }}
                    >
                      {/* Why it matters / Risk */}
                      {issue.risk && (
                        <Box sx={{ p: 1.2, borderRadius: 1.2, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: '#f43f5e',
                              display: 'block',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              fontSize: '0.68rem',
                              mb: 0.3
                            }}
                          >
                            WHY IT MATTERS
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            {issue.risk}
                          </Typography>
                        </Box>
                      )}

                      {/* Suggested Fix */}
                      {issue.suggestion && (
                        <Box sx={{ p: 1.2, borderRadius: 1.2, bgcolor: mode === 'dark' ? '#0b0f19' : '#f8fafc' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: '#10b981',
                              display: 'block',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              fontSize: '0.68rem',
                              mb: 0.3
                            }}
                          >
                            SUGGESTED FIX
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                            {issue.suggestion}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Collapse>

                  {/* Actions & Expand Bar */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 1.5
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(issueKey);
                      }}
                      sx={{ color: 'text.secondary', p: 0.3 }}
                    >
                      {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AiIcon sx={{ fontSize: 15 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onExplainIssue(issue);
                        }}
                        sx={{ fontSize: '0.74rem', py: 0.4, px: 1.2 }}
                      >
                        Explain with AI
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        disabled={isFixing}
                        startIcon={isFixing ? <CircularProgress size={13} color="inherit" /> : <FixIcon sx={{ fontSize: 15 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateFix(issue);
                        }}
                        sx={{ fontSize: '0.74rem', py: 0.4, px: 1.4, fontWeight: 700 }}
                      >
                        Generate Fix
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>
    </Box>
  );
};
