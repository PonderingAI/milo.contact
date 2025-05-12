-- Table for storing dependency compatibility information
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
  breaking_versions JSONB,  -- Store known breaking versions and why they break
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on package_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_dependency_compatibility_package_name
ON dependency_compatibility(package_name);

-- Add RLS policies
ALTER TABLE dependency_compatibility ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependency compatibility information
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

-- Allow authenticated users with admin role to manage dependency compatibility
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
