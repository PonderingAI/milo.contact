"use client"

import { useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface DependencyTableSetupGuideProps {
  onSetupComplete?: () => void
}

export default function DependencyTableSetupGuide({ onSetupComplete }: DependencyTableSetupGuideProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showSql, setShowSql] = useState(false)

  const handleSetupTable = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/setup-dependencies-table")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to set up dependencies table")
      }

      setSuccess(true)

      if (onSetupComplete) {
        onSetupComplete()
      }
    } catch (err) {
      console.error("Error setting up dependencies table:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const sqlCode = `-- Create dependencies table
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  update_mode VARCHAR(50) DEFAULT 'manual', -- 'manual', 'auto', 'conservative'
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
);`

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(sqlCode)
      .then(() => {
        alert("SQL copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy SQL:", err)
      })
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Dependencies Table Setup</h2>

      <div className="mb-6">
        <p className="mb-4">
          The dependencies table needs to be set up before you can manage your dependencies. You can set it up
          automatically or run the SQL manually.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={handleSetupTable}
            disabled={loading || success}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Setting up..." : success ? "Setup Complete" : "Setup Automatically"}
          </button>

          <button
            onClick={() => setShowSql(!showSql)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {showSql ? "Hide SQL" : "Show SQL"}
          </button>

          {showSql && (
            <button onClick={copyToClipboard} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Copy SQL
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>Dependencies table set up successfully!</p>
          </div>
        )}

        {showSql && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">SQL Setup Code</h3>
            <div className="bg-gray-900 rounded overflow-hidden">
              <SyntaxHighlighter language="sql" style={vscDarkPlus}>
                {sqlCode}
              </SyntaxHighlighter>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              You can run this SQL in the Supabase SQL Editor to set up the dependencies table manually.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
