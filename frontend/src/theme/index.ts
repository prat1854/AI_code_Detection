import { createTheme, ThemeOptions } from '@mui/material/styles';

export const getDesignTokens = (mode: 'dark' | 'light'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'dark'
      ? {
          background: {
            default: '#0b0f19',
            paper: '#111827'
          },
          primary: {
            main: '#38bdf8', // Cyan
            light: '#7dd3fc',
            dark: '#0284c7',
            contrastText: '#0f172a'
          },
          secondary: {
            main: '#10b981', // Emerald
            light: '#34d399',
            dark: '#059669',
            contrastText: '#ffffff'
          },
          error: {
            main: '#f43f5e', // Rose/Ruby
            light: '#fb7185',
            dark: '#e11d48'
          },
          warning: {
            main: '#f59e0b', // Amber
            light: '#fbbf24',
            dark: '#d97706'
          },
          info: {
            main: '#60a5fa', // Blue
            light: '#93c5fd',
            dark: '#2563eb'
          },
          text: {
            primary: '#f8fafc',
            secondary: '#94a3b8'
          },
          divider: '#1e293b'
        }
      : {
          background: {
            default: '#f8fafc',
            paper: '#ffffff'
          },
          primary: {
            main: '#0284c7',
            light: '#38bdf8',
            dark: '#0369a1',
            contrastText: '#ffffff'
          },
          secondary: {
            main: '#059669',
            light: '#10b981',
            dark: '#047857'
          },
          error: {
            main: '#e11d48',
            light: '#f43f5e',
            dark: '#be123c'
          },
          warning: {
            main: '#d97706',
            light: '#f59e0b',
            dark: '#b45309'
          },
          info: {
            main: '#2563eb',
            light: '#60a5fa',
            dark: '#1d4ed8'
          },
          text: {
            primary: '#0f172a',
            secondary: '#475569'
          },
          divider: '#e2e8f0'
        })
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6
        }
      }
    }
  }
});

export const createAppTheme = (mode: 'dark' | 'light') => createTheme(getDesignTokens(mode));
