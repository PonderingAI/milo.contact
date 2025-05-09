"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Package } from "lucide-react"

interface DependencyScannerProps {
  onScanComplete?: () => void
}

export default function DependencyScanner({ onScanComplete }: DependencyScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    added?: number
    updated?: number
    errors?: number
    total?: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scanDependencies = async () => {
    setScanning(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/dependencies/scan", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to scan dependencies")
      }

      setResult(data)

      // Call the onScanComplete callback if provided
      if (onScanComplete) {
        onScanComplete()
      }
    } catch (err) {
      console.error("Error scanning dependencies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-6">
      <div className="flex items-center mb-4">
        <Package className="h-6 w-6 mr-2 text-blue-400" />
        <h2 className="text-xl font-bold">Dependency Scanner</h2>
      </div>

      <p className="mb-4">
        Scan your project to detect installed packages and add them to the dependency management system.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {result && result.success && (
        <div className="bg-green-900/30 border border-green-700 text-green-200 px-4 py-3 rounded mb-4">
          <p className="font-bold">{result.message}</p>
          {result.total && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>Total packages: {result.total}</div>
              <div>Added: {result.added}</div>
              <div>Updated: {result.updated}</div>
              <div>Errors: {result.errors}</div>
            </div>
          )}
        </div>
      )}

      <Button onClick={scanDependencies} disabled={scanning} className="flex items-center">
        <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
        {scanning ? "Scanning..." : "Scan Dependencies"}
      </Button>
    </div>
  )
}
