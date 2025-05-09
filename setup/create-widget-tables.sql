-- Create widget tables
BEGIN;

-- Create widget_types table
CREATE TABLE IF NOT EXISTS widget_types (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  default_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_widgets table
CREATE TABLE IF NOT EXISTS user_widgets (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  position INTEGER NOT NULL,
  config JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE widget_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_widgets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read widget_types
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read widget_types"
ON widget_types
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read their own widgets
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read their own widgets"
ON user_widgets
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR user_id IS NULL
);

-- Allow authenticated users to manage their own widgets
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage their own widgets"
ON user_widgets
FOR ALL
TO authenticated
USING (
  user_id = auth.uid() OR user_id IS NULL
);

-- Insert default widget types if they don't exist
INSERT INTO widget_types (id, name, description, type)
VALUES 
  ('dependency-overview', 'Dependency Overview', 'Shows a summary of your project dependencies', 'dependency'),
  ('security-alerts', 'Security Alerts', 'Displays security vulnerabilities in your dependencies', 'security'),
  ('update-status', 'Update Status', 'Shows which packages need updates', 'dependency'),
  ('npm-scripts', 'NPM Scripts', 'Quick access to your package.json scripts', 'development'),
  ('recent-updates', 'Recent Updates', 'Shows recently updated dependencies', 'dependency'),
  ('system-status', 'System Status', 'Displays the status of your development environment', 'system')
ON CONFLICT (id) DO NOTHING;

COMMIT;
