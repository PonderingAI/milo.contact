"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Copy, Check, AlertCircle } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// Complete SQL script to set up all required tables
const COMPLETE_SETUP_SQL = `
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_roles table first (since other policies reference it)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  thumbnail_url TEXT,
  category TEXT,
  featured BOOLEAN DEFAULT false,
  date DATE,
  client TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Portfolio Site',
  site_description TEXT DEFAULT 'My professional portfolio',
  contact_email TEXT,
  social_links JSONB DEFAULT '{}',
  hero_image TEXT,
  about_image TEXT,
  about_text TEXT,
  services JSONB DEFAULT '[]',
  meta_image TEXT,
  favicon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bts_images table (behind the scenes images)
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media table
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

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Create dependencies table
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

-- Create dependency_settings table
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(50) DEFAULT 'conservative',
  auto_update_enabled BOOLEAN DEFAULT FALSE,
  update_schedule VARCHAR(100) DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
VALUES ('conservative', FALSE, 'daily')
ON CONFLICT DO NOTHING;

-- Create security_audits table
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

-- Add RLS policies for all tables
-- User roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own roles" ON user_roles 
  FOR SELECT USING (auth.uid() = user_id);
  
-- This policy needs to be created differently since we don't have any admins yet
-- We'll create a basic policy that allows the first user to become an admin
CREATE POLICY "Allow initial admin setup" ON user_roles 
  FOR INSERT WITH CHECK (true);
  
-- Once we have at least one admin, we can create policies that check for admin role
CREATE POLICY "Allow admins to manage user roles" ON user_roles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to projects" ON projects 
  FOR SELECT USING (true);
CREATE POLICY "Allow admin write access to projects" ON projects 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Site settings table
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to site_settings" ON site_settings 
  FOR SELECT USING (true);
CREATE POLICY "Allow admin write access to site_settings" ON site_settings 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- BTS images table
ALTER TABLE bts_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to bts_images" ON bts_images 
  FOR SELECT USING (true);
CREATE POLICY "Allow admin write access to bts_images" ON bts_images 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Media table
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to media" ON media 
  FOR SELECT USING (true);
CREATE POLICY "Allow admin write access to media" ON media 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Contact messages table
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to insert messages" ON contact_messages 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admins to read messages" ON contact_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );
CREATE POLICY "Allow admins to update messages" ON contact_messages 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Dependencies table
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read dependencies" ON dependencies 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage dependencies" ON dependencies 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Dependency settings table
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read dependency settings" ON dependency_settings 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage dependency settings" ON dependency_settings 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Security audits table
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read security audits" ON security_audits 
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admins to manage security audits" ON security_audits 
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON bts_images(project_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Database Tables Setup Required
          </DialogTitle>
          <DialogDescription>
            Your portfolio requires database tables that are currently missing. Copy the SQL below and run it in your
            Supabase SQL Editor.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-gray-800/50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-none"
                size="lg"
              >
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

          <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
            <h3 className="font-medium text-red-400 mb-2">Missing Tables:</h3>
            <ul className="list-disc list-inside text-red-300">
              {missingTables.map((table) => (
                <li key={table}>{table}</li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-md p-4">
            <h3 className="font-medium text-blue-400 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-300 space-y-2">
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
