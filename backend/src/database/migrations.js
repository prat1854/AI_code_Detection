/**
 * CodeGuard AI - Database Migration Schemas
 * Full PostgreSQL schema definitions with relations, indexes, and constraints
 */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'developer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  repository_url VARCHAR(512),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analyses (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
  language VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  security_score INTEGER NOT NULL,
  quality_score INTEGER NOT NULL,
  complexity_score INTEGER NOT NULL,
  raw_code TEXT NOT NULL,
  metrics JSONB,
  severity_counts JSONB,
  category_counts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_files (
  id VARCHAR(64) PRIMARY KEY,
  analysis_id VARCHAR(64) REFERENCES analyses(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
  id VARCHAR(64) PRIMARY KEY,
  analysis_id VARCHAR(64) REFERENCES analyses(id) ON DELETE CASCADE,
  severity VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rule_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  line INTEGER NOT NULL,
  column_num INTEGER NOT NULL,
  end_line INTEGER,
  end_column INTEGER,
  message TEXT NOT NULL,
  explanation TEXT,
  risk TEXT,
  suggestion TEXT,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_reviews (
  id VARCHAR(64) PRIMARY KEY,
  analysis_id VARCHAR(64) REFERENCES analyses(id) ON DELETE CASCADE,
  readability_score INTEGER,
  maintainability_score INTEGER,
  summary TEXT,
  suggestions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fixes (
  id VARCHAR(64) PRIMARY KEY,
  analysis_id VARCHAR(64) REFERENCES analyses(id) ON DELETE CASCADE,
  issue_id VARCHAR(64),
  original_code TEXT NOT NULL,
  fixed_code TEXT NOT NULL,
  diff_summary TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(64) PRIMARY KEY,
  analysis_id VARCHAR(64) REFERENCES analyses(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  report_type VARCHAR(50) NOT NULL,
  format VARCHAR(20) NOT NULL,
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_analysis ON issues(analysis_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_fixes_analysis ON fixes(analysis_id);
`;

module.exports = {
  SCHEMA_SQL
};
