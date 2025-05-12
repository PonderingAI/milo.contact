"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DatabaseDebugPage() {
  const [activeTab, setActiveTab] = useState("diagnostic")
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [directCheckResult, setDirectCheckResult] = useState<any>(null)
  const [tablesResult, setTablesResult] = useState<any>(null)
  const [customTables, setCustomTables] = useState<string>("user_roles,site_settings,projects")
  const [loading, setLoading] = useState<Record<string, boolean>>({
    diagnostic: false,
    directCheck: false,
    listTables: false,
  })
  const [error, setError] = useState<Record<string, string | null>>({
    diagnostic: null,
    directCheck: null,
    listTables: null,
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
      // Split the custom tables string into an array
      const tables = customTables
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const response = await fetch("/api/direct-table-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tables }),
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

  const listAllTables = async () => {
    setLoading((prev) => ({ ...prev, listTables: true }))
    setError((prev) => ({ ...prev, listTables: null }))

    try {
      const response = await fetch("/api/list-all-tables")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTablesResult(data)
    } catch (err) {
      setError((prev) => ({
        ...prev,
        listTables: err instanceof Error ? err.message : "Unknown error",
      }))
    } finally {
      setLoading((prev) => ({ ...prev, listTables: false }))
    }
  }

  // Run diagnostic on page load
  useEffect(() => {
    runDiagnostic()
  }, [])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Database Diagnostics</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="diagnostic">Connection Diagnostic</TabsTrigger>
          <TabsTrigger value="tables">Table Check</TabsTrigger>
          <TabsTrigger value="list">List All Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Connection Diagnostic</CardTitle>
              <CardDescription>Tests the connection to Supabase and checks environment variables</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runDiagnostic} disabled={loading.diagnostic} className="mb-4">
                {loading.diagnostic ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Diagnostic"
                )}
              </Button>

              {error.diagnostic && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.diagnostic}</AlertDescription>
                </Alert>
              )}

              {diagnosticResult && (
                <div className="rounded-md overflow-auto max-h-96 border">
                  <pre className="p-4 text-xs">{JSON.stringify(diagnosticResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Direct Table Check</CardTitle>
              <CardDescription>Checks if specific tables exist in your database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="tables">Tables to check (comma-separated)</Label>
                <Input
                  id="tables"
                  value={customTables}
                  onChange={(e) => setCustomTables(e.target.value)}
                  className="mb-2"
                />
                <Button onClick={runDirectCheck} disabled={loading.directCheck}>
                  {loading.directCheck ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Tables"
                  )}
                </Button>
              </div>

              {error.directCheck && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.directCheck}</AlertDescription>
                </Alert>
              )}

              {directCheckResult && (
                <>
                  {directCheckResult.success ? (
                    <Alert className="mb-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription>Table check completed successfully</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Table check failed</AlertDescription>
                    </Alert>
                  )}
                  <div className="rounded-md overflow-auto max-h-96 border">
                    <pre className="p-4 text-xs">{JSON.stringify(directCheckResult, null, 2)}</pre>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>List All Tables</CardTitle>
              <CardDescription>Lists all tables in your database</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={listAllTables} disabled={loading.listTables} className="mb-4">
                {loading.listTables ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "List All Tables"
                )}
              </Button>

              {error.listTables && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.listTables}</AlertDescription>
                </Alert>
              )}

              {tablesResult && (
                <div className="rounded-md overflow-auto max-h-96 border">
                  <pre className="p-4 text-xs">{JSON.stringify(tablesResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
