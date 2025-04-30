"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const runSetup = async () => {
    setLoading(true)
    setSuccess(false)
    setError(null)
    setLogs(["Starting setup process..."])

    try {
      // Run the setup API
      addLog("Setting up database tables...")
      const response = await fetch("/api/setup-all")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Setup failed")
      }

      addLog("Database tables created successfully")

      // Set up storage buckets
      addLog("Setting up storage buckets...")
      await fetch("/api/setup-storage")
      addLog("Storage buckets created successfully")

      // Set up BTS images table
      addLog("Setting up BTS images table...")
      await fetch("/api/setup-bts-images-table")
      addLog("BTS images table created successfully")

      // Set up site settings
      addLog("Setting up site settings...")
      await fetch("/api/setup-site-settings")
      addLog("Site settings created successfully")

      setSuccess(true)
      addLog("Setup completed successfully!")
    } catch (err) {
      console.error("Setup error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      addLog(`Error: ${err instanceof Error ? err.message : "Unknown error occurred"}`)
    } finally {
      setLoading(false)
    }
  }

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message])
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Portfolio Setup</CardTitle>
          <CardDescription>
            Initialize your portfolio database and storage. This will create all necessary tables and buckets.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <p className="text-gray-400 mb-4">This setup process will:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>Create the site_settings table</li>
              <li>Create the media library table</li>
              <li>Set up storage buckets</li>
              <li>Configure row-level security policies</li>
              <li>Add default settings</li>
            </ul>
          </div>

          {logs.length > 0 && (
            <div className="bg-gray-900 rounded-md p-4 mt-6">
              <p className="text-sm text-gray-400 mb-2">Setup logs:</p>
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <p key={index} className="text-sm font-mono">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center mt-6">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center mt-6">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-400 text-sm">Setup completed successfully!</p>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={runSetup} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Setup...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Setup Complete
              </>
            ) : (
              "Run Setup"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
