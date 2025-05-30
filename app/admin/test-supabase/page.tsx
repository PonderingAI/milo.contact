"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSupabasePage() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [directCheckResult, setDirectCheckResult] = useState<any>(null)
  const [loading, setLoading] = useState<{ diagnostic: boolean; directCheck: boolean }>({
    diagnostic: false,
    directCheck: false,
  })
  const [error, setError] = useState<{ diagnostic: string | null; directCheck: string | null }>({
    diagnostic: null,
    directCheck: null,
  })

  const runDiagnostic = async () => {
    setLoading((prev) => ({ ...prev, diagnostic: true }))
    setError((prev) => ({ ...prev, diagnostic: null }))

    try {
      const response = await fetch("/api/supabase-diagnostic")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDiagnosticResult(data)
    } catch (err) {
      setError((prev) => ({
        ...prev,
        diagnostic: err instanceof Error ? err.message : "Unknown error",
      }))
    } finally {
      setLoading((prev) => ({ ...prev, diagnostic: false }))
    }
  }

  const runDirectCheck = async () => {
    setLoading((prev) => ({ ...prev, directCheck: true }))
    setError((prev) => ({ ...prev, directCheck: null }))

    try {
      const response = await fetch("/api/direct-table-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tables: ["projects", "settings", "users"],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDirectCheckResult(data)
    } catch (err) {
      setError((prev) => ({
        ...prev,
        directCheck: err instanceof Error ? err.message : "Unknown error",
      }))
    } finally {
      setLoading((prev) => ({ ...prev, directCheck: false }))
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Supabase Connection Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Diagnostic</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runDiagnostic} disabled={loading.diagnostic} className="mb-4">
              {loading.diagnostic ? "Running..." : "Run Diagnostic"}
            </Button>

            {error.diagnostic && <div className="text-red-500 mb-4">Error: {error.diagnostic}</div>}

            {diagnosticResult && (
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(diagnosticResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Direct Table Check</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runDirectCheck} disabled={loading.directCheck} className="mb-4">
              {loading.directCheck ? "Checking..." : "Check Tables"}
            </Button>

            {error.directCheck && <div className="text-red-500 mb-4">Error: {error.directCheck}</div>}

            {directCheckResult && (
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(directCheckResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
