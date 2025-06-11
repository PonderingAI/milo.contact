"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, RefreshCw, CheckCircle, AlertTriangle, User, Database, Key, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DebugStep {
  name: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: any
  error?: string
  duration?: number
}

export default function RoleDebugPage() {
  const { user: currentUser, isLoaded, isSignedIn } = useUser()
  const [steps, setSteps] = useState<DebugStep[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [networkStatus, setNetworkStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')

  const debugSteps: Omit<DebugStep, 'status'>[] = [
    {
      name: "Check User Authentication",
      description: "Verify the user is properly authenticated via Clerk"
    },
    {
      name: "Check Environment Configuration",
      description: "Verify Supabase environment variables and service role access"
    },
    {
      name: "Check Database Tables",
      description: "Verify user_roles table exists and is accessible"
    },
    {
      name: "Fetch Clerk User Metadata",
      description: "Get user's roles and superAdmin status from Clerk"
    },
    {
      name: "Check Supabase Roles",
      description: "Query user_roles table for current user's roles"
    },
    {
      name: "Test Role Sync API",
      description: "Call the role sync endpoint to sync Clerk -> Supabase"
    },
    {
      name: "Verify Role Sync Results",
      description: "Confirm roles are properly synced after API call"
    },
    {
      name: "Test BTS Permission Check",
      description: "Simulate the permission check used by BTS API"
    },
    {
      name: "Test Admin Role Assignment",
      description: "Test adding/removing admin role (if superAdmin)"
    }
  ]

  useEffect(() => {
    // Initialize steps
    setSteps(debugSteps.map(step => ({ ...step, status: 'pending' })))
    
    // Check network status
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline')
    }
    
    updateNetworkStatus()
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
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
          case 0: // Check User Authentication
            result = {
              isLoaded,
              isSignedIn,
              userId: currentUser?.id,
              hasUser: !!currentUser
            }
            if (!isLoaded || !isSignedIn || !currentUser) {
              throw new Error("User not properly authenticated")
            }
            break

          case 1: // Check Environment Configuration
            // Test if environment variables are accessible to the API
            let envCheckResponse: Response
            let envData: any = {}
            let hasSupabaseConfig = false
            
            try {
              envCheckResponse = await fetch('/api/debug/system-info')
              
              if (envCheckResponse.ok) {
                envData = await envCheckResponse.json()
                hasSupabaseConfig = !!(envData.supabaseUrl && envData.hasServiceRoleKey)
              } else {
                throw new Error(`Environment check API returned ${envCheckResponse.status}: ${envCheckResponse.statusText}`)
              }
            } catch (fetchError) {
              console.error("Network error checking environment:", fetchError)
              throw new Error(`Network error checking environment: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
            }
            
            result = {
              envApiWorking: envCheckResponse.ok,
              envApiStatus: envCheckResponse.status,
              supabaseUrl: envData.supabaseUrl ? "configured" : "missing",
              serviceRoleKey: envData.hasServiceRoleKey ? "configured" : "missing",
              hasRequiredConfig: hasSupabaseConfig,
              envData: envData
            }
            
            if (!hasSupabaseConfig) {
              throw new Error("Missing required Supabase environment variables (URL or Service Role Key)")
            }
            break

          case 2: // Check Database Tables
            // Check if user_roles table exists with better error handling
            let tableCheckResponse: Response
            let tableData: any = {}
            
            try {
              tableCheckResponse = await fetch('/api/debug/setup-list-tables')
              
              if (tableCheckResponse.ok) {
                tableData = await tableCheckResponse.json()
              } else {
                console.error(`Table check API returned ${tableCheckResponse.status}:`, await tableCheckResponse.text())
                throw new Error(`Table listing API failed: ${tableCheckResponse.status} ${tableCheckResponse.statusText}`)
              }
            } catch (fetchError) {
              console.error("Network error checking tables:", fetchError)
              throw new Error(`Network error checking tables: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
            }
            
            const hasUserRolesTable = tableData.tables && tableData.tables.some((table: any) => 
              table.table_name === 'user_roles' || table.name === 'user_roles'
            )
            
            // Try to directly test user_roles table access
            let tableAccessTest = null
            
            try {
              const testRoleResponse = await fetch('/api/admin/get-user-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'test-user-id' })
              })
              
              tableAccessTest = {
                status: testRoleResponse.status,
                accessible: testRoleResponse.status !== 404 && testRoleResponse.status !== 500
              }
            } catch (error) {
              tableAccessTest = {
                error: error instanceof Error ? error.message : String(error),
                accessible: false
              }
            }
            
            result = {
              tableListWorking: tableCheckResponse.ok,
              hasUserRolesTable,
              allTables: tableData.tables || [],
              tableAccessTest,
              tableCount: tableData.tables?.length || 0,
              apiMethod: tableData.method || "unknown"
            }
            
            if (!hasUserRolesTable) {
              throw new Error("user_roles table does not exist in database")
            }
            break

          case 3: // Fetch Clerk User Metadata
            result = {
              id: currentUser.id,
              email: currentUser.primaryEmailAddress?.emailAddress,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              publicMetadata: currentUser.publicMetadata,
              isSuperAdmin: currentUser.publicMetadata?.superAdmin === true,
              clerkRoles: (currentUser.publicMetadata?.roles as string[]) || []
            }
            break

          case 4: // Check Supabase Roles
            // Now check the actual roles (table existence was verified in step 2)
            let rolesResponse: Response
            let rolesData: any = {}
            
            try {
              rolesResponse = await fetch('/api/admin/get-user-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
              })
              
              if (!rolesResponse.ok) {
                const errorText = await rolesResponse.text()
                let errorData: any = {}
                try {
                  errorData = JSON.parse(errorText)
                } catch {
                  errorData = { error: errorText }
                }
                throw new Error(errorData.error || `API returned ${rolesResponse.status}: ${rolesResponse.statusText}`)
              }
              
              rolesData = await rolesResponse.json()
            } catch (fetchError) {
              console.error("Error fetching user roles:", fetchError)
              throw new Error(`Failed to check Supabase roles: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
            }
            
            result = rolesData
            break

          case 5: // Test Role Sync API
            let syncResponse: Response
            let syncData: any = {}
            
            try {
              syncResponse = await fetch('/api/admin/sync-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
              })
              
              try {
                const responseText = await syncResponse.text()
                if (responseText) {
                  syncData = JSON.parse(responseText)
                } else {
                  syncData = { parseError: "Empty response body" }
                }
              } catch (jsonError) {
                console.error("[role-debug] Failed to parse sync response as JSON:", jsonError)
                syncData = { parseError: "Response was not valid JSON" }
              }
            } catch (fetchError) {
              console.error("Network error during role sync:", fetchError)
              throw new Error(`Network error during role sync: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
            }
            
            result = {
              status: syncResponse.status,
              ok: syncResponse.ok,
              headers: Object.fromEntries(syncResponse.headers.entries()),
              data: syncData
            }
            
            if (!syncResponse.ok) {
              throw new Error(`Role sync failed: ${syncData.error || syncResponse.statusText}`)
            }
            break

          case 6: // Verify Role Sync Results
            const verifyResponse = await fetch('/api/admin/get-user-roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id })
            })
            
            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json()
              throw new Error(errorData.error || 'Failed to verify roles')
            }
            
            const verifyData = await verifyResponse.json()
            const isSuperAdmin = currentUser.publicMetadata?.superAdmin === true
            const hasAdminRole = verifyData.roles.includes('admin')
            
            result = {
              ...verifyData,
              isSuperAdmin,
              hasAdminRole,
              syncWorking: !isSuperAdmin || hasAdminRole
            }
            
            if (isSuperAdmin && !hasAdminRole) {
              throw new Error("SuperAdmin user should have admin role but doesn't")
            }
            break

          case 7: // Test BTS Permission Check
            // Simulate the exact check used in BTS API
            let btsCheckResponse: Response
            let btsCheckWorking = false
            
            try {
              btsCheckResponse = await fetch('/api/debug/bts-permission-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
              })
              
              btsCheckWorking = btsCheckResponse.status !== 404
            } catch (fetchError) {
              console.error("Network error during BTS permission check:", fetchError)
              btsCheckWorking = false
              btsCheckResponse = { status: 0 } as Response
            }
            
            result = {
              apiExists: btsCheckWorking,
              status: btsCheckResponse.status
            }
            
            if (!btsCheckWorking) {
              // Create a manual simulation
              try {
                const manualRolesResponse = await fetch('/api/admin/get-user-roles', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: currentUser.id })
                })
                
                if (manualRolesResponse.ok) {
                  const rolesData = await manualRolesResponse.json()
                  const hasAdminRole = rolesData.roles.includes('admin')
                  result = {
                    ...result,
                    simulatedCheck: true,
                    hasAdminRole,
                    wouldAllowBTS: hasAdminRole
                  }
                } else {
                  result = {
                    ...result,
                    simulatedCheck: false,
                    error: "Failed to simulate BTS check"
                  }
                }
              } catch (manualError) {
                result = {
                  ...result,
                  simulatedCheck: false,
                  error: `Manual simulation failed: ${manualError instanceof Error ? manualError.message : String(manualError)}`
                }
              }
            }
            break

          case 8: // Test Admin Role Assignment
            if (currentUser.publicMetadata?.superAdmin === true) {
              // Get current state
              let currentRolesResponse: Response
              let currentRolesData: any = { roles: [] }
              
              try {
                currentRolesResponse = await fetch('/api/admin/get-user-roles', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: currentUser.id })
                })
                
                if (currentRolesResponse.ok) {
                  currentRolesData = await currentRolesResponse.json()
                }
              } catch (fetchError) {
                console.error("Error fetching current roles for test:", fetchError)
              }
              
              const currentClerkRoles = (currentUser.publicMetadata?.roles as string[]) || []
              const hasAdminInClerk = currentClerkRoles.includes('admin')
              const hasAdminInSupabase = currentRolesData.roles.includes('admin')
              
              console.log("[role-debug] Testing admin role assignment", {
                hasAdminInClerk,
                hasAdminInSupabase,
                currentClerkRoles,
                currentSupabaseRoles: currentRolesData.roles
              })
              
              // Test adding admin role if not present
              if (!hasAdminInClerk) {
                console.log("[role-debug] Adding admin role via toggle API")
                
                let toggleResult: any = { error: "Network error" }
                try {
                  const toggleResponse = await fetch("/api/admin/toggle-role", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: currentUser.id,
                      role: "admin",
                      action: "add",
                    }),
                  })
                  
                  toggleResult = toggleResponse.ok ? await toggleResponse.json() : { error: "Failed to toggle role" }
                } catch (fetchError) {
                  console.error("Network error during role toggle:", fetchError)
                  toggleResult = { error: `Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}` }
                }
                
                console.log("[role-debug] Toggle role result:", toggleResult)
                
                // Trigger role sync after adding
                let syncAfterAddData: any = { error: "Network error" }
                try {
                  const syncAfterAddResponse = await fetch('/api/admin/sync-roles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.id })
                  })
                  
                  syncAfterAddData = syncAfterAddResponse.ok ? await syncAfterAddResponse.json() : { error: "Sync failed" }
                } catch (fetchError) {
                  console.error("Network error during sync after add:", fetchError)
                  syncAfterAddData = { error: `Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}` }
                }
                
                console.log("[role-debug] Sync after add result:", syncAfterAddData)
                
                result = {
                  isSuperAdmin: true,
                  initialState: { hasAdminInClerk, hasAdminInSupabase },
                  toggleResult,
                  syncAfterAdd: syncAfterAddData,
                  testDescription: "Added admin role and synced to Supabase"
                }
              } else {
                result = {
                  isSuperAdmin: true,
                  hasAdminRole: true,
                  skipReason: "User already has admin role in Clerk",
                  testDescription: "Skipped - user already has admin role"
                }
              }
            } else {
              result = {
                isSuperAdmin: false,
                skipReason: "User is not superAdmin, cannot test role assignment",
                testDescription: "Skipped - requires superAdmin privileges"
              }
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
        <h1 className="text-3xl font-bold mb-6">Role System Debug</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to use the role debug tool.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Role System Debug</h1>
        <div className="flex items-center gap-4">
          {/* Network Status Indicator */}
          <div className="flex items-center gap-2">
            {networkStatus === 'online' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : networkStatus === 'offline' ? (
              <WifiOff className="h-4 w-4 text-red-500" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gray-400" />
            )}
            <Badge variant={networkStatus === 'online' ? 'default' : 'destructive'} className="text-xs">
              {networkStatus === 'online' ? 'Online' : networkStatus === 'offline' ? 'Offline' : 'Unknown'}
            </Badge>
          </div>
          
          <Button
            onClick={runDebugSequence}
            disabled={isRunning || networkStatus === 'offline'}
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
      </div>

      {/* Current User Info */}
      <Card className="mb-6 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Information
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
              <p className="text-gray-400">Super Admin</p>
              <Badge variant={currentUser.publicMetadata?.superAdmin ? "default" : "secondary"}>
                {currentUser.publicMetadata?.superAdmin ? "Yes" : "No"}
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
            <Shield className="h-5 w-5" />
            Debug Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-400">
            <p><strong>Purpose:</strong> This tool tests the complete role management system to identify issues with BTS permissions.</p>
            <p><strong>What it tests:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Clerk user authentication and metadata</li>
              <li>Supabase role table synchronization</li>
              <li>Role sync API functionality</li>
              <li>BTS permission validation logic</li>
              <li>Admin role assignment capabilities</li>
            </ul>
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>SuperAdmin users should automatically get admin role in Supabase</li>
              <li>Role sync should work without errors</li>
              <li>BTS permission check should pass for admin users</li>
              <li>All green checkmarks indicate the system is working correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}