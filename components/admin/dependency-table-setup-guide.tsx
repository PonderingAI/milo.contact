"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export default function DependencyTableSetupGuide({ onSetupComplete }: { onSetupComplete: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  const securityAuditsTableSQL = `
-- Create security audits table
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

-- Add RLS policies
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read security audits
CREATE POLICY "Allow authenticated users to read security audits"
ON security_audits
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users with admin role to manage security audits
CREATE POLICY "Allow admins to manage security audits"
ON security_audits
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

  const runSQL = async (sql: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // First try the setup-dependencies-tables endpoint
      const response = await fetch("/api/setup-dependencies-tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      if (!response.ok) {
        // If that fails, try the dependencies/setup endpoint
        const setupResponse = await fetch("/api/dependencies/setup", {
          method: "POST",
        })

        if (!setupResponse.ok) {
          const errorData = await setupResponse.json()
          throw new Error(errorData.error || errorData.details || "Failed to execute SQL")
        }

        const setupData = await setupResponse.json()

        if (setupData.success) {
          setSuccess("SQL executed successfully!")
          onSetupComplete()
          return
        } else {
          throw new Error(setupData.error || "Unknown error")
        }
      }

      const data = await response.json()

      if (data.success) {
        setSuccess("SQL executed successfully!")
        onSetupComplete()
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (err) {
      console.error("Error executing SQL:", err)

      // Try one more approach - direct setup
      try {
        const directSetupResponse = await fetch("/api/dependencies/setup", {
          method: "POST",
        })

        if (directSetupResponse.ok) {
          const directSetupData = await directSetupResponse.json()
          if (directSetupData.success) {
            setSuccess("Tables set up successfully!")
            onSetupComplete()
            return
          }
        }

        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } catch (directSetupError) {
        console.error("Error with direct setup:", directSetupError)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
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
      <h2 className="text-xl font-bold mb-4">Dependencies Table Setup</h2>
      <p className="mb-6">
        The dependencies management system requires several database tables to be set up. You can either run the SQL
        directly from this interface or copy it to run manually in your database management tool.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}

      <Tabs defaultValue="dependencies">
        <TabsList className="mb-4">
          <TabsTrigger value="dependencies">Dependencies Table</TabsTrigger>
          <TabsTrigger value="settings">Settings Table</TabsTrigger>
          <TabsTrigger value="audits">Security Audits Table</TabsTrigger>
        </TabsList>

        <TabsContent value="dependencies">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Dependencies Table</h3>
            <p className="mb-2">This table stores information about your project dependencies.</p>
            <Textarea value={dependenciesTableSQL} readOnly className="h-64 font-mono text-sm bg-gray-900 mb-4" />
            <div className="flex gap-2">
              <Button onClick={() => runSQL(dependenciesTableSQL)} disabled={loading}>
                {loading ? "Running..." : "Run SQL"}
              </Button>
              <Button variant="outline" onClick={() => copyToClipboard(dependenciesTableSQL)}>
                Copy SQL
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Dependency Settings Table</h3>
            <p className="mb-2">This table stores global settings for dependency management.</p>
            <Textarea value={dependencySettingsTableSQL} readOnly className="h-64 font-mono text-sm bg-gray-900 mb-4" />
            <div className="flex gap-2">
              <Button onClick={() => runSQL(dependencySettingsTableSQL)} disabled={loading}>
                {loading ? "Running..." : "Run SQL"}
              </Button>
              <Button variant="outline" onClick={() => copyToClipboard(dependencySettingsTableSQL)}>
                Copy SQL
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audits">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Security Audits Table</h3>
            <p className="mb-2">This table stores security audit results for your dependencies.</p>
            <Textarea value={securityAuditsTableSQL} readOnly className="h-64 font-mono text-sm bg-gray-900 mb-4" />
            <div className="flex gap-2">
              <Button onClick={() => runSQL(securityAuditsTableSQL)} disabled={loading}>
                {loading ? "Running..." : "Run SQL"}
              </Button>
              <Button variant="outline" onClick={() => copyToClipboard(securityAuditsTableSQL)}>
                Copy SQL
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <p className="text-sm text-gray-400">
          After setting up the tables, you'll need to add dependencies manually or use the "Add Dependency" button on
          the dependencies page.
        </p>
      </div>
    </div>
  )
}
