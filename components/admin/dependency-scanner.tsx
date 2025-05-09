"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Package, AlertCircle, Info } from "lucide-react"

interface DependencyScannerProps {
  onScanComplete?: () => void
  autoScan?: boolean
}

export default function DependencyScanner({ onScanComplete, autoScan = false }: DependencyScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    added?: number
    updated?: number
    errors?: number
    total?: number
  } | null>(null)
  const [error, setError] = useState<{
    message: string
    details?: string
    code?: string
    suggestions?: string[]
  } | null>(null)
  const [hasAutoScanned, setHasAutoScanned] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    // Auto-scan on component mount if autoScan is true and we haven't already auto-scanned
    if (autoScan && !hasAutoScanned && !result) {
      scanDependencies()
      setHasAutoScanned(true)
    }
  }, [autoScan, hasAutoScanned, result])

  const scanDependencies = async () => {
    setScanning(true)
    setResult(null)
    setError(null)
    setDebugInfo(null)

    try {
      const response = await fetch("/api/dependencies/scan", {
        method: "POST",
      })

      const data = await response.json()
      setDebugInfo(data) // Store full response for debugging

      if (!response.ok) {
        // Extract detailed error information
        const errorMessage = data.message || data.error || "Failed to scan dependencies"
        const errorDetails = data.details || data.stack || null
        const errorCode = data.code || null
        const suggestions = data.suggestions || generateSuggestions(errorMessage, response.status)

        throw {
          message: errorMessage,
          details: errorDetails,
          code: errorCode,
          suggestions,
        }
      }

      setResult(data)

      // Call the onScanComplete callback if provided
      if (onScanComplete) {
        onScanComplete()
      }
    } catch (err) {
      console.error("Error scanning dependencies:", err)

      // Format the error for display
      if (err instanceof Error) {
        setError({
          message: err.message,
          details: err.stack,
          suggestions: generateSuggestions(err.message),
        })
      } else if (typeof err === "object" && err !== null) {
        setError(err as any)
      } else {
        setError({
          message: "An unexpected error occurred",
          suggestions: ["Try refreshing the page", "Check your network connection"],
        })
      }
    } finally {
      setScanning(false)
    }
  }

  // Generate helpful suggestions based on the error
  const generateSuggestions = (errorMessage: string, statusCode?: number): string[] => {
    const suggestions: string[] = []

    // Add suggestions based on status code
    if (statusCode === 404) {
      suggestions.push("Make sure the API route exists")
      suggestions.push("Check if the database tables are set up correctly")
    } else if (statusCode === 500) {
      suggestions.push("Check the server logs for more details")
      suggestions.push("Verify your database connection")
    } else if (statusCode === 401 || statusCode === 403) {
      suggestions.push("Make sure you're logged in with the correct permissions")
    }

    // Add suggestions based on error message content
    if (errorMessage.toLowerCase().includes("database")) {
      suggestions.push("Verify your database connection settings")
      suggestions.push("Check if the database tables are set up correctly")
    }

    if (errorMessage.toLowerCase().includes("permission")) {
      suggestions.push("Make sure your database user has the correct permissions")
    }

    if (errorMessage.toLowerCase().includes("package.json")) {
      suggestions.push("Verify that your package.json file exists and is valid")
    }

    if (errorMessage.toLowerCase().includes("npm")) {
      suggestions.push("Make sure npm is installed and accessible")
      suggestions.push("Try running npm commands manually to see if they work")
    }

    // Add general suggestions if none were added
    if (suggestions.length === 0) {
      suggestions.push("Try refreshing the page")
      suggestions.push("Check your network connection")
      suggestions.push("Verify that the server is running")
    }

    return suggestions
  }

  // If auto-scanning and still in progress, show minimal UI
  if (autoScan && scanning && !result && !error) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg mb-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
        <p>Scanning project dependencies...</p>
      </div>
    )
  }

  // If auto-scan completed successfully and no errors, don't show the component at all
  if (autoScan && result && result.success && !error) {
    return null
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
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">{error.message}</p>

              {error.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Error Details</summary>
                  <pre className="mt-2 text-xs bg-red-950/50 p-2 rounded overflow-auto max-h-40">{error.details}</pre>
                </details>
              )}

              {error.suggestions && error.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold">Suggestions:</p>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 flex items-center">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs flex items-center text-red-300 hover:text-white"
                >
                  <Info className="h-3 w-3 mr-1" />
                  {showDebug ? "Hide" : "Show"} Debug Information
                </button>
              </div>

              {showDebug && debugInfo && (
                <pre className="mt-2 text-xs bg-red-950/50 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              )}
            </div>
          </div>
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
        {scanning ? "Scanning..." : result && result.success ? "Scan Again" : "Scan Dependencies"}
      </Button>
    </div>
  )
}
