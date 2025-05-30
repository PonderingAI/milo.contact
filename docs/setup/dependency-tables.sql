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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'admins_manage_dependencies'
  ) THEN
    CREATE POLICY "admins_manage_dependencies"
    ON dependencies
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

-- Dependency Settings table
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'aggressive',
  auto_update_enabled BOOLEAN DEFAULT TRUE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings with aggressive mode
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('aggressive', TRUE, 'daily')
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

-- Allow authenticated users with admin role to manage dependency settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'admins_manage_settings'
  ) THEN
    CREATE POLICY "admins_manage_settings"
    ON dependency_settings
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

-- Allow authenticated users with admin role to manage compatibility data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_compatibility' AND policyname = 'admins_manage_compatibility'
  ) THEN
    CREATE POLICY "admins_manage_compatibility"
    ON dependency_compatibility
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

-- Security Audits table
CREATE TABLE IF NOT EXISTS security_audits (
  id SERIAL PRIMARY KEY,
  audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vulnerabilities_found INTEGER DEFAULT 0,
  packages_scanned INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 100,
  audit_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
