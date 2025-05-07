import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createAdminClient()

    // Check if tables already exist
    try {
      const { data: depsExists, error: depsError } = await supabase.rpc("check_table_exists", {
        table_name: "dependencies",
      })

      const { data: settingsExists, error: settingsError } = await supabase.rpc("check_table_exists", {
        table_name: "dependency_settings",
      })

      // If both tables exist, we're done
      if (depsExists && settingsExists) {
        return NextResponse.json({
          success: true,
          message: "Dependency tables already exist",
          alreadyExists: true,
        })
      }
    } catch (checkError) {
      console.error("Error checking if tables exist:", checkError)
      // Continue with setup even if check fails
    }

    // SQL to create the dependencies tables
    const sql = `
-- Create dependencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'global', -- 'manual', 'auto', 'conservative', 'global'
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_security_update BOOLEAN DEFAULT FALSE,
  is_dev BOOLEAN DEFAULT FALSE,
  outdated BOOLEAN DEFAULT FALSE,
  description TEXT,
  security_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the unique constraint on name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dependencies_name_key' AND conrelid = 'dependencies'::regclass
  ) THEN
    ALTER TABLE dependencies ADD CONSTRAINT dependencies_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, which is fine since we just created it
    NULL;
END $$;

-- Create dependency settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative', -- 'manual', 'auto', 'conservative'
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if none exist
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
SELECT 'conservative', FALSE, 'daily'
WHERE NOT EXISTS (SELECT 1 FROM dependency_settings);

-- Enable RLS on dependencies table
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on dependency_settings table
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for dependencies table
DO $$
BEGIN
  -- Allow authenticated users to read dependencies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' AND policyname = 'Allow authenticated users to read dependencies'
  ) THEN
    CREATE POLICY "Allow authenticated users to read dependencies"
    ON dependencies
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
  
  -- Allow authenticated users to insert dependencies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' AND policyname = 'Allow authenticated users to insert dependencies'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert dependencies"
    ON dependencies
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
  
  -- Allow authenticated users to update dependencies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' AND policyname = 'Allow authenticated users to update dependencies'
  ) THEN
    CREATE POLICY "Allow authenticated users to update dependencies"
    ON dependencies
    FOR UPDATE
    TO authenticated
    USING (true);
  END IF;
  
  -- Allow authenticated users to delete dependencies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependencies' AND policyname = 'Allow authenticated users to delete dependencies'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete dependencies"
    ON dependencies
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, which is fine since we just created it
    NULL;
END $$;

-- Create policies for dependency_settings table
DO $$
BEGIN
  -- Allow authenticated users to read dependency settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependency_settings' AND policyname = 'Allow authenticated users to read dependency settings'
  ) THEN
    CREATE POLICY "Allow authenticated users to read dependency settings"
    ON dependency_settings
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
  
  -- Allow authenticated users to update dependency settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dependency_settings' AND policyname = 'Allow authenticated users to update dependency settings'
  ) THEN
    CREATE POLICY "Allow authenticated users to update dependency settings"
    ON dependency_settings
    FOR UPDATE
    TO authenticated
    USING (true);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, which is fine since we just created it
    NULL;
END $$;

-- Create a function to check if dependency tables exist
CREATE OR REPLACE FUNCTION check_dependency_tables_exist()
RETURNS BOOLEAN AS $$
DECLARE
  deps_exists BOOLEAN;
  settings_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dependencies'
  ) INTO deps_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dependency_settings'
  ) INTO settings_exists;
  
  RETURN deps_exists AND settings_exists;
END;
$$ LANGUAGE plpgsql;
    `

    // Execute the SQL
    try {
      const { error } = await supabase.rpc("run_sql", { sql })

      if (error) {
        console.error("Error setting up dependencies tables:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } catch (sqlError) {
      console.error("Error executing SQL:", sqlError)

      // Try an alternative approach - execute the SQL directly
      try {
        const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

        if (error) {
          console.error("Error executing SQL via exec_sql:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      } catch (execError) {
        console.error("Error executing SQL via exec_sql:", execError)
        return NextResponse.json(
          {
            error: "Failed to set up dependency tables",
            details: execError instanceof Error ? execError.message : String(execError),
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true, message: "Dependencies tables set up successfully" })
  } catch (error) {
    console.error("Error in setup-dependencies-tables API:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Redirect to POST for convenience
  return POST()
}
