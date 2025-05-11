"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, Copy, Database, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DependencySystemSetupGuideProps {
  onSetupComplete?: () => void
  onDismiss?: () => void
}

export function DependencySystemSetupGuide({ onSetupComplete, onDismiss }: DependencySystemSetupGuideProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const setupSql = `-- Dependencies System Tables

-- Table for dependency settings
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  update_mode VARCHAR(20) DEFAULT 'conservative',
  auto_update BOOLEAN DEFAULT false,
  last_scan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for dependencies
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  current_version VARCHAR(100),
  latest_version VARCHAR(100),
  description TEXT,
  is_dev BOOLEAN DEFAULT false,
  outdated BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  has_security_issue BOOLEAN DEFAULT false,
  security_details JSONB,
  update_mode VARCHAR(20) DEFAULT 'global',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Table for security audits
CREATE TABLE IF NOT EXISTS security_audits (
  id SERIAL PRIMARY KEY,
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vulnerabilities INTEGER DEFAULT 0,
  outdated_packages INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 100,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for update history
CREATE TABLE IF NOT EXISTS dependency_updates (
  id SERIAL PRIMARY KEY,
  dependency_name VARCHAR(255) NOT NULL,
  from_version VARCHAR(100),
  to_version VARCHAR(100),
  update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO dependency_settings (update_mode, auto_update)
SELECT 'conservative', false
WHERE NOT EXISTS (SELECT 1 FROM dependency_settings);`

  const handleAutomaticSetup = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/dependencies/setup", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || data.error || "Failed to set up dependency system")
      }

      setSuccess(true)
      if (onSetupComplete) {
        onSetupComplete()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during setup")
      console.error("Error setting up dependency system:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopySQL = () => {
    navigator.clipboard.writeText(setupSql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Dependency System Setup</CardTitle>
        <CardDescription>
          Set up the dependency management system to track and update your project dependencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              The dependency system has been set up successfully. You can now scan for dependencies.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="automatic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="automatic">Automatic Setup</TabsTrigger>
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
          </TabsList>
          <TabsContent value="automatic" className="p-4 border border-gray-800 rounded-md mt-2">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-900/20 p-2 rounded-full mr-3">
                  <Terminal className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Automatic Setup</h3>
                  <p className="text-gray-400 mt-1">
                    This will automatically create all necessary database tables for the dependency management system.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-md">
                <p className="text-sm text-gray-300 mb-2">The following actions will be performed:</p>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  <li>Create the dependencies table</li>
                  <li>Create the dependency_settings table</li>
                  <li>Create the security_audits table</li>
                  <li>Create the dependency_updates table</li>
                  <li>Initialize default settings</li>
                </ul>
              </div>

              <Button onClick={handleAutomaticSetup} disabled={loading || success} className="w-full">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting Up...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setup Complete
                  </>
                ) : (
                  "Set Up Dependency System"
                )}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="manual" className="p-4 border border-gray-800 rounded-md mt-2">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-purple-900/20 p-2 rounded-full mr-3">
                  <Database className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Manual Setup</h3>
                  <p className="text-gray-400 mt-1">
                    Copy and run the following SQL in your Supabase SQL Editor to set up the dependency system manually.
                  </p>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-gray-800 p-4 rounded-md overflow-auto max-h-80 text-sm text-gray-300">
                  {setupSql}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={handleCopySQL}
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="bg-gray-800 p-4 rounded-md">
                <p className="text-sm text-gray-300 mb-2">After running the SQL:</p>
                <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
                  <li>Return to this page and refresh</li>
                  <li>Click on &quot;Scan Dependencies&quot; to populate the system</li>
                  <li>Run a security audit to check for vulnerabilities</li>
                </ol>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
        {onDismiss && (
          <Button variant="outline" onClick={onDismiss} className="border-gray-700">
            Dismiss
          </Button>
        )}
        {success && onSetupComplete && <Button onClick={onSetupComplete}>Continue</Button>}
      </CardFooter>
    </Card>
  )
}
