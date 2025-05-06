"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Copy, Check, AlertCircle } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// Extremely simplified SQL script - just creates tables without complex RLS
const COMPLETE_SETUP_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
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
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bts_images table
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filesize INTEGER,
  filetype TEXT,
  public_url TEXT,
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

-- Create a simple security table
CREATE TABLE IF NOT EXISTS security (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create simple indexes
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON bts_images(project_id);
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
        const requiredTables = ["projects", "site_settings", "bts_images", "media", "contact_messages", "security"]

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
            Database Setup Required
          </DialogTitle>
          <DialogDescription>
            Your portfolio needs database tables to work properly. Copy and run this simple SQL script in Supabase.
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
              <h3 className="font-medium">Simple SQL Setup Script</h3>
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

          <div className="bg-blue-900/20 border border-blue-800 rounded-md p-4">
            <h3 className="font-medium text-blue-400 mb-2">Quick Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-300 space-y-2">
              <li>Copy the SQL code above</li>
              <li>Go to Supabase → SQL Editor</li>
              <li>Paste the code and click "Run"</li>
              <li>Refresh this page</li>
            </ol>
          </div>

          {missingTables.length > 0 && (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
              <h3 className="font-medium text-red-400 mb-2">Missing Tables:</h3>
              <ul className="list-disc list-inside text-red-300">
                {missingTables.map((table) => (
                  <li key={table}>{table}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
