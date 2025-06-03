"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, RefreshCw, CheckCircle, AlertTriangle, User, Database, Key } from "lucide-react"
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

  const debugSteps: Omit<DebugStep, 'status'>[] = [
    {
      name: "Check User Authentication",
      description: "Verify the user is properly authenticated via Clerk"
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

          case 1: // Fetch Clerk User Metadata
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

          case 2: // Check Supabase Roles
            const rolesResponse = await fetch('/api/admin/get-user-roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id })
            })
            
            if (!rolesResponse.ok) {
              const errorData = await rolesResponse.json()
              throw new Error(errorData.error || 'Failed to fetch Supabase roles')
            }
            
            result = await rolesResponse.json()
            break

          case 3: // Test Role Sync API
            const syncResponse = await fetch('/api/admin/sync-roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id })
            })
            
            if (!syncResponse.ok) {
              const errorData = await syncResponse.json()
              throw new Error(errorData.error || 'Role sync failed')
            }
            
            result = await syncResponse.json()
            break

          case 4: // Verify Role Sync Results
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

          case 5: // Test BTS Permission Check
            // Simulate the exact check used in BTS API
            const btsCheckResponse = await fetch('/api/debug/bts-permission-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id })
            })
            
            result = {
              apiExists: btsCheckResponse.status !== 404,
              status: btsCheckResponse.status
            }
            
            if (btsCheckResponse.status === 404) {
              // Create a manual simulation
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
              }
            }
            break

          case 6: // Test Admin Role Assignment
            if (currentUser.publicMetadata?.superAdmin === true) {
              // Get current state
              const currentRolesResponse = await fetch('/api/admin/get-user-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
              })
              
              const currentRolesData = currentRolesResponse.ok ? await currentRolesResponse.json() : { roles: [] }
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
                const toggleResponse = await fetch("/api/admin/toggle-role", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: currentUser.id,
                    role: "admin",
                    action: "add",
                  }),
                })
                
                const toggleResult = toggleResponse.ok ? await toggleResponse.json() : { error: "Failed to toggle role" }
                console.log("[role-debug] Toggle role result:", toggleResult)
                
                // Trigger role sync after adding
                const syncAfterAddResponse = await fetch('/api/admin/sync-roles', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: currentUser.id })
                })
                
                const syncAfterAddData = syncAfterAddResponse.ok ? await syncAfterAddResponse.json() : { error: "Sync failed" }
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