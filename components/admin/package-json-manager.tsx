"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, FileText, Download, RefreshCw, Check } from "lucide-react"

export default function PackageJsonManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packageJson, setPackageJson] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  const generatePackageJson = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/dependencies/generate-package-json")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate package.json")
      }

      const data = await response.json()
      setPackageJson(data.packageJson)
      setSuccess(true)
    } catch (err) {
      console.error("Error generating package.json:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const downloadPackageJson = () => {
    if (!packageJson) return

    const jsonString = JSON.stringify(packageJson, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "package.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Package.json Manager
        </CardTitle>
        <CardDescription>Generate and manage your package.json file based on installed dependencies</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-white p-4 rounded-md mb-4 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-800 text-white p-4 rounded-md mb-4 flex items-center">
            <Check className="mr-2 h-5 w-5" />
            <span>Successfully generated package.json</span>
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-400">
            This tool will scan your installed dependencies and generate a complete package.json file. This is useful if
            your package.json is incomplete or missing dependencies.
          </p>

          <div className="flex space-x-2">
            <Button onClick={generatePackageJson} disabled={loading} className="flex items-center">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate package.json
                </>
              )}
            </Button>

            {packageJson && (
              <Button onClick={downloadPackageJson} variant="outline" className="flex items-center border-gray-700">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>

          {packageJson && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Generated package.json:</h3>
              <div className="bg-gray-950 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs text-gray-300">{JSON.stringify(packageJson, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
