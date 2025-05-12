"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Copy, Check, RefreshCw, Plus, Table } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WidgetComponent } from "@/components/admin/widget"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DATABASE_TABLES } from "@/lib/database-schema"
import { DatabaseTableManager } from "@/components/admin/database-table-manager"

export default function DatabaseClientPage() {
  const [loading, setLoading] = useState(false)
  const [allTables, setAllTables] = useState<any[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("existing")
  const [generatedSQL, setGeneratedSQL] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load all tables on mount
  useEffect(() => {
    loadAllTables()
  }, [])

  const loadAllTables = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/list-all-tables")
      const data = await response.json()
      setAllTables(data.tables || [])
    } catch (error) {
      console.error("Error loading tables:", error)
      setError("Failed to load database tables")
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelection = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTables((prev) => [...prev, tableName])
    } else {
      setSelectedTables((prev) => prev.filter((t) => t !== tableName))
    }
  }

  const generateDropSQL = () => {
    if (selectedTables.length === 0) return ""

    let sql = "-- WARNING: This will permanently delete the selected tables and all their data\n"
    sql += "-- Make sure you have a backup before proceeding\n\n"

    // Add DROP TABLE statements for each selected table
    for (const tableName of selectedTables) {
      sql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`
    }

    setGeneratedSQL(sql)
    return sql
  }

  const generateSelectSQL = () => {
    if (selectedTables.length === 0) return ""

    let sql = "-- Select statements for the selected tables\n\n"

    // Add SELECT statements for each selected table
    for (const tableName of selectedTables) {
      sql += `-- Select all from ${tableName}\n`
      sql += `SELECT * FROM "${tableName}" LIMIT 100;\n\n`
    }

    setGeneratedSQL(sql)
    return sql
  }

  const generateTruncateSQL = () => {
    if (selectedTables.length === 0) return ""

    let sql = "-- WARNING: This will delete all data in the selected tables\n"
    sql += "-- The tables will remain but all rows will be removed\n\n"

    // Add TRUNCATE statements for each selected table
    for (const tableName of selectedTables) {
      sql += `TRUNCATE TABLE "${tableName}" CASCADE;\n`
    }

    setGeneratedSQL(sql)
    return sql
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const executeSQL = async () => {
    if (!generatedSQL) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: generatedSQL }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute SQL")
      }

      setSuccess("SQL executed successfully!")

      // Refresh the table list after successful execution
      setTimeout(() => {
        loadAllTables()
        setSelectedTables([])
        setGeneratedSQL("")
      }, 1500)
    } catch (error) {
      console.error("Error executing SQL:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Get all existing tables
  const existingTables = allTables.map((table) => table.table_name)

  // Get all tables defined in the schema
  const definedTables = DATABASE_TABLES.map((table) => table.name)

  // Get tables that exist but are not in the schema
  const undefinedTables = existingTables.filter((table) => !definedTables.includes(table))

  // Get tables that are in the schema but don't exist
  const missingTables = definedTables.filter((table) => !existingTables.includes(table))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WidgetComponent
          id="database-tables"
          title="Database Tables"
          draggable={false}
          className="col-span-1 md:col-span-2"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Database Tables</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadAllTables} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("create")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Tables
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create missing tables defined in the schema</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Tabs defaultValue="existing" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="existing">
                  Existing Tables
                  <Badge variant="secondary" className="ml-2">
                    {existingTables.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="undefined">
                  Undefined Tables
                  <Badge variant="secondary" className="ml-2">
                    {undefinedTables.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="missing">
                  Missing Tables
                  <Badge variant="secondary" className="ml-2">
                    {missingTables.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="create">Create Tables</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                <DatabaseTableManager
                  tables={existingTables}
                  selectedTables={selectedTables}
                  onTableSelection={handleTableSelection}
                  onGenerateSelect={generateSelectSQL}
                  onGenerateDrop={generateDropSQL}
                  onGenerateTruncate={generateTruncateSQL}
                />
              </TabsContent>

              <TabsContent value="undefined" className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    These tables exist in your database but are not defined in your application schema. They might be
                    system tables or tables created for other purposes.
                  </p>
                </div>
                <DatabaseTableManager
                  tables={undefinedTables}
                  selectedTables={selectedTables}
                  onTableSelection={handleTableSelection}
                  onGenerateSelect={generateSelectSQL}
                  onGenerateDrop={generateDropSQL}
                  onGenerateTruncate={generateTruncateSQL}
                />
              </TabsContent>

              <TabsContent value="missing" className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    These tables are defined in your application schema but don't exist in your database. Switch to the
                    "Create Tables" tab to create them.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {missingTables.map((tableName) => {
                    const tableInfo = DATABASE_TABLES.find((t) => t.name === tableName)
                    return (
                      <Card key={tableName} className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Table className="h-4 w-4 mr-2" />
                            {tableName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-gray-400">
                            {tableInfo?.description || "No description available"}
                          </p>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {tableInfo?.category || "unknown"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="create" className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Select tables to create in your database. Tables that already exist will be skipped.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DATABASE_TABLES.map((table) => (
                    <div key={table.name} className="flex items-start space-x-2 border border-gray-700 p-3 rounded-md">
                      <Checkbox
                        id={`create-table-${table.name}`}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={(checked) => handleTableSelection(table.name, checked === true)}
                        disabled={existingTables.includes(table.name)}
                      />
                      <div className="space-y-1">
                        <Label htmlFor={`create-table-${table.name}`} className="font-medium cursor-pointer">
                          {table.name}
                          {existingTables.includes(table.name) && (
                            <Badge variant="outline" className="ml-2">
                              Exists
                            </Badge>
                          )}
                          {table.required && (
                            <Badge variant="destructive" className="ml-2">
                              Required
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-gray-400">{table.description}</p>
                        {table.dependencies.length > 0 && (
                          <p className="text-xs text-gray-500">Depends on: {table.dependencies.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const missingTablesSet = new Set(missingTables)
                      setSelectedTables(
                        DATABASE_TABLES.filter((table) => missingTablesSet.has(table.name)).map((table) => table.name),
                      )
                    }}
                  >
                    Select All Missing
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      // Generate SQL for creating selected tables
                      // This will use the existing database setup popup logic
                      import("@/components/admin/database-setup-popup").then((module) => {
                        const DatabaseSetupPopup = module.default
                        const popup = new DatabaseSetupPopup({
                          customTables: selectedTables,
                          adminOnly: false,
                        })
                        // @ts-ignore - accessing private method
                        const sql = popup.generateSQL()
                        setGeneratedSQL(sql)
                      })
                    }}
                  >
                    Generate Create SQL
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </WidgetComponent>

        {generatedSQL && (
          <WidgetComponent id="sql-preview" title="SQL Preview" draggable={false} className="col-span-1 md:col-span-2">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert
                  variant="default"
                  className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800"
                >
                  <Check className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Textarea value={generatedSQL} readOnly className="h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900" />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={copyToClipboard}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied!" : "Copy SQL"}
                </Button>
                <Button variant="default" onClick={executeSQL} disabled={loading}>
                  {loading ? "Executing..." : "Execute SQL"}
                </Button>
              </div>
            </div>
          </WidgetComponent>
        )}
      </div>
    </div>
  )
}
