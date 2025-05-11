"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{
    database?: { success: boolean; message: string }
    siteSettings?: { success: boolean; message: string }
    storage?: { success: boolean; message: string }
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const runSetup = async () => {
    setIsLoading(true)
    setResults({})
    setError(null)
    setSuccess(false)

    try {
      // Run the comprehensive setup endpoint
      const response = await fetch("/api/setup-all")
      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setResults(data.results)
      } else {
        setError(data.error || "Setup failed. Please check the console for details.")
        setResults(data.results || {})
      }
    } catch (err) {
      console.error("Setup error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-3xl">Portfolio Setup</CardTitle>
          <CardDescription>Set up your portfolio database, storage, and default settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This setup process will:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create necessary database tables (projects, site_settings)</li>
            <li>Set up storage buckets for media and icons</li>
            <li>Initialize default site settings</li>
          </ul>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-md">
              <p className="text-red-400 flex items-center">
                <XCircle className="w-5 h-5 mr-2" />
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-md">
              <p className="text-green-400 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Setup completed successfully!
              </p>
            </div>
          )}

          {Object.entries(results).length > 0 && (
            <div className="mt-6 space-y-4 border border-gray-800 rounded-md p-4">
              <h3 className="text-xl font-medium">Setup Results</h3>
              {results.database && (
                <div className="flex items-center gap-2">
                  {results.database.success ? (
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  ) : (
                    <XCircle className="text-red-500 w-5 h-5" />
                  )}
                  <span>Database: {results.database.message}</span>
                </div>
              )}
              {results.siteSettings && (
                <div className="flex items-center gap-2">
                  {results.siteSettings.success ? (
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  ) : (
                    <XCircle className="text-red-500 w-5 h-5" />
                  )}
                  <span>Settings: {results.siteSettings.message}</span>
                </div>
              )}
              {results.storage && (
                <div className="flex items-center gap-2">
                  {results.storage.success ? (
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  ) : (
                    <XCircle className="text-red-500 w-5 h-5" />
                  )}
                  <span>Storage: {results.storage.message}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button onClick={runSetup} disabled={isLoading || success} className="bg-white text-black hover:bg-gray-200">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Up...
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
