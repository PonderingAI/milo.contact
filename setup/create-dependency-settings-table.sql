-- Create dependency settings table
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative', -- 'manual', 'auto', 'conservative'
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('conservative', FALSE, 'daily')
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
TO authenticated
USING (true);

-- Allow authenticated users with admin role to manage dependency settings
CREATE POLICY "Allow admins to manage dependency settings"
ON dependency_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

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
