import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ShieldOutlined as ShieldIcon,
  FlashOn as DemoIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        p: 2
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 420,
          width: '100%',
          bgcolor: mode === 'dark' ? '#111827' : '#ffffff',
          borderRadius: 3,
          p: 2
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* Brand Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
              }}
            >
              <ShieldIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              Sign In to CodeGuard
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              AI-Powered Deterministic Code Detection & Review
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          {/* 1-Click Demo Evaluation Button */}
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<DemoIcon sx={{ color: '#f59e0b' }} />}
            onClick={handleDemoLogin}
            disabled={loading}
            sx={{
              py: 1.1,
              mb: 2.5,
              fontWeight: 700,
              bgcolor: mode === 'dark' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.04)',
              borderColor: 'primary.main'
            }}
          >
            1-Click Demo Account Login
          </Button>

          <Divider sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
              OR SIGN IN WITH EMAIL
            </Typography>
          </Divider>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              size="small"
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              sx={{ mb: 2.5 }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
              sx={{ py: 1.1, fontWeight: 700 }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
