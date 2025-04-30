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
    storage?: { success: boolean; message: string }
    settings?: { success: boolean; message: string }
    icons?: { success: boolean; message: string }
  }>({})

  const runSetup = async () => {
    setIsLoading(true)
    setResults({})

    try {
      // Setup database
      const dbRes = await fetch("/api/setup-database")
      const dbData = await dbRes.json()
      setResults((prev) => ({ ...prev, database: dbData }))

      // Setup storage
      const storageRes = await fetch("/api/setup-storage")
      const storageData = await storageRes.json()
      setResults((prev) => ({ ...prev, storage: storageData }))

      // Setup site settings
      const settingsRes = await fetch("/api/setup-site-settings")
      const settingsData = await settingsRes.json()
      setResults((prev) => ({ ...prev, settings: settingsData }))

      // Setup icons bucket
      const iconsRes = await fetch("/api/setup-icons-bucket")
      const iconsData = await iconsRes.json()
      setResults((prev) => ({ ...prev, icons: iconsData }))
    } catch (error) {
      console.error("Setup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const allSuccess =
    results.database?.success && results.storage?.success && results.settings?.success && results.icons?.success

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
            <li>Create necessary database tables</li>
            <li>Set up storage buckets for media</li>
            <li>Initialize default site settings</li>
            <li>Prepare the icons storage</li>
          </ul>

          {Object.entries(results).length > 0 && (
            <div className="mt-6 space-y-4 border border-gray-800 rounded-md p-4">
              <h3 className="text-xl font-medium">Setup Results</h3>
              {results.database && (
                <div className="flex items-center gap-2">
                  {results.database.success ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <span>Database: {results.database.message}</span>
                </div>
              )}
              {results.storage && (
                <div className="flex items-center gap-2">
                  {results.storage.success ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <span>Storage: {results.storage.message}</span>
                </div>
              )}
              {results.settings && (
                <div className="flex items-center gap-2">
                  {results.settings.success ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <span>Settings: {results.settings.message}</span>
                </div>
              )}
              {results.icons && (
                <div className="flex items-center gap-2">
                  {results.icons.success ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <span>Icons: {results.icons.message}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button
            onClick={runSetup}
            disabled={isLoading || allSuccess}
            className="bg-white text-black hover:bg-gray-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Up...
              </>
            ) : allSuccess ? (
              "Setup Complete"
            ) : (
              "Run Setup"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
