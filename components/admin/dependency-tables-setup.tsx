"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Copy, Check, AlertCircle } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// SQL for creating dependency tables
const DEPENDENCY_TABLES_SQL = `
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  is_dev BOOLEAN DEFAULT FALSE,
  outdated BOOLEAN DEFAULT FALSE,
  description TEXT,
  security_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
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

-- Insert default settings if none exist
INSERT INTO dependency_settings (update_mode, auto_update_enabled, update_schedule)
SELECT 'conservative', FALSE, 'daily'
WHERE NOT EXISTS (SELECT 1 FROM dependency_settings);

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

-- Enable RLS on tables
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

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
`

export default function DependencyTablesSetup() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(DEPENDENCY_TABLES_SQL.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="mb-6">
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        Set Up Dependency Tables
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Dependency Tables Setup
            </DialogTitle>
            <DialogDescription>
              Copy the SQL below and run it in your Supabase SQL Editor to set up the dependency management tables.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2" size="lg">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy SQL"}
                </Button>
                <h3 className="font-medium">SQL Setup Script</h3>
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
                  {DEPENDENCY_TABLES_SQL.trim()}
                </SyntaxHighlighter>
              </div>
            </div>

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
    </div>
  )
}
