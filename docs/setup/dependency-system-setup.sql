-- Dependencies System Tables

-- Table for dependency settings
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(20) DEFAULT 'conservative',
  auto_update BOOLEAN DEFAULT false,
  last_scan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for dependencies
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  current_version VARCHAR(100),
  latest_version VARCHAR(100),
  description TEXT,
  is_dev BOOLEAN DEFAULT false,
  outdated BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  has_security_issue BOOLEAN DEFAULT false,
  security_details JSONB,
  update_mode VARCHAR(20) DEFAULT 'global',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Table for security audits
CREATE TABLE IF NOT EXISTS security_audits (
  id SERIAL PRIMARY KEY,
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vulnerabilities INTEGER DEFAULT 0,
  outdated_packages INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 100,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for update history
CREATE TABLE IF NOT EXISTS dependency_updates (
  id SERIAL PRIMARY KEY,
  dependency_name VARCHAR(255) NOT NULL,
  from_version VARCHAR(100),
  to_version VARCHAR(100),
  update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO dependency_settings (update_mode, auto_update)
SELECT 'conservative', false
WHERE NOT EXISTS (SELECT 1 FROM dependency_settings);
