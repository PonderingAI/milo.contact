"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function DependencySetupGuide() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sqlOutput, setSqlOutput] = useState<string | null>(null)

  const dependenciesTableSQL = `
-- Create dependencies table
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'global', -- 'manual', 'auto', 'conservative', 'global'
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  has_security_update BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read dependencies
CREATE POLICY "Allow authenticated users to read dependencies"
ON dependencies
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users with admin role to manage dependencies
CREATE POLICY "Allow admins to manage dependencies"
ON dependencies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);
  `.trim()

  const dependencySettingsTableSQL = `
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

-- Add RLS policies
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;

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
  `.trim()

  const setupTables = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setSqlOutput(null)

    try {
      const response = await fetch("/api/dependencies/setup-tables", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to set up tables")
      }

      setSuccess(data.message || "Tables set up successfully!")
      setSqlOutput(JSON.stringify(data, null, 2))
    } catch (err) {
      console.error("Error setting up tables:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess("SQL copied to clipboard!")
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Dependency System Setup</h2>
      <p className="mb-6">
        The dependency management system requires database tables to store information about your project dependencies.
        You can set up these tables automatically or run the SQL manually in your database.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">Error setting up dependency system</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">Success!</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <Button onClick={setupTables} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading ? "Setting up tables..." : "Set Up Tables Automatically"}
        </Button>
        <p className="text-sm text-gray-400 mt-2">
          This will automatically create all necessary tables in your database.
        </p>
      </div>

      {sqlOutput && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">API Response</h3>
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-40 text-sm">{sqlOutput}</pre>
        </div>
      )}

      <Tabs defaultValue="dependencies">
        <TabsList className="mb-4">
          <TabsTrigger value="dependencies">Dependencies Table</TabsTrigger>
          <TabsTrigger value="settings">Settings Table</TabsTrigger>
        </TabsList>

        <TabsContent value="dependencies">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Dependencies Table SQL</h3>
            <p className="mb-2">If automatic setup fails, you can run this SQL manually in your database:</p>
            <Textarea value={dependenciesTableSQL} readOnly className="h-64 font-mono text-sm bg-gray-900 mb-4" />
            <Button variant="outline" onClick={() => copyToClipboard(dependenciesTableSQL)}>
              Copy SQL
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Dependency Settings Table SQL</h3>
            <p className="mb-2">If automatic setup fails, you can run this SQL manually in your database:</p>
            <Textarea value={dependencySettingsTableSQL} readOnly className="h-64 font-mono text-sm bg-gray-900 mb-4" />
            <Button variant="outline" onClick={() => copyToClipboard(dependencySettingsTableSQL)}>
              Copy SQL
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Permission errors:</strong> Make sure your database user has permission to create tables and
            policies.
          </li>
          <li>
            <strong>RPC errors:</strong> If you see errors about missing functions like "exec_sql", you may need to
            create this function first.
          </li>
          <li>
            <strong>Connection issues:</strong> Verify your database connection settings in your environment variables.
          </li>
          <li>
            <strong>Manual setup:</strong> If automatic setup fails, copy the SQL and run it directly in your database
            management tool.
          </li>
        </ul>
      </div>
    </div>
  )
}
