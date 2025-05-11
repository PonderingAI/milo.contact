"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function SetupDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<{
    tables: boolean
    seed: boolean
    storage: boolean
    settings: boolean
    error?: string
  }>({
    tables: false,
    seed: false,
    storage: false,
    settings: false,
  })

  const setupDatabase = async () => {
    setLoading(true)
    setSetupStatus({
      tables: false,
      seed: false,
      storage: false,
      settings: false,
    })

    try {
      // Step 1: Create tables
      const tablesRes = await fetch("/api/setup-database", {
        method: "POST",
      })
      const tablesData = await tablesRes.json()

      if (!tablesData.success) {
        throw new Error(`Failed to create tables: ${tablesData.error}`)
      }

      setSetupStatus((prev) => ({ ...prev, tables: true }))

      // Step 2: Seed database with sample data
      const seedRes = await fetch("/api/seed-database", {
        method: "POST",
      })
      const seedData = await seedRes.json()

      if (!seedData.success) {
        throw new Error(`Failed to seed database: ${seedData.error}`)
      }

      setSetupStatus((prev) => ({ ...prev, seed: true }))

      // Step 3: Set up storage buckets
      const storageRes = await fetch("/api/setup-storage", {
        method: "POST",
      })
      const storageData = await storageRes.json()

      if (!storageData.success) {
        throw new Error(`Failed to set up storage: ${storageData.error}`)
      }

      setSetupStatus((prev) => ({ ...prev, storage: true }))

      // Step 4: Set up site settings table
      const settingsRes = await fetch("/api/setup-site-settings", {
        method: "POST",
      })
      const settingsData = await settingsRes.json()

      if (!settingsData.success) {
        throw new Error(`Failed to set up site settings: ${settingsData.error}`)
      }

      setSetupStatus((prev) => ({ ...prev, settings: true }))

      // Wait a moment before redirecting
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } catch (error: any) {
      console.error("Setup error:", error)
      setSetupStatus((prev) => ({ ...prev, error: error.message }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl">Database Setup</CardTitle>
          <CardDescription>Set up the database for your portfolio site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            This will create the necessary tables and seed them with sample data. You can customize the content later.
          </p>

          {setupStatus.error && (
            <div className="bg-red-900/30 border border-red-800 rounded-md p-3 text-sm">
              <p className="font-medium text-red-400">Error:</p>
              <p className="text-red-300">{setupStatus.error}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center">
              {setupStatus.tables ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-gray-600 mr-2" />
              )}
              <span>Create database tables</span>
            </div>

            <div className="flex items-center">
              {setupStatus.seed ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-gray-600 mr-2" />
              )}
              <span>Seed database with sample data</span>
            </div>

            <div className="flex items-center">
              {setupStatus.storage ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-gray-600 mr-2" />
              )}
              <span>Set up storage buckets</span>
            </div>

            <div className="flex items-center">
              {setupStatus.settings ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-gray-600 mr-2" />
              )}
              <span>Set up site settings</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={setupDatabase} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Set Up Database"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
