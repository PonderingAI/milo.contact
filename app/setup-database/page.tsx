"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SetupDatabasePage() {
  const [isCreating, setIsCreating] = useState(false)
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [seedingStatus, setSeedingStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [storageStatus, setStorageStatus] = useState<{ success: boolean; message: string } | null>(null)

  const createTables = async () => {
    setIsCreating(true)
    setStatus(null)

    try {
      // Call our API route to create tables
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create database tables")
      }

      setStatus({
        success: true,
        message: data.message || "Database tables created successfully!",
      })
    } catch (error) {
      console.error("Error setting up database:", error)
      setStatus({
        success: false,
        message: `Error setting up database: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const seedData = async () => {
    setIsCreating(true)
    setSeedingStatus(null)

    try {
      const response = await fetch("/api/seed-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to seed database")
      }

      setSeedingStatus({
        success: true,
        message: data.message || "Sample data seeded successfully!",
      })
    } catch (error) {
      console.error("Error seeding data:", error)
      setSeedingStatus({
        success: false,
        message: `Error seeding data: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const setupStorage = async () => {
    setIsCreating(true)
    setStorageStatus(null)

    try {
      // Call our API route to set up storage
      const response = await fetch("/api/setup-storage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to set up storage")
      }

      setStorageStatus({
        success: true,
        message: data.message || "Storage set up successfully!",
      })
    } catch (error) {
      console.error("Error setting up storage:", error)
      setStorageStatus({
        success: false,
        message: `Error setting up storage: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-4 mb-12">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif mb-8">Database Setup</h1>

        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-serif mb-4">Step 1: Create Database Tables</h2>
            <p className="mb-6 text-gray-300">
              This will create the necessary tables in your Supabase database for storing projects and BTS images.
            </p>

            <Button onClick={createTables} disabled={isCreating} className="bg-white text-black hover:bg-gray-200 mb-4">
              {isCreating ? "Creating Tables..." : "Create Tables"}
            </Button>

            {status && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  status.success ? "bg-green-900/50 text-green-200" : "bg-red-900/50 text-red-200"
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="mt-6 text-sm text-gray-400">
              <p>This will create the following tables:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>projects - For storing project information</li>
                <li>bts_images - For storing behind-the-scenes images</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-serif mb-4">Step 2: Set Up Storage</h2>
            <p className="mb-6 text-gray-300">
              This will create the necessary storage buckets and folders for your media files.
            </p>

            <Button onClick={setupStorage} disabled={isCreating} className="bg-white text-black hover:bg-gray-200 mb-4">
              {isCreating ? "Setting Up Storage..." : "Set Up Storage"}
            </Button>

            {storageStatus && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  storageStatus.success ? "bg-green-900/50 text-green-200" : "bg-red-900/50 text-red-200"
                }`}
              >
                {storageStatus.message}
              </div>
            )}

            <div className="mt-6 text-sm text-gray-400">
              <p>This will create:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>A "media" storage bucket</li>
                <li>Folders for project images and BTS images</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-8">
            <h2 className="text-2xl font-serif mb-4">Step 3: Seed Sample Data (Optional)</h2>
            <p className="mb-6 text-gray-300">
              This will populate your database with sample project data to get you started. You can replace this with
              your actual projects later.
            </p>

            <Button
              onClick={seedData}
              disabled={isCreating || !status?.success}
              className="bg-white text-black hover:bg-gray-200 mb-4"
            >
              {isCreating ? "Seeding Data..." : "Seed Sample Data"}
            </Button>

            {seedingStatus && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  seedingStatus.success ? "bg-green-900/50 text-green-200" : "bg-red-900/50 text-red-200"
                }`}
              >
                {seedingStatus.message}
              </div>
            )}

            <div className="mt-6 text-sm text-gray-400">
              <p>This will add:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>4 sample projects across different categories</li>
                <li>4 sample BTS images for the projects</li>
              </ul>
            </div>
          </div>

          {status?.success && storageStatus?.success && (
            <div className="mt-8 text-center">
              <p className="text-green-400 mb-4">Setup complete! Your portfolio is ready to use.</p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                >
                  Go to Homepage
                </Link>
                <Link
                  href="/admin"
                  className="inline-block px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                  Go to Admin Panel
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
