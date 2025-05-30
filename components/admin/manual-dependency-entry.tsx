"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase-browser"
import { AlertCircle, Plus, Save } from "lucide-react"

interface ManualDependencyEntryProps {
  onDependencyAdded: () => void
}

export default function ManualDependencyEntry({ onDependencyAdded }: ManualDependencyEntryProps) {
  const [name, setName] = useState("")
  const [currentVersion, setCurrentVersion] = useState("")
  const [latestVersion, setLatestVersion] = useState("")
  const [isDev, setIsDev] = useState(false)
  const [hasSecurityUpdate, setHasSecurityUpdate] = useState(false)
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [bulkInput, setBulkInput] = useState("")
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!name || !currentVersion) {
      setError("Package name and current version are required")
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase.from("dependencies").insert({
        name,
        current_version: currentVersion,
        latest_version: latestVersion || currentVersion,
        is_dev: isDev,
        has_security_update: hasSecurityUpdate,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Reset form
      setName("")
      setCurrentVersion("")
      setLatestVersion("")
      setIsDev(false)
      setHasSecurityUpdate(false)
      setDescription("")

      // Notify parent
      onDependencyAdded()
    } catch (err) {
      console.error("Error adding dependency:", err)
      setError(err instanceof Error ? err.message : "Failed to add dependency")
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkError(null)
    setBulkLoading(true)

    if (!bulkInput.trim()) {
      setBulkError("Please enter some package data")
      setBulkLoading(false)
      return
    }

    try {
      // Try to parse as JSON first (from npm outdated --json)
      let dependencies = []
      try {
        const jsonData = JSON.parse(bulkInput)

        // Format from npm outdated --json
        dependencies = Object.entries(jsonData).map(([name, info]: [string, any]) => ({
          name,
          current_version: info.current || "",
          latest_version: info.latest || "",
          is_dev: false, // Can't determine from npm outdated
          has_security_update: false, // Can't determine from npm outdated
          description: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      } catch (parseError) {
        // Not valid JSON, try line-by-line format (name@version)
        dependencies = bulkInput
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const match = line.match(/^([@\w/-]+)@?(.*)$/)
            if (!match) return null

            const [_, name, version] = match
            return {
              name,
              current_version: version || "0.0.0",
              latest_version: version || "0.0.0",
              is_dev: false,
              has_security_update: false,
              description: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          })
          .filter(Boolean)
      }

      if (dependencies.length === 0) {
        throw new Error("No valid dependencies found in input")
      }

      // Insert dependencies in batches
      const batchSize = 20
      for (let i = 0; i < dependencies.length; i += batchSize) {
        const batch = dependencies.slice(i, i + batchSize)
        const { error: insertError } = await supabase.from("dependencies").insert(batch)

        if (insertError) {
          throw new Error(insertError.message)
        }
      }

      // Reset form
      setBulkInput("")
      setShowBulkInput(false)

      // Notify parent
      onDependencyAdded()
    } catch (err) {
      console.error("Error adding bulk dependencies:", err)
      setBulkError(err instanceof Error ? err.message : "Failed to add dependencies")
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Manual Dependency Entry</h2>
      <p className="mb-4">Add dependencies manually when automatic scanning is unavailable.</p>

      <div className="flex flex-wrap gap-4 mb-4">
        <Button
          variant={showBulkInput ? "default" : "outline"}
          onClick={() => setShowBulkInput(false)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Single Entry
        </Button>

        <Button
          variant={showBulkInput ? "outline" : "default"}
          onClick={() => setShowBulkInput(true)}
          className="flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
      </div>

      {!showBulkInput ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. react"
                required
              />
            </div>

            <div>
              <Label htmlFor="currentVersion">Current Version</Label>
              <Input
                id="currentVersion"
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
                placeholder="e.g. 18.2.0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latestVersion">Latest Version (optional)</Label>
              <Input
                id="latestVersion"
                value={latestVersion}
                onChange={(e) => setLatestVersion(e.target.value)}
                placeholder="e.g. 18.3.0"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Package description"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="isDev" checked={isDev} onCheckedChange={(checked) => setIsDev(checked === true)} />
              <Label htmlFor="isDev">Development Dependency</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasSecurityUpdate"
                checked={hasSecurityUpdate}
                onCheckedChange={(checked) => setHasSecurityUpdate(checked === true)}
              />
              <Label htmlFor="hasSecurityUpdate">Has Security Vulnerability</Label>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Dependency"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          {bulkError && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{bulkError}</p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="bulkInput">Paste JSON from npm outdated or package list</Label>
            <textarea
              id="bulkInput"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={`Paste npm outdated --json output or list of packages (one per line):\n\nreact@18.2.0\nnext@14.0.0\n\nor JSON format:\n\n{"react":{"current":"18.2.0","wanted":"18.2.0","latest":"18.2.0"}}`}
              className="w-full h-40 p-2 bg-gray-700 rounded mt-1"
              required
            />
          </div>

          <div className="text-sm text-gray-400">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>
                JSON output from <code>npm outdated --json</code>
              </li>
              <li>
                One package per line: <code>package-name@version</code>
              </li>
              <li>
                One package per line: <code>package-name</code> (version will be set to 0.0.0)
              </li>
            </ul>
          </div>

          <Button type="submit" disabled={bulkLoading}>
            {bulkLoading ? "Importing..." : "Import Dependencies"}
          </Button>
        </form>
      )}
    </div>
  )
}
