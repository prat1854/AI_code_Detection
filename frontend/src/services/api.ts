import axios from 'axios';
import { AnalysisResult, FixResult, AIExplanation, AICodeReview, User } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('codeguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Methods
export const analysisApi = {
  runAnalysis: async (payload: { code: string; language: string; fileName?: string }): Promise<AnalysisResult> => {
    const res = await api.post('/analysis', payload);
    return res.data;
  },

  getAnalysis: async (id: string): Promise<AnalysisResult> => {
    const res = await api.get(`/analysis/${id}`);
    return res.data;
  },

  getHistory: async (params?: { language?: string; status?: string; limit?: number }): Promise<{ analyses: AnalysisResult[] }> => {
    const res = await api.get('/analysis/history', { params });
    return res.data;
  },

  getSamples: async () => {
    const res = await api.get('/analysis/samples');
    return res.data.samples;
  },

  getAnalytics: async () => {
    const res = await api.get('/analysis/analytics');
    return res.data;
  },

  explainIssue: async (analysisId: string, issueId: string): Promise<AIExplanation> => {
    const res = await api.post(`/analysis/${analysisId}/explain`, { issueId });
    return res.data;
  },

  generateFix: async (analysisId: string, issueId?: string): Promise<FixResult> => {
    const res = await api.post(`/analysis/${analysisId}/fix`, { issueId });
    return res.data;
  },

  reviewCode: async (analysisId: string): Promise<AICodeReview> => {
    const res = await api.post(`/analysis/${analysisId}/review`);
    return res.data;
  },

  getReportHtmlUrl: (id: string) => `/api/reports/${id}/html`,
  getReportJsonUrl: (id: string) => `/api/reports/${id}/json`
};

export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (email: string, password: string, name: string): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/register', { email, password, name });
    return res.data;
  },

  demoLogin: async (): Promise<{ token: string; user: User }> => {
    const res = await api.post('/auth/demo');
    return res.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me');
    return res.data;
  }
};

export default api;
