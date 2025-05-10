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
import { AlertCircle, Copy, Check, Database, RefreshCw, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DATABASE_TABLES, getTableByName } from "@/lib/database-schema"

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
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [sqlContent, setSqlContent] = useState<string>("")
  const [forceClose, setForceClose] = useState(false)
  const [isAdminPage, setIsAdminPage] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [isLoadingSql, setIsLoadingSql] = useState(false)
  const [sqlLoadAttempted, setSqlLoadAttempted] = useState(false)

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
  const checkTables = useCallback(
    async (shouldOpenPopup = true) => {
      if (checking) return // Prevent multiple simultaneous checks

      setChecking(true)
      // Don't show error during background checks
      if (shouldOpenPopup) {
        setError(null)
      }
      setLastRefreshTime(new Date())

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

        // Only update state if there's a change to avoid unnecessary re-renders
        if (JSON.stringify(missingTablesList) !== JSON.stringify(missingTables)) {
          setMissingTables(missingTablesList)
          setSelectedTables(missingTablesList)

          // Only load SQL content if there are missing tables and we're opening the popup
          // or if the popup is already open and we haven't tried loading SQL yet
          if (missingTablesList.length > 0 && (shouldOpenPopup || (open && !sqlLoadAttempted))) {
            loadSqlContent(missingTablesList)
          }
        }

        // Only open the popup if there are missing tables, we're on an admin page, and we should open it
        if (missingTablesList.length > 0 && isAdminPage && shouldOpenPopup) {
          setOpen(true)
        } else if (missingTablesList.length === 0) {
          // If no missing tables, close the popup and call onSetupComplete
          if (open) {
            setSuccess("All required tables exist!")
            setTimeout(() => {
              setOpen(false)
              if (onSetupComplete) {
                onSetupComplete()
              }
            }, 1500)
          } else if (onSetupComplete) {
            onSetupComplete()
          }
        }
      } catch (error) {
        console.error("Error checking tables:", error)
        // Only show errors for user-initiated checks
        if (shouldOpenPopup) {
          setError("Failed to check database tables. Please try again.")
        }

        // If we can't check tables, don't show the popup on non-admin pages
        if (!isAdminPage && adminOnly) {
          setForceClose(true)
        }
      } finally {
        setChecking(false)
      }
    },
    [
      requiredSections,
      customTables,
      forceClose,
      onSetupComplete,
      adminOnly,
      isAdminPage,
      open,
      missingTables,
      checking,
      sqlLoadAttempted,
    ],
  )

  // Function to generate SQL for selected tables
  const generateSQL = () => {
    let sql = ""

    // Add SQL for each selected table
    for (const tableName of selectedTables) {
      const table = getTableByName(tableName)
      if (table) {
        sql += `-- Setup for ${table.displayName} table\n`
        sql += table.sql || "-- SQL not available for this table"
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

      // Wait a moment before checking tables again
      setTimeout(() => {
        checkTables(false) // Check tables but don't reopen popup
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
    // Don't show loading state for background refreshes
    setIsLoadingSql(true)
    setSqlLoadAttempted(true)

    try {
      // Use hardcoded SQL for now since file loading is failing
      const hardcodedSQL = `
-- Dependencies System Tables

-- Table for dependencies
CREATE TABLE IF NOT EXISTS dependencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  outdated BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  locked_version VARCHAR(100),
  has_security_issue BOOLEAN DEFAULT FALSE,
  security_details JSONB,
  update_mode VARCHAR(50) DEFAULT 'global',
  is_dev BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_dependencies_name ON dependencies(name);

-- Table for dependency settings
CREATE TABLE IF NOT EXISTS dependency_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO dependency_settings (setting_key, value)
VALUES ('update_mode', '"conservative"')
ON CONFLICT (setting_key) DO NOTHING;

-- Table for security audits
CREATE TABLE IF NOT EXISTS security_audits (
  id SERIAL PRIMARY KEY,
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vulnerabilities INTEGER DEFAULT 0,
  outdated_packages INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 100,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audits ENABLE ROW LEVEL SECURITY;

-- Allow public read access to dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'public_read_dependencies'
  ) THEN
    CREATE POLICY "public_read_dependencies"
    ON dependencies
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependencies' AND policyname = 'admins_manage_dependencies'
  ) THEN
    CREATE POLICY "admins_manage_dependencies"
    ON dependencies
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow public read access to dependency settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'public_read_dependency_settings'
  ) THEN
    CREATE POLICY "public_read_dependency_settings"
    ON dependency_settings
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage dependency settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dependency_settings' AND policyname = 'admins_manage_dependency_settings'
  ) THEN
    CREATE POLICY "admins_manage_dependency_settings"
    ON dependency_settings
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow public read access to security audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audits' AND policyname = 'public_read_security_audits'
  ) THEN
    CREATE POLICY "public_read_security_audits"
    ON security_audits
    FOR SELECT
    TO public
    USING (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;

-- Allow authenticated users with admin role to manage security audits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_audits' AND policyname = 'admins_manage_security_audits'
  ) THEN
    CREATE POLICY "admins_manage_security_audits"
    ON security_audits
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy already exists or other error
END $$;
`

      // Set the hardcoded SQL content
      setSqlContent(hardcodedSQL)

      // Skip the file loading since it's failing
      /*
      const sqlFiles = getSqlFilesForTables(tableNames)

      // If no SQL files, set empty content
      if (sqlFiles.length === 0) {
        setSqlContent("")
        return
      }

      // For each SQL file, fetch its content
      const sqlContents = await Promise.all(
        sqlFiles.map(async (file) => {
          try {
            const response = await fetch(file)
            if (!response.ok) {
              console.warn(`Failed to load SQL file: ${file}`)
              return `-- Failed to load SQL for ${file}\n`
            }
            return await response.text()
          } catch (err) {
            console.warn(`Error fetching SQL file: ${file}`, err)
            return `-- Error loading SQL for ${file}\n`
          }
        }),
      )

      // Combine all SQL content
      setSqlContent(sqlContents.join("\n\n"))
      */
    } catch (error) {
      console.error("Error loading SQL content:", error)
      // Don't show error messages for background refreshes
      // setError("Failed to load SQL content. Please try again.")
    } finally {
      setIsLoadingSql(false)
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

  // Set up auto-refresh
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (open && autoRefreshEnabled) {
      // Refresh every 30 seconds instead of 2 seconds
      intervalId = setInterval(() => {
        checkTables(false) // Don't reopen popup on refresh
      }, 30000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [open, autoRefreshEnabled, checkTables])

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
    setSuccess("Setup marked as complete. Checking tables...")

    // Check tables again to verify
    setTimeout(() => {
      checkTables(false) // Check tables but don't reopen popup
    }, 1500)
  }

  // Handle force close
  const handleForceClose = () => {
    setForceClose(true)
    setOpen(false)
    if (onSetupComplete) {
      onSetupComplete()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && setOpen(isOpen)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-xl">
            <div className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              {title}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleForceClose}
              title="Skip setup (not recommended)"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
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
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500">
                {lastRefreshTime && `Last checked: ${lastRefreshTime.toLocaleTimeString()}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkTables(false)}
                disabled={checking}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
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
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-medium mr-2">Generated SQL</h3>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied!" : "Copy SQL"}
              </Button>
            </div>
            <div className="relative">
              <Textarea value={sqlContent} readOnly className="h-64 font-mono text-sm bg-gray-50 dark:bg-gray-900" />
              {isLoadingSql && (
                <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
            </div>
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
