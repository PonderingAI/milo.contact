"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Copy, Check, Database, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DATABASE_TABLES, getTableByName, getSqlFilesForTables } from "@/lib/database-schema"

// Define the props for the component
interface DatabaseSetupPopupProps {
  requiredSections?: string[]
  customTables?: string[]
  adminOnly?: boolean
  onSetupComplete?: () => void
  title?: string
  description?: string
}

export function DatabaseSetupPopup({
  requiredSections = [],
  customTables = [],
  adminOnly = true,
  onSetupComplete,
  title = "Database Setup Required",
  description = "Some required database tables are missing. Please set up the database to continue.",
}: DatabaseSetupPopupProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [sqlContent, setSqlContent] = useState<string>("")
  const [forceClose, setForceClose] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)

  // Check if we're on an admin page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = window.location.pathname.startsWith("/admin")
      setIsAdminPage(isAdmin)

      // If we're not on an admin page and adminOnly is true, force close
      if (!isAdmin && adminOnly) {
        setForceClose(true)
      }
    }
  }, [adminOnly])

  // Function to check if tables exist - using a more reliable method
  const checkTables = useCallback(async () => {
    setChecking(true)
    setError(null)

    try {
      const response = await fetch("/api/direct-table-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tables:
            customTables.length > 0
              ? customTables
              : DATABASE_TABLES.filter(
                  (table) => requiredSections.includes("all") || requiredSections.includes(table.category),
                ).map((table) => table.name),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check tables")
      }

      const data = await response.json()

      if (data.error) {
        console.error("Error checking tables:", data.error)
        throw new Error(data.error)
      }

      // data.missingTables contains the list of tables that don't exist
      const missingTablesList = data.missingTables || []

      setMissingTables(missingTablesList)
      setSelectedTables(missingTablesList)

      // Only open the popup if there are missing tables and we're on an admin page
      if (missingTablesList.length > 0 && isAdminPage) {
        setOpen(true)
        // Load SQL content for missing tables
        loadSqlContent(missingTablesList)
      } else {
        setOpen(false)
        if (onSetupComplete) {
          onSetupComplete()
        }
      }
    } catch (error) {
      console.error("Error checking tables:", error)
      setError("Failed to check database tables. Please try again.")

      // If we can't check tables, don't show the popup on non-admin pages
      if (!isAdminPage && adminOnly) {
        setForceClose(true)
      }
    } finally {
      setChecking(false)
    }
  }, [requiredSections, customTables, forceClose, onSetupComplete, adminOnly, isAdminPage])

  // Function to generate SQL for selected tables
  const generateSQL = () => {
    let sql = ""

    // Add SQL for each selected table
    for (const tableName of selectedTables) {
      const table = getTableByName(tableName)
      if (table) {
        sql += `-- Setup for ${table.displayName} table\n`
        sql += table.sql
        sql += "\n\n"
      }
    }

    return sql.trim()
  }

  // Function to execute SQL
  const executeSQL = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const sql = generateSQL()
      const response = await fetch("/api/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute SQL")
      }

      setSuccess("Database tables created successfully!")

      // Wait a moment before closing to show success message
      setTimeout(() => {
        setOpen(false)
        if (onSetupComplete) {
          onSetupComplete()
        }
      }, 1500)
    } catch (error) {
      console.error("Error executing SQL:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Function to handle table selection
  const handleTableSelection = (tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedTables((prev) => [...prev, tableName])
    } else {
      setSelectedTables((prev) => prev.filter((t) => t !== tableName))
    }
  }

  // Load SQL content from files
  const loadSqlContent = async (tableNames: string[]) => {
    try {
      const sqlFiles = getSqlFilesForTables(tableNames)

      // For each SQL file, fetch its content
      const sqlContents = await Promise.all(
        sqlFiles.map(async (file) => {
          const response = await fetch(file)
          if (!response.ok) {
            throw new Error(`Failed to load SQL file: ${file}`)
          }
          return response.text()
        }),
      )

      // Combine all SQL content
      setSqlContent(sqlContents.join("\n\n"))
    } catch (error) {
      console.error("Error loading SQL content:", error)
      setError("Failed to load SQL content. Please try again.")
    }
  }

  // Function to copy SQL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Check for missing tables on component mount
  useEffect(() => {
    checkTables()
  }, [checkTables])

  // Get categories that have missing tables
  const getCategories = () => {
    const categories = new Set<string>()

    for (const tableName of missingTables) {
      const table = getTableByName(tableName)
      if (table) {
        categories.add(table.category)
      }
    }

    return Array.from(categories)
  }

  // Filter tables by category
  const getFilteredTables = () => {
    if (activeTab === "all") {
      return missingTables.map((tableName) => getTableByName(tableName)).filter(Boolean)
    }

    return missingTables
      .map((tableName) => getTableByName(tableName))
      .filter((table) => table && table.category === activeTab)
  }

  // Handle manual setup completion
  const handleManualSetupComplete = () => {
    setSuccess("Setup marked as complete. Refreshing page...")

    // Wait a moment before closing to show success message
    setTimeout(() => {
      setOpen(false)
      if (onSetupComplete) {
        onSetupComplete()
      }
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && setOpen(isOpen)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Database className="h-5 w-5 mr-2" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Missing Tables</h3>
            <Button variant="outline" size="sm" onClick={checkTables} disabled={checking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Tables</TabsTrigger>
              {getCategories().map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {getFilteredTables()?.map((table) => (
                  <div key={table.name} className="flex items-start space-x-2 border p-3 rounded-md">
                    <Checkbox
                      id={`table-${table.name}`}
                      checked={selectedTables.includes(table.name)}
                      onCheckedChange={(checked) => handleTableSelection(table.name, checked === true)}
                      disabled={table.required}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={`table-${table.name}`} className="font-medium cursor-pointer">
                        {table.displayName}
                        {table.required && <span className="text-red-500 ml-2">(Required)</span>}
                      </Label>
                      <p className="text-sm text-gray-500">{table.description}</p>
                      {table.dependencies.length > 0 && (
                        <p className="text-xs text-gray-400">Depends on: {table.dependencies.join(", ")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {getCategories().map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {getFilteredTables().map((table) => (
                    <div key={table.name} className="flex items-start space-x-2 border p-3 rounded-md">
                      <Checkbox
                        id={`table-${table.name}-${category}`}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={(checked) => handleTableSelection(table.name, checked === true)}
                        disabled={table.required}
                      />
                      <div className="space-y-1">
                        <Label htmlFor={`table-${table.name}-${category}`} className="font-medium cursor-pointer">
                          {table.displayName}
                          {table.required && <span className="text-red-500 ml-2">(Required)</span>}
                        </Label>
                        <p className="text-sm text-gray-500">{table.description}</p>
                        {table.dependencies.length > 0 && (
                          <p className="text-xs text-gray-400">Depends on: {table.dependencies.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Generated SQL</h3>
            <Textarea value={sqlContent} readOnly className="h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900" />
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 mt-4">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Copy the SQL code above using the "Copy SQL" button</li>
              <li>Go to your Supabase project dashboard</li>
              <li>Click on "SQL Editor" in the left sidebar</li>
              <li>Paste the SQL code into the editor</li>
              <li>Click "Run" to execute the SQL and create all required tables</li>
              <li>Return here and click "I've Run the SQL Manually"</li>
            </ol>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={copyToClipboard}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy SQL"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleManualSetupComplete}>
              I've Run the SQL Manually
            </Button>
            <Button onClick={executeSQL} disabled={loading}>
              {loading ? "Creating tables..." : "Create Tables Automatically"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add default export for backward compatibility
// export default DatabaseSetupPopup

interface SetupTablesPopupProps {
  requiredTables?: string[]
  onSetupComplete?: () => void
}

export function SetupTablesPopup({ requiredTables = [], onSetupComplete }: SetupTablesPopupProps) {
  const [isAdminPage, setIsAdminPage] = useState(false)

  // Check if we're on an admin page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = window.location.pathname.startsWith("/admin")
      setIsAdminPage(isAdmin)
    }
  }, [])

  // Only render in admin pages
  if (!isAdminPage) {
    return null
  }

  return <DatabaseSetupPopup customTables={requiredTables} adminOnly={true} onSetupComplete={onSetupComplete} />
}

export default SetupTablesPopup
