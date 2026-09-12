import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Check as AcceptIcon,
  Close as RejectIcon,
  ContentCopy as CopyIcon,
  CompareArrows as DiffIcon
} from '@mui/icons-material';
import { DiffEditor } from '@monaco-editor/react';
import { FixResult, SupportedLanguage } from '../types';
import { useAppTheme } from '../context/ThemeContext';

interface DiffViewerModalProps {
  open: boolean;
  onClose: () => void;
  fixResult: FixResult | null;
  language: SupportedLanguage;
  onAcceptFix: (fixedCode: string) => void;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
  open,
  onClose,
  fixResult,
  language,
  onAcceptFix
}) => {
  const { mode } = useAppTheme();
  const [copied, setCopied] = useState(false);

  if (!fixResult) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fixResult.fixedCode);
    setCopied(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '85vh',
            bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
            py: 2,
            px: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 1,
                bgcolor: 'rgba(56, 189, 248, 0.15)',
                color: 'primary.main',
                display: 'flex'
              }}
            >
              <DiffIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                AI Suggested Code Fix & Diff
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Review before-and-after differences before accepting
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              label={`Confidence: ${Math.round((fixResult.confidence || 0.95) * 100)}%`}
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700
              }}
            />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Diff Summary Bar */}
          <Alert
            severity="info"
            sx={{
              bgcolor: mode === 'dark' ? 'rgba(56, 189, 248, 0.1)' : undefined,
              border: mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.2)' : undefined,
              color: mode === 'dark' ? '#7dd3fc' : undefined
            }}
          >
            <strong>Remediation Summary:</strong> {fixResult.diffSummary}
          </Alert>

          {/* Diff Column Labels */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#f43f5e' }}>
              ORIGINAL CODE (Vulnerable / Defective)
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981' }}>
              PROPOSED CODE (AI Remediated)
            </Typography>
          </Box>

          {/* Monaco Diff Editor */}
          <Box
            sx={{
              flex: 1,
              borderRadius: 1.5,
              overflow: 'hidden',
              border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
            }}
          >
            <DiffEditor
              height="100%"
              language={language}
              theme={mode === 'dark' ? 'vs-dark' : 'light'}
              original={fixResult.originalCode}
              modified={fixResult.fixedCode}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', monospace",
                renderSideBySide: true,
                readOnly: true,
                automaticLayout: true,
                minimap: { enabled: false }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
            justifyContent: 'space-between'
          }}
        >
          <Button
            startIcon={<CopyIcon />}
            onClick={handleCopy}
            sx={{ color: 'text.secondary' }}
          >
            Copy Fixed Code
          </Button>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RejectIcon />}
              onClick={onClose}
            >
              Reject Fix
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AcceptIcon />}
              onClick={() => onAcceptFix(fixResult.fixedCode)}
              sx={{ fontWeight: 700 }}
            >
              Accept & Apply Fix
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Fixed code copied to clipboard!"
      />
    </>
  );
};
