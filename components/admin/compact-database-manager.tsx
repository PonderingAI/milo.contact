"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Database, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Download,
  Trash2,
  Plus,
  Info,
  Zap
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { databaseValidator, type DatabaseStatus } from "@/lib/database/validator"
import { getSchemaSummary, getAllTables, type TableConfig } from "@/lib/database/schema"

export default function CompactDatabaseManager() {
  const [loading, setLoading] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [selectedMissingTables, setSelectedMissingTables] = useState<string[]>([])
  const [selectedExistingTables, setSelectedExistingTables] = useState<string[]>([])
  const [showMigrationPopup, setShowMigrationPopup] = useState(false)

  // Auto-refresh every 30 seconds, but respect "marked as up to date" status
  useEffect(() => {
    checkDatabaseStatus()
    
    const interval = setInterval(() => {
      // Only auto-refresh if not marked as up to date recently
      try {
        const markedUpToDate = localStorage.getItem("database_marked_up_to_date")
        if (markedUpToDate) {
          const timestamp = parseInt(markedUpToDate)
          const timeSinceMarked = Date.now() - timestamp
          const fiveMinutes = 5 * 60 * 1000 // 5 minutes
          
          if (timeSinceMarked < fiveMinutes) {
            console.log('[DatabaseManager] Skipping auto-refresh - recently marked as up to date')
            return
          }
        }
      } catch (error) {
        console.log('[DatabaseManager] Error checking mark for auto-refresh:', error)
      }
      
      checkDatabaseStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      console.log('[DatabaseManager] Checking database status...')
      const status = await databaseValidator.validateDatabase()
      console.log('[DatabaseManager] Database status received:', {
        allTablesExist: status.allTablesExist,
        missingTables: status.missingTables,
        tablesNeedingUpdate: status.tablesNeedingUpdate,
        hasUpdateScript: status.updateScript && status.updateScript.trim().length > 0,
        updateScriptLength: status.updateScript?.length || 0
      })
      
      setDatabaseStatus(status)
      setLastCheck(new Date())

      // Auto-select missing tables for creation
      if (status.missingTables.length > 0 && selectedMissingTables.length === 0) {
        setSelectedMissingTables(status.missingTables)
      }
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

  const generateCreationSQL = () => {
    if (selectedMissingTables.length === 0) return ""
    
    const allTables = getAllTables()
    let sql = `-- Database Creation Script\n-- Generated on ${new Date().toISOString()}\n\n`
    sql += `-- Enable UUID extension if not already enabled\nCREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`

    // Sort by dependencies and generate SQL
    const sortedTables = sortTablesByDependencies(selectedMissingTables, allTables)
    
    for (const tableName of sortedTables) {
      const table = allTables.find(t => t.name === tableName)
      if (table) {
        sql += `-- Setup for ${table.displayName}\n`
        sql += table.sql
        sql += "\n\n"
      }
    }

    return sql.trim()
  }

  const generateDeletionSQL = () => {
    if (selectedExistingTables.length === 0) return ""
    
    let sql = `-- Table Deletion Script\n-- Generated on ${new Date().toISOString()}\n\n`
    
    // Reverse dependency order for deletion
    const allTables = getAllTables()
    const sortedTables = sortTablesByDependencies(selectedExistingTables, allTables).reverse()
    
    for (const tableName of sortedTables) {
      sql += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`
    }

    return sql.trim()
  }

  const sortTablesByDependencies = (tableNames: string[], allTables: TableConfig[]): string[] => {
    const sorted: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (tableName: string) => {
      if (visiting.has(tableName)) return // Avoid circular deps
      if (visited.has(tableName)) return

      visiting.add(tableName)
      
      const table = allTables.find(t => t.name === tableName)
      if (table) {
        for (const dep of table.dependencies) {
          if (tableNames.includes(dep)) {
            visit(dep)
          }
        }
      }

      visiting.delete(tableName)
      visited.add(tableName)
      sorted.push(tableName)
    }

    for (const tableName of tableNames) {
      if (!visited.has(tableName)) {
        visit(tableName)
      }
    }

    return sorted
  }

  const showMigrationSQLPopup = () => {
    console.log('Attempting to show migration SQL popup...', {
      hasUpdateScript: databaseStatus?.updateScript && databaseStatus.updateScript.trim().length > 0,
      updateScriptLength: databaseStatus?.updateScript?.length || 0
    })
    
    if (databaseStatus?.updateScript && databaseStatus.updateScript.trim().length > 0) {
      console.log('Showing migration popup with script:', databaseStatus.updateScript.substring(0, 100) + '...')
      setShowMigrationPopup(true)
    } else {
      console.log('No migration script available')
      toast({
        title: "No Migration Needed",
        description: "Database is already up to date",
      })
    }
  }

  const schema = getSchemaSummary()
  const allTables = getAllTables()

  const missingTables = databaseStatus?.missingTables || []
  const existingTables = Object.keys(databaseStatus?.tableStatuses || {}).filter(
    name => databaseStatus?.tableStatuses[name]?.exists
  )

  const creationSQL = generateCreationSQL()
  const deletionSQL = generateDeletionSQL()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Auto-refreshing every 30 seconds • Last check: {lastCheck?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              console.log('Manual refresh requested')
              checkDatabaseStatus()
            }}
          >
            <Database className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {databaseStatus?.allTablesExist ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Database Healthy
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {missingTables.length} Missing Tables
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{schema.totalTables}</div>
            <p className="text-xs text-muted-foreground">Total Tables</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{existingTables.length}</div>
            <p className="text-xs text-muted-foreground">Existing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{missingTables.length}</div>
            <p className="text-xs text-muted-foreground">Missing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{databaseStatus?.tablesNeedingUpdate.length || 0}</div>
            <p className="text-xs text-muted-foreground">Need Updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Migration Alert */}
      {databaseStatus?.updateScript && databaseStatus.updateScript.trim().length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-800 text-white">
          <Info className="h-4 w-4 text-white" />
          <AlertDescription className="text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div>Database schema updates are available for existing tables.</div>
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs mt-1 opacity-75">
                    Debug: {databaseStatus.tablesNeedingUpdate.join(', ')} need updates | Script length: {databaseStatus.updateScript.length}
                  </div>
                )}
                {databaseStatus.tablesNeedingUpdate.length > 0 && (
                  <div className="text-xs mt-1 opacity-90">
                    Tables: {databaseStatus.tablesNeedingUpdate.join(', ')}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={showMigrationSQLPopup}
                  className="border-yellow-300 hover:bg-yellow-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  View Migration SQL
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={async () => {
                    console.log('Marking database as up to date...', {
                      tablesNeedingUpdate: databaseStatus.tablesNeedingUpdate,
                      updateScriptLength: databaseStatus.updateScript.length
                    })
                    
                    // Mark database as up to date and refresh
                    databaseValidator.markAsUpToDate()
                    
                    // Verify the mark was set
                    try {
                      const mark = localStorage.getItem("database_marked_up_to_date")
                      console.log('Verification: mark set to', mark)
                    } catch (error) {
                      console.error('Error verifying mark:', error)
                    }
                    
                    // Clear current status to hide banner immediately
                    setDatabaseStatus(null)
                    
                    toast({
                      title: "Marked as Up to Date",
                      description: "Database validation bypassed for 1 hour. Banner will be hidden until next validation issue."
                    })
                    
                    // Force a fresh check after a longer delay to ensure mark is respected
                    setTimeout(async () => {
                      console.log('Re-checking database status after marking as up to date...')
                      await checkDatabaseStatus()
                    }, 1000) // Increased delay to 1 second
                  }}
                  className="border-yellow-300 hover:bg-yellow-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Already Applied
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Missing Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Missing Tables ({missingTables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {missingTables.length > 0 ? (
              <>
                <div className="space-y-2">
                  {missingTables.map(tableName => {
                    const table = allTables.find(t => t.name === tableName)
                    return (
                      <div key={tableName} className="flex items-center space-x-2 p-2 border rounded">
                        <Checkbox
                          id={`create-${tableName}`}
                          checked={selectedMissingTables.includes(tableName)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMissingTables([...selectedMissingTables, tableName])
                            } else {
                              setSelectedMissingTables(selectedMissingTables.filter(t => t !== tableName))
                            }
                          }}
                        />
                        <Label htmlFor={`create-${tableName}`} className="flex-1">
                          <div className="font-medium">{table?.displayName || tableName}</div>
                          <div className="text-xs text-muted-foreground">{table?.description}</div>
                        </Label>
                        {table?.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>

                {selectedMissingTables.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(creationSQL)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy SQL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSQL(creationSQL, "create-tables.sql")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <Textarea
                      value={creationSQL}
                      readOnly
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                All tables exist
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manage Existing Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Manage Existing Tables ({existingTables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingTables.length > 0 ? (
              <>
                <div className="space-y-2">
                  {existingTables.map(tableName => {
                    const table = allTables.find(t => t.name === tableName)
                    const status = databaseStatus?.tableStatuses[tableName]
                    return (
                      <div key={tableName} className="flex items-center space-x-2 p-2 border rounded">
                        <Checkbox
                          id={`delete-${tableName}`}
                          checked={selectedExistingTables.includes(tableName)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedExistingTables([...selectedExistingTables, tableName])
                            } else {
                              setSelectedExistingTables(selectedExistingTables.filter(t => t !== tableName))
                            }
                          }}
                        />
                        <Label htmlFor={`delete-${tableName}`} className="flex-1">
                          <div className="font-medium">{table?.displayName || tableName}</div>
                          <div className="text-xs text-muted-foreground">
                            {table?.description}
                            {status?.needsUpdate && " • Needs update"}
                          </div>
                        </Label>
                        <div className="flex gap-1">
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Exists
                          </Badge>
                          {status?.needsUpdate && (
                            <Badge variant="outline" className="text-xs">
                              Update Available
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {selectedExistingTables.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Warning: Deleting tables will permanently remove all data!
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(deletionSQL)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy SQL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSQL(deletionSQL, "delete-tables.sql")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <Textarea
                      value={deletionSQL}
                      readOnly
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2" />
                No tables found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Migration Popup */}
      {showMigrationPopup && databaseStatus?.updateScript && databaseStatus.updateScript.trim().length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Database Migration
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMigrationPopup(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This script will update existing tables to match the current schema without losing data.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(databaseStatus.updateScript)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy SQL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadSQL(databaseStatus.updateScript, "migration.sql")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              
              <Textarea
                value={databaseStatus.updateScript}
                readOnly
                className="font-mono text-sm"
                rows={12}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}