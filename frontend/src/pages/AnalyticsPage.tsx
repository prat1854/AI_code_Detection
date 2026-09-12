import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  BarChartOutlined as ChartIcon,
  CheckCircle as ValidIcon,
  Security as SecurityIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import { analysisApi } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';

export const AnalyticsPage: React.FC = () => {
  const { mode } = useAppTheme();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await analysisApi.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Formatting for Recharts
  const validInvalidData = [
    { name: 'Valid Code', value: data?.validCount || 0, color: '#10b981' },
    { name: 'Invalid Code', value: data?.invalidCount || 0, color: '#f43f5e' }
  ];

  const severityData = [
    { name: 'Critical', count: data?.severityTotals?.critical || 0, fill: '#f43f5e' },
    { name: 'High', count: data?.severityTotals?.high || 0, fill: '#f97316' },
    { name: 'Medium', count: data?.severityTotals?.medium || 0, fill: '#f59e0b' },
    { name: 'Low', count: data?.severityTotals?.low || 0, fill: '#3b82f6' }
  ];

  const categoryData = [
    { name: 'Security', count: data?.categoryTotals?.security || 0, fill: '#38bdf8' },
    { name: 'Syntax', count: data?.categoryTotals?.syntax || 0, fill: '#f43f5e' },
    { name: 'Bugs', count: data?.categoryTotals?.bugs || 0, fill: '#f59e0b' },
    { name: 'Quality', count: data?.categoryTotals?.quality || 0, fill: '#10b981' },
    { name: 'Performance', count: data?.categoryTotals?.performance || 0, fill: '#a855f7' }
  ];

  const langData = Object.entries(data?.languageDistribution || {}).map(([lang, count]) => ({
    name: lang.toUpperCase(),
    value: count
  }));

  const LANG_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            bgcolor: 'rgba(56, 189, 248, 0.15)',
            color: 'primary.main',
            display: 'flex'
          }}
        >
          <ChartIcon sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Platform Analytics & Health Trends
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Aggregated vulnerability distribution, language usage, and validity metrics
          </Typography>
        </Box>
      </Box>

      {/* Metric Cards Top Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: mode === 'dark' ? '#111827' : '#ffffff' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              TOTAL ANALYSES RUN
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'primary.main' }}>
              {data?.totalAnalyses || 0}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: mode === 'dark' ? '#111827' : '#ffffff' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              VALID CODE PASS RATE
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#10b981' }}>
              {data?.totalAnalyses
                ? `${Math.round((data.validCount / data.totalAnalyses) * 100)}%`
                : '100%'}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: mode === 'dark' ? '#111827' : '#ffffff' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              SECURITY VULNERABILITIES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#f43f5e' }}>
              {data?.categoryTotals?.security || 0}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: mode === 'dark' ? '#111827' : '#ffffff' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              CRITICAL RISKS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#f97316' }}>
              {data?.severityTotals?.critical || 0}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Visualizations Grid */}
      <Grid container spacing={3}>
        {/* Issues by Severity */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ p: 2.5, bgcolor: mode === 'dark' ? '#111827' : '#ffffff', height: 360 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Issues by Severity
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={severityData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: mode === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: mode === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: 8
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Issues by Category */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ p: 2.5, bgcolor: mode === 'dark' ? '#111827' : '#ffffff', height: 360 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Issues by Category
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: mode === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: mode === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: 8
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Valid vs Invalid Code Ratio */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ p: 2.5, bgcolor: mode === 'dark' ? '#111827' : '#ffffff', height: 360 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Code Validity Ratio
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={validInvalidData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {validInvalidData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Programming Language Distribution */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ p: 2.5, bgcolor: mode === 'dark' ? '#111827' : '#ffffff', height: 360 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Language Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={langData.length > 0 ? langData : [{ name: 'None', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {langData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={LANG_COLORS[index % LANG_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
