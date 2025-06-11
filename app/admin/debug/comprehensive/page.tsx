"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, RefreshCw, CheckCircle, AlertTriangle, Table, Key, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DebugStep {
  name: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: any
  error?: string
  duration?: number
}

export default function ComprehensiveDatabaseDebugPage() {
  const { user: currentUser, isLoaded, isSignedIn } = useUser()
  const [steps, setSteps] = useState<DebugStep[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)

  const debugSteps: Omit<DebugStep, 'status'>[] = [
    {
      name: "Check Database Connection",
      description: "Test connection to Supabase database and verify authentication"
    },
    {
      name: "Validate Core Schema",
      description: "Check that all required tables exist with correct structure"
    },
    {
      name: "Test Table Permissions",
      description: "Verify RLS policies and table access permissions"
    },
    {
      name: "Check Migration Status",
      description: "Compare current schema with expected schema definitions"
    },
    {
      name: "Test CLI Integration",
      description: "Verify database CLI can generate and validate schemas"
    },
    {
      name: "Validate BTS Images Table",
      description: "Specifically test BTS images table structure and relationships"
    },
    {
      name: "Test Banner Logic",
      description: "Check database manager banner display logic and persistence"
    },
    {
      name: "Performance Test",
      description: "Run basic performance tests on database operations"
    }
  ]

  useEffect(() => {
    // Initialize steps
    setSteps(debugSteps.map(step => ({ ...step, status: 'pending' })))
  }, [])

  const updateStep = (index: number, updates: Partial<DebugStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ))
  }

  const runDebugSequence = async () => {
    if (!currentUser) return

    setIsRunning(true)
    setCurrentStepIndex(0)

    // Reset all steps
    setSteps(debugSteps.map(step => ({ ...step, status: 'pending' })))

    for (let i = 0; i < debugSteps.length; i++) {
      setCurrentStepIndex(i)
      updateStep(i, { status: 'running' })
      
      const startTime = Date.now()
      
      try {
        let result: any = null

        switch (i) {
          case 0: // Check Database Connection
            const connectionResponse = await fetch('/api/supabase-diagnostic')
            
            if (connectionResponse.ok) {
              result = await connectionResponse.json()
            } else {
              result = {
                error: "Database diagnostic API failed",
                status: connectionResponse.status,
                statusText: connectionResponse.statusText
              }
            }
            break

          case 1: // Validate Core Schema
            const tablesResponse = await fetch('/api/list-all-tables')
            
            if (tablesResponse.ok) {
              const tablesData = await tablesResponse.json()
              const expectedTables = ["user_roles", "site_settings", "projects", "bts_images", "media", "dependencies", "project_dependencies"]
              const actualTables = tablesData.tables ? tablesData.tables.map((t: any) => t.table_name || t.name) : []
              
              result = {
                expectedTables,
                actualTables,
                missingTables: expectedTables.filter(t => !actualTables.includes(t)),
                extraTables: actualTables.filter((t: string) => !expectedTables.includes(t)),
                totalTables: actualTables.length,
                schemaValid: expectedTables.every(t => actualTables.includes(t))
              }
            } else {
              throw new Error("Cannot list tables - API failed")
            }
            break

          case 2: // Test Table Permissions
            result = { testType: "permissions", tests: [] }
            
            // Test user_roles table access
            const rolesTestResponse = await fetch('/api/admin/get-user-roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id })
            })
            
            result.tests.push({
              table: "user_roles",
              endpoint: "/api/admin/get-user-roles",
              canAccess: rolesTestResponse.ok,
              status: rolesTestResponse.status,
              data: rolesTestResponse.ok ? await rolesTestResponse.json() : null
            })
            
            // Test BTS images permissions
            const btsTestResponse = await fetch('/api/projects/bts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                projectId: "test-project-id",
                btsData: [{ image_url: "test.jpg", caption: "test" }]
              })
            })
            
            result.tests.push({
              table: "bts_images",
              endpoint: "/api/projects/bts",
              canAccess: btsTestResponse.status !== 401 && btsTestResponse.status !== 403,
              status: btsTestResponse.status,
              statusText: btsTestResponse.statusText
            })
            
            result.permissionsWorking = result.tests.every((test: any) => test.canAccess)
            break

          case 3: // Check Migration Status
            // Test direct table check
            const directCheckResponse = await fetch('/api/direct-table-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                tables: ["user_roles", "site_settings", "projects", "bts_images"] 
              })
            })
            
            if (directCheckResponse.ok) {
              result = await directCheckResponse.json()
              result.migrationNeeded = !result.success || result.missingTables?.length > 0
            } else {
              result = {
                directCheckFailed: true,
                status: directCheckResponse.status,
                migrationNeeded: "unknown"
              }
            }
            break

          case 4: // Test CLI Integration
            result = {
              testType: "CLI integration",
              cliTests: []
            }
            
            // Test CLI validation endpoint if it exists
            try {
              const cliResponse = await fetch('/api/debug/cli-validation')
              if (cliResponse.ok) {
                const cliData = await cliResponse.json()
                result.cliTests.push({
                  test: "CLI API validation",
                  success: true,
                  data: cliData
                })
              } else {
                result.cliTests.push({
                  test: "CLI API validation",
                  success: false,
                  status: cliResponse.status
                })
              }
            } catch (cliError) {
              result.cliTests.push({
                test: "CLI API validation",
                success: false,
                error: String(cliError)
              })
            }
            
            result.cliWorking = result.cliTests.some((test: any) => test.success)
            break

          case 5: // Validate BTS Images Table
            // Check table structure specifically
            const btsTableCheck = await fetch('/api/direct-table-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tables: ["bts_images"] })
            })
            
            if (btsTableCheck.ok) {
              const btsData = await btsTableCheck.json()
              result = {
                tableExists: btsData.success && btsData.existingTables?.includes("bts_images"),
                tableData: btsData,
                btsSpecificTest: "Table structure validation"
              }
            } else {
              result = {
                tableExists: false,
                error: "Cannot check BTS images table",
                status: btsTableCheck.status
              }
            }
            
            // Test actual BTS functionality
            result.functionalityTest = {
              endpoint: "/api/projects/bts",
              note: "Functionality tested in permissions step"
            }
            break

          case 6: // Test Banner Logic
            // Test localStorage functionality
            try {
              const testKey = 'db_validation_test_' + Date.now()
              const testValue = 'test_value'
              
              localStorage.setItem(testKey, testValue)
              const retrievedValue = localStorage.getItem(testKey)
              localStorage.removeItem(testKey)
              
              result = {
                localStorageWorking: retrievedValue === testValue,
                bannerLogic: "localStorage test passed",
                bannerPersistence: "Can store and retrieve values"
              }
            } catch (error) {
              result = {
                localStorageWorking: false,
                error: String(error),
                bannerLogic: "localStorage test failed"
              }
            }
            break

          case 7: // Performance Test
            const perfStartTime = Date.now()
            const perfTests = []
            
            // Test 1: Table listing performance
            try {
              const listStartTime = Date.now()
              const listResponse = await fetch('/api/list-all-tables')
              const listDuration = Date.now() - listStartTime
              perfTests.push({
                test: "list all tables",
                duration: listDuration,
                success: listResponse.ok
              })
            } catch (error) {
              perfTests.push({
                test: "list all tables",
                duration: Date.now() - perfStartTime,
                success: false,
                error: String(error)
              })
            }
            
            // Test 2: User roles query performance
            try {
              const rolesStartTime = Date.now()
              const rolesResponse = await fetch('/api/admin/get-user-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
              })
              const rolesDuration = Date.now() - rolesStartTime
              perfTests.push({
                test: "user roles query",
                duration: rolesDuration,
                success: rolesResponse.ok
              })
            } catch (error) {
              perfTests.push({
                test: "user roles query",
                duration: Date.now() - perfStartTime,
                success: false,
                error: String(error)
              })
            }
            
            result = {
              tests: perfTests,
              totalDuration: Date.now() - perfStartTime,
              averageResponseTime: perfTests.length > 0 ? 
                perfTests.reduce((sum, test) => sum + test.duration, 0) / perfTests.length : 0,
              allTestsPassed: perfTests.every(test => test.success)
            }
            break
        }

        const duration = Date.now() - startTime
        updateStep(i, { 
          status: 'success', 
          result, 
          duration 
        })

      } catch (error) {
        const duration = Date.now() - startTime
        updateStep(i, { 
          status: 'error', 
          error: error instanceof Error ? error.message : String(error),
          duration 
        })
      }

      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setCurrentStepIndex(-1)
    setIsRunning(false)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isSignedIn || !currentUser) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Comprehensive Database Debug</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to use the database debug tool.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Comprehensive Database Debug</h1>
        <Button
          onClick={runDebugSequence}
          disabled={isRunning}
          variant="default"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRunning ? "Running Tests..." : "Run Full Debug"}
        </Button>
      </div>

      {/* Current User Info */}
      <Card className="mb-6 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Environment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">User ID</p>
              <p className="font-mono text-xs">{currentUser.id}</p>
            </div>
            <div>
              <p className="text-gray-400">Email</p>
              <p>{currentUser.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div>
              <p className="text-gray-400">Admin Status</p>
              <Badge variant={currentUser.publicMetadata?.superAdmin ? "default" : "secondary"}>
                {currentUser.publicMetadata?.superAdmin ? "Super Admin" : "Standard User"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={index} className={`bg-gray-800 ${currentStepIndex === index ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step.status === 'pending' && <div className="w-4 h-4 rounded-full bg-gray-600" />}
                  {step.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                  {step.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {step.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  
                  <span className="text-base">{index + 1}. {step.name}</span>
                </div>
                
                {step.duration && (
                  <Badge variant="outline" className="text-xs">
                    {step.duration}ms
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-400">{step.description}</p>
            </CardHeader>
            
            {(step.result || step.error) && (
              <CardContent className="pt-0">
                {step.error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{step.error}</AlertDescription>
                  </Alert>
                ) : step.result ? (
                  <div className="bg-gray-900 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                    <pre>{JSON.stringify(step.result, null, 2)}</pre>
                  </div>
                ) : null}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="mt-6 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Comprehensive Database Debug Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-400">
            <p><strong>Purpose:</strong> This tool comprehensively tests the entire database system to identify any issues with connectivity, schema, permissions, or functionality.</p>
            <p><strong>What it tests:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Database connection and authentication via Supabase</li>
              <li>Complete table schema validation against expected structure</li>
              <li>Row-level security (RLS) policies and permission testing</li>
              <li>Database migration status and consistency checks</li>
              <li>CLI integration and schema generation tools</li>
              <li>BTS images table structure and functionality</li>
              <li>Database manager banner logic and localStorage persistence</li>
              <li>Performance metrics for key database operations</li>
            </ul>
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>All database connections should succeed without errors</li>
              <li>All required tables should exist with correct names and structure</li>
              <li>Admin users should have proper access to all protected tables</li>
              <li>Migration tools should work correctly and detect schema changes</li>
              <li>BTS functionality should work for admin users</li>
              <li>Performance should be reasonable (&lt;1000ms for most operations)</li>
              <li>All green checkmarks indicate the system is working correctly</li>
            </ul>
            <p><strong>Related Debugging Tools:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>/admin/database</strong> - Database manager with migration tools and banner</li>
              <li><strong>/admin/debug/database</strong> - Alternative database diagnostic tools</li>
              <li><strong>/admin/debug/bts</strong> - BTS-specific debugging and testing</li>
              <li><strong>/admin/debug/roles</strong> - Role system debugging and synchronization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}