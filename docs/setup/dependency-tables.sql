-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dependencies table
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'global',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_security_update BOOLEAN DEFAULT FALSE,
  is_dev BOOLEAN DEFAULT FALSE,
  description TEXT,
  repository VARCHAR(500),
  homepage VARCHAR(500),
  license VARCHAR(100),
  author VARCHAR(255),
  vulnerability_count INTEGER DEFAULT 0,
  dependabot_alert_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_dependencies_name ON dependencies(name);
CREATE INDEX IF NOT EXISTS idx_dependencies_update_mode ON dependencies(update_mode);
CREATE INDEX IF NOT EXISTS idx_dependencies_has_security_update ON dependencies(has_security_update);
CREATE INDEX IF NOT EXISTS idx_dependencies_last_checked ON dependencies(last_checked);

-- Add RLS policies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'authenticated_read_dependencies'
  ) THEN
    CREATE POLICY "authenticated_read_dependencies"
    ON dependencies
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'authenticated_read_dependencies'
  ) THEN
    CREATE POLICY "authenticated_read_dependencies"
    ON dependencies
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Dependency Settings table
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative',
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  security_auto_update BOOLEAN DEFAULT TRUE,
  dependabot_enabled BOOLEAN DEFAULT TRUE,
  github_token_configured BOOLEAN DEFAULT FALSE,
  last_scan TIMESTAMP WITH TIME ZONE,
  scan_frequency_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings with conservative mode (safer default)
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule, security_auto_update, dependabot_enabled)
VALUES ('conservative', FALSE, 'daily', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependency settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'authenticated_read_settings'
  ) THEN
    CREATE POLICY "authenticated_read_settings"
    ON dependency_settings
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users to read dependency settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'authenticated_read_dependency_settings'
  ) THEN
    CREATE POLICY "authenticated_read_dependency_settings"
    ON dependency_settings
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Dependency Compatibility table
CREATE TABLE IF NOT EXISTS dependency_compatibility (
  id SERIAL PRIMARY KEY,
  package_name VARCHAR(255) NOT NULL,
  min_compatible_version VARCHAR(100),
  max_compatible_version VARCHAR(100),
  recommended_version VARCHAR(100),
  compatibility_notes TEXT,
  last_verified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by VARCHAR(255),
  test_results TEXT,
  breaking_versions JSONB,
  source VARCHAR(50) DEFAULT 'auto', -- 'auto', 'manual', 'npm', 'github'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_name)
);

-- Add RLS policies
ALTER TABLE dependency_compatibility ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read compatibility data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_compatibility' AND policyname = 'authenticated_read_compatibility'
  ) THEN
    CREATE POLICY "authenticated_read_compatibility"
    ON dependency_compatibility
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users to read compatibility data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_compatibility' AND policyname = 'authenticated_read_dependency_compatibility'
  ) THEN
    CREATE POLICY "authenticated_read_dependency_compatibility"
    ON dependency_compatibility
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Security Audits table
CREATE TABLE IF NOT EXISTS security_audits (
  id SERIAL PRIMARY KEY,
  audit_type VARCHAR(50) NOT NULL DEFAULT 'npm_audit', -- 'npm_audit', 'dependabot', 'manual'
  audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_vulnerabilities INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  packages_scanned INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 100,
  audit_summary JSONB,
  audit_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_roles(user_id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audits_type ON security_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_security_audits_score ON security_audits(security_score);
CREATE INDEX IF NOT EXISTS idx_security_audits_created_at ON security_audits(created_at);

-- Add RLS policies
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read security audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audits' AND policyname = 'authenticated_read_audits'
  ) THEN
    CREATE POLICY "authenticated_read_audits"
    ON security_audits
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage security audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audits' AND policyname = 'admins_manage_audits'
  ) THEN
    CREATE POLICY "admins_manage_audits"
    ON security_audits
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Dependabot Alerts table
CREATE TABLE IF NOT EXISTS dependabot_alerts (
  id SERIAL PRIMARY KEY,
  github_alert_number INTEGER NOT NULL UNIQUE,
  package_name VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  cve_id VARCHAR(100),
  ghsa_id VARCHAR(100),
  summary TEXT,
  description TEXT,
  vulnerable_version_range VARCHAR(255),
  recommended_version VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_method VARCHAR(100),
  auto_updated BOOLEAN DEFAULT FALSE,
  update_successful BOOLEAN,
  CONSTRAINT fk_dependabot_dependency 
    FOREIGN KEY (package_name) REFERENCES dependencies(name) 
    ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_package ON dependabot_alerts(package_name);
CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_severity ON dependabot_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_state ON dependabot_alerts(state);
CREATE INDEX IF NOT EXISTS idx_dependabot_alerts_github_number ON dependabot_alerts(github_alert_number);

-- Add RLS policies for dependabot_alerts
ALTER TABLE dependabot_alerts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependabot alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependabot_alerts' AND policyname = 'authenticated_read_dependabot_alerts'
  ) THEN
    CREATE POLICY "authenticated_read_dependabot_alerts"
    ON dependabot_alerts
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage dependabot alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependabot_alerts' AND policyname = 'admins_manage_dependabot_alerts'
  ) THEN
    CREATE POLICY "admins_manage_dependabot_alerts"
    ON dependabot_alerts
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Dependency Update History table
CREATE TABLE IF NOT EXISTS dependency_update_history (
  id SERIAL PRIMARY KEY,
  dependency_name VARCHAR(255) NOT NULL,
  from_version VARCHAR(100),
  to_version VARCHAR(100) NOT NULL,
  update_mode VARCHAR(50) NOT NULL,
  initiated_by VARCHAR(100) NOT NULL, -- 'user', 'auto', 'dependabot'
  initiated_by_user_id UUID REFERENCES user_roles(user_id),
  dependabot_alert_id INTEGER REFERENCES dependabot_alerts(id),
  update_successful BOOLEAN NOT NULL,
  backup_created BOOLEAN DEFAULT FALSE,
  build_successful BOOLEAN,
  tests_passed BOOLEAN,
  rollback_performed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  duration_seconds INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_update_history_dependency 
    FOREIGN KEY (dependency_name) REFERENCES dependencies(name) 
    ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_update_history_dependency ON dependency_update_history(dependency_name);
CREATE INDEX IF NOT EXISTS idx_update_history_initiated_by ON dependency_update_history(initiated_by);
CREATE INDEX IF NOT EXISTS idx_update_history_successful ON dependency_update_history(update_successful);
CREATE INDEX IF NOT EXISTS idx_update_history_started_at ON dependency_update_history(started_at);

-- Add RLS policies for dependency_update_history
ALTER TABLE dependency_update_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read update history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_update_history' AND policyname = 'authenticated_read_update_history'
  ) THEN
    CREATE POLICY "authenticated_read_update_history"
    ON dependency_update_history
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage update history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_update_history' AND policyname = 'admins_manage_update_history'
  ) THEN
    CREATE POLICY "admins_manage_update_history"
    ON dependency_update_history
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
