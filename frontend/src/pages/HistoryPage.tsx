import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  HistoryOutlined as HistoryIcon,
  Download as DownloadIcon,
  Launch as LaunchIcon,
  CheckCircle as ValidIcon,
  Cancel as InvalidIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { analysisApi } from '../services/api';
import { AnalysisResult } from '../types';
import { useAppTheme } from '../context/ThemeContext';

export const HistoryPage: React.FC = () => {
  const { mode } = useAppTheme();
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await analysisApi.getHistory({
        language: languageFilter !== 'all' ? languageFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [languageFilter, statusFilter]);

  const filteredAnalyses = analyses.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = (item.id || '').toLowerCase().includes(q);
      const matchLang = (item.language || '').toLowerCase().includes(q);
      if (!matchId && !matchLang) return false;
    }
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#38bdf8';
    if (score >= 40) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              bgcolor: 'rgba(56, 189, 248, 0.15)',
              color: 'primary.main',
              display: 'flex'
            }}
          >
            <HistoryIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Analysis History
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Review past security audits, quality scores, and exported reports
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={fetchHistory} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filter Bar */}
      <Card elevation={0} sx={{ mb: 3, p: 2, bgcolor: mode === 'dark' ? '#111827' : '#ffffff' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by analysis ID or language..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={languageFilter}
              label="Language"
              onChange={e => setLanguageFilter(e.target.value)}
            >
              <MenuItem value="all">All Languages</MenuItem>
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="typescript">TypeScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="java">Java</MenuItem>
              <MenuItem value="cpp">C++</MenuItem>
              <MenuItem value="go">Go</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="valid">Valid</MenuItem>
              <MenuItem value="invalid">Invalid</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* History Table */}
      <Card elevation={0} sx={{ bgcolor: mode === 'dark' ? '#111827' : '#ffffff', borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Analysis ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Language</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Health Score</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Security Score</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      Loading historical analyses...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAnalyses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No analyses found. Run a code analysis from the Workspace to see it here!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAnalyses.map(row => {
                  const isValid = row.status === 'valid';
                  const dateStr = new Date(row.created_at || row.timestamp).toLocaleString();

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                        {row.id}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.language.toUpperCase()}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          {isValid ? (
                            <ValidIcon sx={{ fontSize: 18, color: '#10b981' }} />
                          ) : (
                            <InvalidIcon sx={{ fontSize: 18, color: '#f43f5e' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: isValid ? '#10b981' : '#f43f5e'
                            }}
                          >
                            {isValid ? 'VALID' : 'INVALID'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: getScoreColor(row.score) }}>
                          {row.score} / 100
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: getScoreColor(row.securityScore ?? (row as any).security_score ?? 0)
                          }}
                        >
                          {row.securityScore ?? (row as any).security_score ?? 0}%
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {dateStr}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="Download HTML Report">
                            <IconButton
                              size="small"
                              component="a"
                              href={analysisApi.getReportHtmlUrl(row.id)}
                              target="_blank"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};
