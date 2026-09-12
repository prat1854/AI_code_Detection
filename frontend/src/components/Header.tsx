import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ShieldOutlined as ShieldIcon,
  CodeOutlined as CodeIcon,
  HistoryOutlined as HistoryIcon,
  BarChartOutlined as ChartIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  AccountCircle as UserIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useAppTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Workspace', path: '/', icon: <CodeIcon sx={{ fontSize: 18 }} /> },
    { label: 'History', path: '/history', icon: <HistoryIcon sx={{ fontSize: 18 }} /> },
    { label: 'Analytics', path: '/analytics', icon: <ChartIcon sx={{ fontSize: 18 }} /> }
  ];

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: mode === 'dark' ? '#0f172a' : '#ffffff',
        borderBottom: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
        zIndex: 1100
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: { xs: 2, md: 3 } }}>
        {/* Brand Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(56, 189, 248, 0.3)'
            }}
          >
            <ShieldIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                  background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: mode === 'dark' ? 'transparent' : 'inherit'
                }}
              >
                CodeGuard
              </Typography>
              <Chip
                label="AI v1.0"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9',
                  color: '#38bdf8'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
              AI Code Detection & Static Analysis Platform
            </Typography>
          </Box>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  px: 1.8,
                  py: 0.8,
                  fontWeight: 600,
                  color: isActive ? 'primary.main' : 'text.secondary',
                  bgcolor: isActive
                    ? mode === 'dark'
                      ? 'rgba(56, 189, 248, 0.1)'
                      : 'rgba(2, 132, 199, 0.08)'
                    : 'transparent',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {/* Actions & Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} mode`}>
            <IconButton onClick={toggleTheme} color="inherit" size="small">
              {mode === 'dark' ? <LightIcon sx={{ color: '#f59e0b' }} /> : <DarkIcon />}
            </IconButton>
          </Tooltip>

          {isAuthenticated && user ? (
            <>
              <Chip
                avatar={<UserIcon sx={{ color: 'primary.main' }} />}
                label={user.name}
                onClick={handleMenu}
                clickable
                sx={{
                  bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9',
                  fontWeight: 600
                }}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled sx={{ fontSize: 13, color: 'text.secondary' }}>
                  {user.email}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ fontSize: 18, mr: 1, color: 'error.main' }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/login')}
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
