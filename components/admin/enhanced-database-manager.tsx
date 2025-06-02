"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Database, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  Copy, 
  Download,
  TestTube,
  Settings,
  Info,
  Zap,
  FileText,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { databaseValidator, type DatabaseStatus } from "@/lib/database/validator"
import { databaseTesting, type TestDatabaseConfig, type TestDatabaseResult, DatabaseTestingUtils } from "@/lib/database/testing"
import { getSchemaSummary, getAllTables, getTablesByCategory } from "@/lib/database/schema"

export default function EnhancedDatabaseManager() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [executing, setExecuting] = useState(false)
  const [testConfig, setTestConfig] = useState<string>("basic")
  const [testResult, setTestResult] = useState<TestDatabaseResult | null>(null)
  const [showSql, setShowSql] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Check database status on component mount
  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      checkDatabaseStatus()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      const status = await databaseValidator.validateDatabase()
      setDatabaseStatus(status)
      setLastCheck(new Date())
    } catch (error) {
      console.error("Error checking database status:", error)
      toast({
        title: "Error",
        description: "Failed to check database status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const executeSQL = async (sql: string) => {
    if (!sql.trim()) return

    setExecuting(true)
    try {
      const result = await databaseValidator.executeSQL(sql)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "SQL executed successfully"
        })
        // Refresh status after execution
        await checkDatabaseStatus()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to execute SQL",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setExecuting(false)
    }
  }

  const createTestDatabase = async () => {
    setLoading(true)
    try {
      const result = await databaseTesting.createTestDatabase(testConfig)
      setTestResult(result)
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Created test database with ${result.tablesCreated.length} tables`
        })
        // Refresh status after creation
        await checkDatabaseStatus()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create test database",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied",
        description: "SQL copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const downloadSQL = (sql: string, filename: string) => {
    const blob = new Blob([sql], { type: "text/sql" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const schema = getSchemaSummary()
  const allTables = getAllTables()
  const categories = ["core", "content", "media", "security", "dependencies", "other"] as const

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Enhanced Database Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive database schema management and testing tools
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          <Button 
            onClick={checkDatabaseStatus} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {lastCheck && (
        <div className="text-sm text-muted-foreground">
          Last checked: {lastCheck.toLocaleString()}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="sql">SQL Console</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Schema Version</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schema.version}</div>
                <p className="text-xs text-muted-foreground">Current</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schema.totalTables}</div>
                <p className="text-xs text-muted-foreground">
                  {schema.requiredTables} required
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {databaseStatus?.allTablesExist ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">Healthy</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-medium">Needs Setup</span>
                    </>
                  )}
                </div>
                {databaseStatus && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {databaseStatus.missingTables.length} missing tables
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Schema Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {schema.categories.map(category => (
                  <div key={category.name} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium capitalize">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} tables
                      </div>
                    </div>
                    <Badge variant="secondary">{category.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <p className="text-sm text-muted-foreground">
                View all available table definitions organized by category
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categories.map(category => {
                  const categoryTables = getTablesByCategory(category)
                  if (categoryTables.length === 0) return null

                  return (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                        {category}
                        <Badge variant="outline">{categoryTables.length}</Badge>
                      </h3>
                      <div className="grid gap-3">
                        {categoryTables.map(table => {
                          const status = databaseStatus?.tableStatuses[table.name]
                          return (
                            <div key={table.name} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{table.displayName}</h4>
                                  {table.required && (
                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                  )}
                                  {status?.exists ? (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Exists
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Missing
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  v{table.version}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {table.description}
                              </p>
                              {table.dependencies.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Depends on: {table.dependencies.join(", ")}
                                </div>
                              )}
                              {status?.needsUpdate && (
                                <Alert className="mt-2">
                                  <Info className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    Table exists but may need updates. Check the Migration tab.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Validation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Check your database against the current schema
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {databaseStatus ? (
                <>
                  <div className="flex items-center gap-2">
                    {databaseStatus.allTablesExist ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <span className="font-medium">
                      {databaseStatus.allTablesExist 
                        ? "All required tables exist" 
                        : `${databaseStatus.missingTables.length} tables missing`
                      }
                    </span>
                  </div>

                  {databaseStatus.missingTables.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Missing tables: {databaseStatus.missingTables.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {databaseStatus.tablesNeedingUpdate.length > 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Tables needing updates: {databaseStatus.tablesNeedingUpdate.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {databaseStatus.sqlFixScript && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Creation Script</Label>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(databaseStatus.sqlFixScript)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadSQL(databaseStatus.sqlFixScript, "database-setup.sql")}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => executeSQL(databaseStatus.sqlFixScript)}
                            disabled={executing}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Execute
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={databaseStatus.sqlFixScript}
                        readOnly
                        className="font-mono text-sm"
                        rows={10}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Click "Refresh" to check database status</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migration Tab */}
        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Migration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Update existing tables with schema changes
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {databaseStatus?.updateScript ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Update Script</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(databaseStatus.updateScript)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSQL(databaseStatus.updateScript, "database-update.sql")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => executeSQL(databaseStatus.updateScript)}
                        disabled={executing}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={databaseStatus.updateScript}
                    readOnly
                    className="font-mono text-sm"
                    rows={8}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No migrations needed - database is up to date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Testing</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create test databases for development and testing
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Configuration</Label>
                  <Select value={testConfig} onValueChange={setTestConfig}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DatabaseTestingUtils.getAvailableConfigs().map(({ name, config }) => (
                        <SelectItem key={name} value={name}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {DatabaseTestingUtils.TEST_CONFIGS[testConfig]?.description}
                  </p>
                </div>

                <Button onClick={createTestDatabase} disabled={loading} className="w-full">
                  <TestTube className="h-4 w-4 mr-2" />
                  Create Test Database
                </Button>

                {testResult && (
                  <Alert className={testResult.success ? "border-green-200" : ""}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {testResult.success ? (
                        <div>
                          <div>Successfully created test database</div>
                          <div className="text-xs mt-1">
                            Created {testResult.tablesCreated.length} tables, 
                            inserted {testResult.seedDataInserted} seed records
                          </div>
                        </div>
                      ) : (
                        testResult.error
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SQL Console Tab */}
        <TabsContent value="sql" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SQL Console</CardTitle>
              <p className="text-sm text-muted-foreground">
                Execute custom SQL queries and scripts
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>SQL Query</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSql(!showSql)}
                  >
                    {showSql ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showSql ? "Hide" : "Show"} SQL
                  </Button>
                </div>
                
                {showSql && (
                  <Textarea
                    placeholder="Enter your SQL query here..."
                    className="font-mono text-sm"
                    rows={8}
                    id="sql-input"
                  />
                )}
              </div>

              <Button 
                onClick={() => {
                  const textarea = document.getElementById("sql-input") as HTMLTextAreaElement
                  if (textarea) {
                    executeSQL(textarea.value)
                  }
                }}
                disabled={executing || !showSql}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Execute SQL
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Be careful when executing SQL directly. 
                  Always test on a development database first.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}