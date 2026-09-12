import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppTheme } from '../context/ThemeContext';
import { CodeIssue, SupportedLanguage } from '../types';

interface MonacoEditorPaneProps {
  code: string;
  language: SupportedLanguage;
  onChange: (value: string | undefined) => void;
  issues?: CodeIssue[];
  targetLine?: number | null;
  onEditorReady?: (editor: any, monaco: Monaco) => void;
}

// Map language to monaco language identifier
const monacoLangMap: Record<SupportedLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  go: 'go'
};

export const MonacoEditorPane: React.FC<MonacoEditorPaneProps> = ({
  code,
  language,
  onChange,
  issues = [],
  targetLine,
  onEditorReady
}) => {
  const { mode } = useAppTheme();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom high-contrast dark theme matching CodeGuard styling
    monaco.editor.defineTheme('codeguard-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'identifier', foreground: 'f8fafc' }
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.lineHighlightBackground': '#1e293b',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#38bdf8',
        'editorCursor.foreground': '#38bdf8'
      }
    });

    if (onEditorReady) {
      onEditorReady(editor, monaco);
    }
  };

  // Sync Issues to Monaco Markers (squigglies in editor)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = issues.map(issue => {
      let severity = monaco.MarkerSeverity.Warning;
      if (issue.severity === 'critical' || issue.severity === 'high') {
        severity = monaco.MarkerSeverity.Error;
      } else if (issue.severity === 'info') {
        severity = monaco.MarkerSeverity.Info;
      }

      return {
        severity,
        startLineNumber: issue.line,
        startColumn: issue.column || 1,
        endLineNumber: issue.endLine || issue.line,
        endColumn: issue.endColumn || (issue.column ? issue.column + 15 : 20),
        message: `[${issue.severity.toUpperCase()}] ${issue.title || issue.message}\n${issue.explanation || ''}`
      };
    });

    monaco.editor.setModelMarkers(model, 'codeguard', markers);
  }, [issues]);

  // Jump to Target Line when user clicks an issue
  useEffect(() => {
    if (!editorRef.current || !targetLine) return;
    const editor = editorRef.current;
    editor.revealLineInCenter(targetLine);
    editor.setPosition({ lineNumber: targetLine, column: 1 });
    editor.focus();
  }, [targetLine]);

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        border: mode === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff'
      }}
    >
      <Editor
        height="100%"
        language={monacoLangMap[language] || 'javascript'}
        theme={mode === 'dark' ? 'codeguard-dark' : 'light'}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        loading={
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
            <CircularProgress size={30} sx={{ color: 'primary.main' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Loading Monaco Editor...</Typography>
          </Box>
        }
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: true, scale: 0.75 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          tabSize: 2,
          wordWrap: 'on',
          bracketPairColorization: { enabled: true }
        }}
      />
    </Box>
  );
};
