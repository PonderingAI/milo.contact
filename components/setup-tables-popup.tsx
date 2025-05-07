"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Copy, Check, AlertCircle } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// Robust SQL script that adds columns before creating indexes
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

-- Add foreign key if it doesn't exist (wrapped in PL/pgSQL to handle errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bts_images_project_id_fkey'
  ) THEN
    ALTER TABLE bts_images 
      ADD CONSTRAINT bts_images_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN others THEN
    -- If there's an error (like the referenced table doesn't exist yet), just continue
    RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

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
  -- Drop policies if they exist to avoid conflicts
  BEGIN
    DROP POLICY IF EXISTS "public_select" ON projects;
  EXCEPTION WHEN others THEN
    -- Policy doesn't exist, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "public_select" ON site_settings;
  EXCEPTION WHEN others THEN
    -- Policy doesn't exist, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "public_select" ON bts_images;
  EXCEPTION WHEN others THEN
    -- Policy doesn't exist, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "public_select" ON media;
  EXCEPTION WHEN others THEN
    -- Policy doesn't exist, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "public_insert" ON contact_messages;
  EXCEPTION WHEN others THEN
    -- Policy doesn't exist, continue
  END;
  
  -- Create policies
  CREATE POLICY "public_select" ON projects FOR SELECT USING (true);
  CREATE POLICY "public_select" ON site_settings FOR SELECT USING (true);
  CREATE POLICY "public_select" ON bts_images FOR SELECT USING (true);
  CREATE POLICY "public_select" ON media FOR SELECT USING (true);
  
  -- Allow contact form submissions
  CREATE POLICY "public_insert" ON contact_messages FOR INSERT WITH CHECK (true);
END $$;

-- Create indexes for better performance
-- First check if indexes exist to avoid errors
DO $$
BEGIN
  -- Projects indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_category') THEN
    CREATE INDEX idx_projects_category ON projects(category);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_featured') THEN
    CREATE INDEX idx_projects_featured ON projects(featured);
  END IF;
  
  -- BTS images indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bts_images_project_id') THEN
    CREATE INDEX idx_bts_images_project_id ON bts_images(project_id);
  END IF;
  
  -- Contact messages indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contact_messages_created_at') THEN
    CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contact_messages_read') THEN
    CREATE INDEX idx_contact_messages_read ON contact_messages(read);
  END IF;
  
  -- User roles indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_user_id') THEN
    CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_role') THEN
    CREATE INDEX idx_user_roles_role ON user_roles(role);
  END IF;
END $$;
`

export default function SetupTablesPopup() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tablesChecked, setTablesChecked] = useState(false)
  const [missingTables, setMissingTables] = useState<string[]>([])

  useEffect(() => {
    const checkTables = async () => {
      try {
        // Check for required tables
        const requiredTables = [
          "projects",
          "site_settings",
          "bts_images",
          "media",
          "contact_messages",
          "dependencies",
          "dependency_settings",
          "security_audits",
          "user_roles",
        ]

        const missingTablesList: string[] = []

        for (const table of requiredTables) {
          const res = await fetch(`/api/check-table-exists?table=${table}`)
          const data = await res.json()

          if (!data.exists) {
            missingTablesList.push(table)
          }
        }

        setMissingTables(missingTablesList)
        setTablesChecked(true)

        // Open the popup if any tables are missing
        if (missingTablesList.length > 0) {
          setOpen(true)
        }
      } catch (error) {
        console.error("Error checking tables:", error)
        // If we can't check, assume tables are missing
        setOpen(true)
      }
    }

    checkTables()
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(COMPLETE_SETUP_SQL.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  if (!tablesChecked || missingTables.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Database Tables Setup Required
          </DialogTitle>
          <DialogDescription>
            Your portfolio requires database tables that are currently missing. Copy the SQL below and run it in your
            Supabase SQL Editor.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2" size="lg">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy SQL"}
              </Button>
              <h3 className="font-medium">Complete SQL Setup Script</h3>
            </div>

            <div className="max-h-[50vh] overflow-auto rounded-md">
              <SyntaxHighlighter
                language="sql"
                style={vscDarkPlus}
                customStyle={{
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  margin: 0,
                }}
              >
                {COMPLETE_SETUP_SQL.trim()}
              </SyntaxHighlighter>
            </div>
          </div>

          {missingTables.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
              <h3 className="font-medium mb-2">Missing Tables:</h3>
              <ul className="list-disc list-inside">
                {missingTables.map((table) => (
                  <li key={table}>{table}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Copy the SQL code above using the "Copy SQL" button</li>
              <li>Go to your Supabase project dashboard</li>
              <li>Click on "SQL Editor" in the left sidebar</li>
              <li>Paste the SQL code into the editor</li>
              <li>Click "Run" to execute the SQL and create all required tables</li>
              <li>Return to your portfolio site and refresh the page</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
