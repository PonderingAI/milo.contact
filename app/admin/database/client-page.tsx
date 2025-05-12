"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database, RefreshCw, Check, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function DatabaseClientPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("tables")
  const [tablesList, setTablesList] = useState<string[]>([])
  const [sqlQuery, setSqlQuery] = useState("")
  const [sqlResult, setSqlResult] = useState<any>(null)
  const [executingSql, setExecutingSql] = useState(false)
  const [copying, setCopying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load tables on mount
  useEffect(() => {
    loadTables()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTables = async () => {
    setLoading(true)
    setRefreshing(true)
    setError(null)

    try {
      // Try the simple list tables endpoint first
      const response = await fetch("/api/list-tables-simple")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to list tables")
      }

      setTablesList(data.tables || [])

      toast({
        title: "Tables loaded",
        description: `Found ${data.count} tables using ${data.method} method`,
      })
    } catch (err) {
      console.error("Error loading tables:", err)
      setError(err instanceof Error ? err.message : "Unknown error loading tables")

      // Try fallback method - direct table check
      try {
        const commonTables = [
          "user_roles",
          "site_settings",
          "projects",
          "media",
          "bts_images",
          "contact_messages",
          "dependencies",
          "dependency_settings",
          "dependency_compatibility",
          "security_audits",
          "widget_types",
          "user_widgets",
        ]

        const response = await fetch("/api/direct-table-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tables: commonTables }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || "Failed to check tables")
        }

        setTablesList(data.existingTables || [])

        toast({
          title: "Tables loaded using fallback method",
          description: `Found ${data.existingTables.length} tables`,
        })
      } catch (fallbackErr) {
        console.error("Fallback method also failed:", fallbackErr)
        // Keep the original error
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const executeSQL = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Empty query",
        description: "Please enter an SQL query to execute",
        variant: "destructive",
      })
      return
    }

    setExecutingSql(true)
    setSqlResult(null)
    setError(null)

    try {
      const response = await fetch("/api/exec-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: sqlQuery }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      setSqlResult(data)
      toast({
        title: "SQL executed successfully",
        description: data.message || "Query completed",
      })
    } catch (err) {
      console.error("Error executing SQL:", err)
      setError(err instanceof Error ? err.message : "Unknown error executing SQL")
      toast({
        title: "SQL execution failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setExecutingSql(false)
    }
  }

  const copyToClipboard = async () => {
    setCopying(true)

    try {
      await navigator.clipboard.writeText(JSON.stringify(sqlResult, null, 2))
      toast({
        title: "Copied to clipboard",
        description: "SQL results copied successfully",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => setCopying(false), 1000)
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Management
            </div>
            <Button variant="outline" size="sm" onClick={loadTables} disabled={refreshing} className="ml-auto">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="sql">SQL Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="tables" className="space-y-4">
              <div className="rounded-md border">
                <div className="p-4 bg-muted/50">
                  <h3 className="text-lg font-medium mb-2">Database Tables</h3>
                  <p className="text-sm text-muted-foreground">{tablesList.length} tables found in your database</p>
                </div>
                <div className="p-4">
                  {tablesList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {tablesList.map((table) => (
                        <div key={table} className="p-2 border rounded-md">
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span>{table}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No tables found. Use the SQL Editor to create tables.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sql" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sql-query">SQL Query</Label>
                  <Textarea
                    id="sql-query"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter your SQL query here..."
                    className="font-mono h-32"
                  />
                </div>
                <Button onClick={executeSQL} disabled={executingSql}>
                  {executingSql ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    "Execute SQL"
                  )}
                </Button>

                {sqlResult && (
                  <div className="rounded-md border overflow-hidden">
                    <div className="p-2 bg-muted/50 flex justify-between items-center">
                      <h3 className="font-medium">Results</h3>
                      <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={copying}>
                        {copying ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-4 overflow-auto max-h-96">
                      <pre className="text-xs">{JSON.stringify(sqlResult, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
