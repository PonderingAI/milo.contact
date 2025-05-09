"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Copy, Database } from "lucide-react"

interface DependencyTableSetupGuideProps {
  onSetupComplete: () => void
}

export default function DependencyTableSetupGuide({ onSetupComplete }: DependencyTableSetupGuideProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const dependenciesTableSQL = `
-- Copy and paste this SQL into your database management tool
-- This will create the necessary tables for dependency management

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

-- Create dependency settings table
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
`.trim()

  const setupAllTables = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/setup-dependencies-tables", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Failed to set up tables")
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || "Tables set up successfully!")
        onSetupComplete()
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (err) {
      console.error("Error setting up tables:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dependenciesTableSQL)
    setCopied(true)
    setSuccess("SQL copied to clipboard!")

    // Reset copied state after 3 seconds
    setTimeout(() => {
      setCopied(false)
    }, 3000)
  }

  const handleDoneManually = () => {
    onSetupComplete()
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center">
            <Database className="h-5 w-5 mr-2" />
            SQL Setup Instructions
          </h3>
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy SQL"}
          </Button>
        </div>

        <p className="mb-4 text-gray-300">
          Copy the SQL below and run it in your database management tool (like Supabase SQL Editor).
        </p>

        <Textarea value={dependenciesTableSQL} readOnly className="h-64 font-mono text-sm bg-gray-900 mb-4" />

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button onClick={setupAllTables} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Setting up tables..." : "Try Automatic Setup"}
          </Button>

          <Button variant="outline" onClick={handleDoneManually}>
            I've Run the SQL Manually
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-400 mt-4">
        <p>
          <strong>Need help?</strong> If you're not familiar with running SQL commands, please contact your developer or
          database administrator for assistance.
        </p>
      </div>
    </div>
  )
}
