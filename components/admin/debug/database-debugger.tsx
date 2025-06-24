"use client"

import { useState, useEffect } from "react"
import { Database, RefreshCw, Check, X, Table, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface TableStatus {
  name: string
  exists: boolean
  rowCount?: number
  error?: string
}

export default function DatabaseDebugger() {
  const [tables, setTables] = useState<TableStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [customSql, setCustomSql] = useState("")
  const [sqlResult, setSqlResult] = useState<any>(null)
  const [sqlError, setSqlError] = useState<string | null>(null)
  const [isExecutingSql, setIsExecutingSql] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown")
  const [connectionDetails, setConnectionDetails] = useState<any>(null)
  const [customTableName, setCustomTableName] = useState("")

  // Default tables to check
  const defaultTables = ["projects", "bts_images", "media", "site_settings", "dependencies"]

  useEffect(() => {
    // Initial check
    checkDatabaseConnection()
    checkTables(defaultTables)
  }, [])

  const checkDatabaseConnection = async () => {
    try {
      setConnectionStatus("unknown")
      const response = await fetch("/api/test-supabase-connection")
      const data = await response.json()

      if (data.success) {
        setConnectionStatus("connected")
      } else {
        setConnectionStatus("error")
      }

      setConnectionDetails(data)
    } catch (error) {
      setConnectionStatus("error")
      setConnectionDetails({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  const checkTables = async (tableNames: string[]) => {
    setIsLoading(true)

    // Reset table statuses
    setTables(
      tableNames.map((name) => ({
        name,
        exists: false,
      })),
    )

    // Check each table
    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i]
      try {
        const response = await fetch(`/api/check-table?table=${tableName}`)
        const data = await response.json()

        setTables((prev) => {
          const newTables = [...prev]
          const index = newTables.findIndex((t) => t.name === tableName)
          if (index !== -1) {
            newTables[index] = {
              name: tableName,
              exists: data.exists,
              rowCount: data.rowCount,
            }
          }
          return newTables
        })
      } catch (error) {
        setTables((prev) => {
          const newTables = [...prev]
          const index = newTables.findIndex((t) => t.name === tableName)
          if (index !== -1) {
            newTables[index] = {
              name: tableName,
              exists: false,
              error: error instanceof Error ? error.message : String(error),
            }
          }
          return newTables
        })
      }
    }

    setIsLoading(false)
  }

  const checkCustomTable = async () => {
    if (!customTableName) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/check-table?table=${customTableName}`)
      const data = await response.json()

      setTables((prev) => [
        {
          name: customTableName,
          exists: data.exists,
          rowCount: data.rowCount,
        },
        ...prev,
      ])
    } catch (error) {
      setTables((prev) => [
        {
          name: customTableName,
          exists: false,
          error: error instanceof Error ? error.message : String(error),
        },
        ...prev,
      ])
    } finally {
      setIsLoading(false)
      setCustomTableName("")
    }
  }

  const executeSql = async () => {
    if (!customSql) return

    try {
      setIsExecutingSql(true)
      setSqlError(null)

      const response = await fetch("/api/exec-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: customSql }),
      })

      const data = await response.json()

      if (data.error) {
        setSqlError(data.error)
        toast({
          title: "SQL Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        setSqlResult(data.result)
        toast({
          title: "SQL Executed",
          description: "Query completed successfully",
        })
      }
    } catch (error) {
      setSqlError(error instanceof Error ? error.message : String(error))
      toast({
        title: "Execution Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsExecutingSql(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-bold text-green-400">Database Diagnostics</h2>
        </div>
        <Button
          onClick={() => {
            checkDatabaseConnection()
            checkTables(defaultTables)
          }}
          disabled={isLoading}
          variant="outline"
          className="border-green-700 text-green-400 hover:bg-green-900/20"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Connection Status */}
      <Card
        className={`bg-black ${
          connectionStatus === "connected"
            ? "border-green-700"
            : connectionStatus === "error"
              ? "border-red-700"
              : "border-yellow-700"
        }`}
      >
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-mono flex items-center">
            <Key
              className={`h-4 w-4 mr-2 ${
                connectionStatus === "connected"
                  ? "text-green-500"
                  : connectionStatus === "error"
                    ? "text-red-500"
                    : "text-yellow-500"
              }`}
            />
            Database Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xs space-y-1">
            <div className="flex items-center">
              {connectionStatus === "connected" && <Check className="h-4 w-4 text-green-500 mr-2" />}
              {connectionStatus === "error" && <X className="h-4 w-4 text-red-500 mr-2" />}
              {connectionStatus === "unknown" && <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin mr-2" />}
              <span
                className={
                  connectionStatus === "connected"
                    ? "text-green-500"
                    : connectionStatus === "error"
                      ? "text-red-500"
                      : "text-yellow-500"
                }
              >
                {connectionStatus === "connected"
                  ? "Connected to database"
                  : connectionStatus === "error"
                    ? "Connection error"
                    : "Checking connection..."}
              </span>
            </div>

            {connectionDetails && (
              <pre className="mt-2 p-2 bg-black border border-green-900 rounded text-green-400 overflow-x-auto">
                {JSON.stringify(connectionDetails, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Table Checker */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={customTableName}
          onChange={(e) => setCustomTableName(e.target.value)}
          placeholder="Enter table name to check..."
          className="flex-1 bg-black border-green-700 text-green-400"
        />
        <Button
          onClick={checkCustomTable}
          disabled={isLoading || !customTableName}
          variant="outline"
          className="border-green-700 text-green-400 hover:bg-green-900/20"
        >
          Check Table
        </Button>
      </div>

      {/* Table Statuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tables.map((table, index) => (
          <Card key={index} className={`bg-black ${table.exists ? "border-green-700" : "border-red-700"}`}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-mono flex items-center justify-between">
                <span className="flex items-center">
                  <Table className={`h-4 w-4 mr-2 ${table.exists ? "text-green-500" : "text-red-500"}`} />
                  {table.name}
                </span>
                {table.exists ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={table.exists ? "text-green-500" : "text-red-500"}>
                    {table.exists ? "Exists" : "Missing"}
                  </span>
                </div>
                {table.rowCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Row count:</span>
                    <span className="text-green-400">{table.rowCount}</span>
                  </div>
                )}
                {table.error && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Error:</span>
                    <span className="text-red-500 truncate max-w-[200px]" title={table.error}>
                      {table.error}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SQL Executor */}
      <Card className="bg-black border-green-700">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-mono flex items-center">
            <Database className="h-4 w-4 mr-2 text-green-500" />
            SQL Executor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            <Textarea
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              placeholder="Enter SQL query..."
              className="min-h-[100px] bg-black border-green-700 text-green-400 font-mono"
            />

            <div className="flex justify-between">
              <Button
                onClick={() => setCustomSql("")}
                variant="outline"
                className="border-green-700 text-green-400 hover:bg-green-900/20"
              >
                Clear
              </Button>

              <Button
                onClick={executeSql}
                disabled={isExecutingSql || !customSql}
                variant="outline"
                className="border-green-700 text-green-400 hover:bg-green-900/20"
              >
                {isExecutingSql ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute SQL"
                )}
              </Button>
            </div>

            {sqlError && (
              <div className="p-2 border border-red-700 rounded bg-red-900/20 text-red-400 text-xs">{sqlError}</div>
            )}

            {sqlResult && (
              <div className="border border-green-700 rounded">
                <div className="p-2 bg-green-900/20 text-green-400 text-xs font-bold border-b border-green-700">
                  Result ({Array.isArray(sqlResult) ? sqlResult.length : 1} rows)
                </div>
                <pre className="p-2 bg-black text-green-400 text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                  {JSON.stringify(sqlResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
