import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Import the SQL from setup-tables-popup.tsx
const COMPLETE_SETUP_SQL = `
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- CRITICAL: Add the role column to user_roles if it doesn't exist
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS role TEXT;

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image TEXT,
  thumbnail_url TEXT,
  category TEXT,
  type TEXT,
  role TEXT,
  date DATE,
  client TEXT,
  url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to projects table if they don't exist
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bts_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to bts_images table if they don't exist
ALTER TABLE bts_images 
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create media table if it doesn't exist
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filesize INTEGER,
  filetype TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Add columns to contact_messages table if they don't exist
ALTER TABLE contact_messages 
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Create dependencies table if it doesn't exist
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
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

-- Add UNIQUE constraint to dependencies.name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dependencies_name_key'
  ) THEN
    ALTER TABLE dependencies ADD CONSTRAINT dependencies_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add unique constraint to dependencies.name: %', SQLERRM;
END $$;

-- Create dependency_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative',
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if they don't exist
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('conservative', FALSE, 'daily')
ON CONFLICT DO NOTHING;

-- Create security_audits table if it doesn't exist
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

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bts_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

-- Create basic policies
-- Allow public read access to most tables
DO $$
BEGIN
  -- Create policies (will error if they already exist, so we'll catch those errors)
  BEGIN
    CREATE POLICY "public_select" ON projects FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, continue
  END;
  
  BEGIN
    CREATE POLICY "public_select" ON site_settings FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, continue
  END;
  
  BEGIN
    CREATE POLICY "public_select" ON bts_images FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, continue
  END;
  
  BEGIN
    CREATE POLICY "public_select" ON media FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, continue
  END;
  
  BEGIN
    -- Allow contact form submissions
    CREATE POLICY "public_insert" ON contact_messages FOR INSERT WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, continue
  END;
END $$;

-- Create indexes for better performance
-- First ensure columns exist, then create indexes

-- User roles indexes
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS role TEXT;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Projects indexes
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);

-- BTS images indexes
ALTER TABLE bts_images 
  ADD COLUMN IF NOT EXISTS project_id UUID;

CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON bts_images(project_id);

-- Contact messages indexes
ALTER TABLE contact_messages 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);
`

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

    // Execute the SQL
    try {
      const { error } = await supabase.rpc("run_sql", { sql: COMPLETE_SETUP_SQL })

      if (error) {
        console.error("Error setting up tables:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } catch (sqlError) {
      console.error("Error executing SQL:", sqlError)

      // Try an alternative approach - execute the SQL directly
      try {
        const { error } = await supabase.rpc("exec_sql", { sql_query: COMPLETE_SETUP_SQL })

        if (error) {
          console.error("Error executing SQL via exec_sql:", error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      } catch (execError) {
        console.error("Error executing SQL via exec_sql:", execError)
        return NextResponse.json(
          {
            error: "Failed to set up tables",
            details: execError instanceof Error ? execError.message : String(execError),
          },
          { status: 500 },
        )
      }
    }

    // Initialize dependencies from package.json
    try {
      await fetch("http://localhost:3000/api/dependencies/initialize", {
        method: "POST",
      })
    } catch (initError) {
      console.error("Error initializing dependencies:", initError)
      // Continue even if initialization fails
    }

    return NextResponse.json({ success: true, message: "Tables set up successfully" })
  } catch (error) {
    console.error("Error in setup API:", error)
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
