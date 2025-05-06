-- Create dependency settings table
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  auto_update_enabled BOOLEAN DEFAULT false,
  conservative_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (auto_update_enabled, conservative_mode)
VALUES (false, true)
ON CONFLICT DO NOTHING;

-- Create dependency locks table
CREATE TABLE IF NOT EXISTS dependency_locks (
  id SERIAL PRIMARY KEY,
  package_name TEXT NOT NULL UNIQUE,
  locked BOOLEAN DEFAULT true,
  locked_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_locks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependency settings
CREATE POLICY "Allow authenticated users to read dependency settings"
ON dependency_settings
FOR SELECT
TO authenticated;

-- Allow authenticated users to update dependency settings
CREATE POLICY "Allow authenticated users to update dependency settings"
ON dependency_settings
FOR UPDATE
TO authenticated;

-- Allow authenticated users to read dependency locks
CREATE POLICY "Allow authenticated users to read dependency locks"
ON dependency_locks
FOR SELECT
TO authenticated;

-- Allow authenticated users to insert dependency locks
CREATE POLICY "Allow authenticated users to insert dependency locks"
ON dependency_locks
FOR INSERT
TO authenticated;

-- Allow authenticated users to update dependency locks
CREATE POLICY "Allow authenticated users to update dependency locks"
ON dependency_locks
FOR UPDATE
TO authenticated;

-- Allow authenticated users to delete dependency locks
CREATE POLICY "Allow authenticated users to delete dependency locks"
ON dependency_locks
FOR DELETE
TO authenticated;
