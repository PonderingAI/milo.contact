"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, AlertCircle, Database, RefreshCw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Define table configurations with their SQL and dependencies
const TABLE_CONFIGS = {
  projects: {
    name: "Projects",
    description: "Stores project information including titles, descriptions, and metadata.",
    sql: `
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

-- Add columns if they don't exist
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'public_select'
  ) THEN
    CREATE POLICY "public_select" ON projects FOR SELECT USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: [],
    required: true,
  },
  site_settings: {
    name: "Site Settings",
    description: "Stores website configuration like title, description, and theme settings.",
    sql: `
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'public_select'
  ) THEN
    CREATE POLICY "public_select" ON site_settings FOR SELECT USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: [],
    required: true,
  },
  bts_images: {
    name: "Behind-the-Scenes Images",
    description: "Stores images showing the behind-the-scenes process for projects.",
    sql: `
CREATE TABLE IF NOT EXISTS bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE bts_images 
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bts_images_project_id ON bts_images(project_id);

-- Enable RLS
ALTER TABLE bts_images ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bts_images' AND policyname = 'public_select'
  ) THEN
    CREATE POLICY "public_select" ON bts_images FOR SELECT USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: ["projects"],
    required: false,
  },
  media: {
    name: "Media Library",
    description: "Stores uploaded media files like images and videos.",
    sql: `
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

-- Enable RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'public_select'
  ) THEN
    CREATE POLICY "public_select" ON media FOR SELECT USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: [],
    required: false,
  },
  contact_messages: {
    name: "Contact Messages",
    description: "Stores messages from the contact form.",
    sql: `
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Add columns if they don't exist
ALTER TABLE contact_messages 
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'public_insert'
  ) THEN
    CREATE POLICY "public_insert" ON contact_messages FOR INSERT WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: [],
    required: false,
  },
  dependencies: {
    name: "Dependencies",
    description: "Tracks project dependencies and their versions.",
    sql: `
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

-- Enable RLS
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'authenticated_select'
  ) THEN
    CREATE POLICY "authenticated_select" ON dependencies FOR SELECT TO authenticated USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: [],
    required: false,
  },
  dependency_settings: {
    name: "Dependency Settings",
    description: "Stores settings for dependency management.",
    sql: `
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

-- Enable RLS
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'authenticated_select'
  ) THEN
    CREATE POLICY "authenticated_select" ON dependency_settings FOR SELECT TO authenticated USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: ["dependencies"],
    required: false,
  },
  user_roles: {
    name: "User Roles",
    description: "Stores user roles for permission management.",
    sql: `
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'authenticated_select'
  ) THEN
    CREATE POLICY "authenticated_select" ON user_roles FOR SELECT TO authenticated USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`,
    dependencies: [],
    required: true,
  },
}

interface DatabaseSetupPopupProps {
  onSetupComplete?: () => void
  requiredTables?: string[]
  isAdmin?: boolean
}

export default function DatabaseSetupPopup({
  onSetupComplete,
  requiredTables = Object.keys(TABLE_CONFIGS),
  isAdmin = true,
}: DatabaseSetupPopupProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")

  // Filter tables based on required tables and dependencies
  const filteredTableConfigs = Object.entries(TABLE_CONFIGS)
    .filter(([key]) => requiredTables.includes(key))
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value
        return acc
      },
      {} as typeof TABLE_CONFIGS,
    )

  // Check which tables exist
  const checkTables = async () => {
    if (!isAdmin) return

    setChecking(true)
    setLoading(true)
    setError(null)

    try {
      const missingTablesList: string[] = []

      for (const table of Object.keys(filteredTableConfigs)) {
        try {
          const res = await fetch(`/api/check-table-exists?table=${table}`)
          const data = await res.json()

          if (!data.exists) {
            missingTablesList.push(table)
          }
        } catch (err) {
          console.error(`Error checking if ${table} exists:`, err)
          // If we can't check, assume table is missing
          missingTablesList.push(table)
        }
      }

      setMissingTables(missingTablesList)
      setSelectedTables(missingTablesList)

      // Only open popup if there are missing tables and we're in admin mode
      if (missingTablesList.length > 0 && isAdmin) {
        setOpen(true)
      }
    } catch (error) {
      console.error("Error checking tables:", error)
      setError("Failed to check database tables. Please try again.")
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  // Run table check on component mount
  useEffect(() => {
    checkTables()
  }, [])

  // Generate SQL for selected tables
  const generateSQL = () => {
    // Start with UUID extension
    let sql = `-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`

    // Add SQL for each selected table, respecting dependencies
    const processedTables = new Set<string>()
    const processTable = (tableKey: string) => {
      if (processedTables.has(tableKey)) return

      // Process dependencies first
      const config = TABLE_CONFIGS[tableKey]
      if (config) {
        for (const dep of config.dependencies) {
          if (selectedTables.includes(dep)) {
            processTable(dep)
          }
        }

        // Add this table's SQL
        sql += `-- Setup for ${config.name} table\n`
        sql += config.sql
        sql += "\n\n"

        processedTables.add(tableKey)
      }
    }

    // Process all selected tables
    for (const table of selectedTables) {
      processTable(table)
    }

    return sql.trim()
  }

  const combinedSQL = generateSQL()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(combinedSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const executeSQL = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: combinedSQL }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Failed to execute SQL")
      }

      setSuccess("Database tables created successfully!")

      // Recheck tables after successful execution
      await checkTables()

      // If no more missing tables, close the popup and call onSetupComplete
      if (missingTables.length === 0) {
        setOpen(false)
        if (onSetupComplete) {
          onSetupComplete()
        }
      }
    } catch (err) {
      console.error("Error executing SQL:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleManualSetup = () => {
    setOpen(false)
    if (onSetupComplete) {
      onSetupComplete()
    }
  }

  const handleTableSelection = (tableKey: string, checked: boolean) => {
    setSelectedTables((prev) => (checked ? [...prev, tableKey] : prev.filter((t) => t !== tableKey)))
  }

  // If not admin or no missing tables, don't render anything
  if (!isAdmin || (missingTables.length === 0 && !loading)) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Database className="h-5 w-5 text-blue-500" />
            Database Setup Required
          </DialogTitle>
          <DialogDescription>
            Your website requires database tables that are currently missing. Select the tables you need and run the
            SQL.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>{success}</p>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Required Tables</h3>
              <Button
                onClick={checkTables}
                variant="outline"
                size="sm"
                disabled={checking}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking..." : "Recheck Tables"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {Object.entries(filteredTableConfigs)
                .filter(([key]) => missingTables.includes(key))
                .map(([key, config]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <Checkbox
                      id={`table-${key}`}
                      checked={selectedTables.includes(key)}
                      onCheckedChange={(checked) => handleTableSelection(key, checked === true)}
                      disabled={config.required}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`table-${key}`}
                        className={`font-medium ${config.required ? "text-blue-500" : ""}`}
                      >
                        {config.name}
                        {config.required && <span className="ml-2 text-xs">(Required)</span>}
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
                    </div>
                  </div>
                ))}
            </div>

            {missingTables.length === 0 ? (
              <div className="text-center py-4 text-green-600">All required tables exist! No setup needed.</div>
            ) : (
              <>
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">Combined SQL</TabsTrigger>
                    {selectedTables.map((table) => (
                      <TabsTrigger key={table} value={table}>
                        {TABLE_CONFIGS[table]?.name || table}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Complete SQL Setup Script</h3>
                        <Button
                          onClick={copyToClipboard}
                          variant="outline"
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copied!" : "Copy SQL"}
                        </Button>
                      </div>

                      <div className="max-h-[50vh] overflow-auto rounded-md">
                        <Textarea value={combinedSQL} readOnly className="font-mono text-sm h-64" />
                      </div>
                    </div>
                  </TabsContent>

                  {selectedTables.map((table) => (
                    <TabsContent key={table} value={table}>
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{TABLE_CONFIGS[table]?.name || table} SQL</h3>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(TABLE_CONFIGS[table]?.sql || "")
                              setCopied(true)
                              setTimeout(() => setCopied(false), 3000)
                            }}
                            variant="outline"
                            className="flex items-center gap-2"
                            size="sm"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Copy SQL"}
                          </Button>
                        </div>

                        <div className="max-h-[50vh] overflow-auto rounded-md">
                          <Textarea
                            value={TABLE_CONFIGS[table]?.sql || ""}
                            readOnly
                            className="font-mono text-sm h-64"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 mt-4">
                  <h3 className="font-medium mb-2">Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Copy the SQL code above using the "Copy SQL" button</li>
                    <li>Go to your Supabase project dashboard</li>
                    <li>Click on "SQL Editor" in the left sidebar</li>
                    <li>Paste the SQL code into the editor</li>
                    <li>Click "Run" to execute the SQL and create all required tables</li>
                    <li>Return to your website and refresh the page</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleManualSetup}>
            I've Run the SQL Manually
          </Button>
          <Button onClick={executeSQL} disabled={loading || selectedTables.length === 0}>
            {loading ? "Setting Up..." : "Run SQL Automatically"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
