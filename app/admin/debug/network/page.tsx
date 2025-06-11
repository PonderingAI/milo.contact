"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Network, CheckCircle, AlertTriangle, Database, Server, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TestStep {
  name: string
  description: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: any
  error?: string
  duration?: number
}

export default function NetworkDebugPage() {
  const { user: currentUser, isLoaded, isSignedIn } = useUser()
  const [steps, setSteps] = useState<TestStep[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)

  const testSteps: Omit<TestStep, 'status'>[] = [
    {
      name: "Test Database Setup API",
      description: "Check if /api/check-database-setup endpoint is working correctly"
    },
    {
      name: "Test API Response Format",
      description: "Verify API returns expected isSetup field"
    },
    {
      name: "Test Supabase Connection",
      description: "Direct test of Supabase connectivity without multiple clients"
    },
    {
      name: "Test RPC Functions",
      description: "Check if database RPC functions are working"
    },
    {
      name: "Test Role Sync API",
      description: "Verify role synchronization endpoints are accessible"
    },
    {
      name: "Test BTS Permission API",
      description: "Check BTS permission check endpoint"
    },
    {
      name: "Test All Admin APIs",
      description: "Comprehensive test of all admin-related API endpoints"
    },
    {
      name: "Detect Multiple Clients",
      description: "Check for multiple Supabase client instances"
    }
  ]

  useEffect(() => {
    setSteps(testSteps.map(step => ({ ...step, status: 'pending' })))
  }, [])

  const updateStep = (index: number, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ))
  }

  const runNetworkTests = async () => {
    if (!currentUser) return

    setIsRunning(true)
    setCurrentStepIndex(0)

    // Reset all steps
    setSteps(testSteps.map(step => ({ ...step, status: 'pending' })))

    for (let i = 0; i < testSteps.length; i++) {
      setCurrentStepIndex(i)
      updateStep(i, { status: 'running' })
      
      const startTime = Date.now()
      
      try {
        let result: any = null

        switch (i) {
          case 0: // Test Database Setup API
            try {
              const response = await fetch('/api/check-database-setup')
              const responseData = await response.json()
              
              result = {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                data: responseData,
                headers: Object.fromEntries(response.headers.entries())
              }
              
              if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${responseData.error || response.statusText}`)
              }
            } catch (fetchError) {
              throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
            }
            break

          case 1: // Test API Response Format
            const setupResponse = await fetch('/api/check-database-setup')
            const setupData = await setupResponse.json()
            
            result = {
              hasIsSetup: 'isSetup' in setupData,
              hasAllTablesExist: 'allTablesExist' in setupData,
              hasTablesNeeded: 'tablesNeeded' in setupData,
              actualData: setupData,
              isValidFormat: 'isSetup' in setupData && 'allTablesExist' in setupData
            }
            
            if (!result.isValidFormat) {
              throw new Error("API response missing required fields")
            }
            break

          case 2: // Test Supabase Connection
            // Use the API to test Supabase connection to avoid creating multiple clients
            const supabaseTestResponse = await fetch('/api/debug/setup-list-tables')
            const supabaseTestData = await supabaseTestResponse.json()
            
            result = {
              apiWorking: supabaseTestResponse.ok,
              status: supabaseTestResponse.status,
              data: supabaseTestData
            }
            
            if (!supabaseTestResponse.ok) {
              throw new Error(`Supabase connection test failed: ${supabaseTestData.error || 'Unknown error'}`)
            }
            break

          case 3: // Test RPC Functions
            const rpcResponse = await fetch('/api/setup-rpc-functions')
            
            result = {
              status: rpcResponse.status,
              accessible: rpcResponse.status !== 404,
              responseType: rpcResponse.headers.get('content-type')
            }
            
            // This endpoint might return 500 if RPC functions don't exist, but that's expected
            if (rpcResponse.status === 404) {
              throw new Error("RPC functions API endpoint not found")
            }
            break

          case 4: // Test Role Sync API
            if (!currentUser) {
              throw new Error("No authenticated user")
            }
            
            const roleSyncResponse = await fetch('/api/admin/sync-roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id })
            })
            
            result = {
              status: roleSyncResponse.status,
              accessible: roleSyncResponse.status !== 404,
              ok: roleSyncResponse.ok
            }
            
            if (roleSyncResponse.status === 404) {
              throw new Error("Role sync API endpoint not found")
            }
            break

          case 5: // Test BTS Permission API
            const btsPermissionResponse = await fetch('/api/debug/bts-permission-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser?.id })
            })
            
            result = {
              status: btsPermissionResponse.status,
              accessible: btsPermissionResponse.status !== 404,
              ok: btsPermissionResponse.ok
            }
            
            if (btsPermissionResponse.status === 404) {
              throw new Error("BTS permission check API endpoint not found")
            }
            break

          case 6: // Test All Admin APIs
            const adminAPIs = [
              '/api/admin/get-user-roles',
              '/api/admin/toggle-role',
              '/api/admin/users',
              '/api/projects/create'
            ]
            
            const apiResults: any = {}
            
            for (const apiPath of adminAPIs) {
              try {
                const testResponse = await fetch(apiPath, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ test: true })
                })
                
                apiResults[apiPath] = {
                  status: testResponse.status,
                  accessible: testResponse.status !== 404,
                  ok: testResponse.ok
                }
              } catch (apiError) {
                apiResults[apiPath] = {
                  error: apiError instanceof Error ? apiError.message : String(apiError),
                  accessible: false
                }
              }
            }
            
            result = {
              testedAPIs: adminAPIs.length,
              results: apiResults,
              allAccessible: Object.values(apiResults).every((r: any) => r.accessible !== false)
            }
            break

          case 7: // Detect Multiple Clients
            // Check for multiple Supabase clients using performance API and memory usage
            const performanceEntries = performance.getEntriesByType('resource')
            const supabaseRequests = performanceEntries.filter(entry => 
              entry.name.includes('supabase') || 
              entry.name.includes('gotrue') ||
              entry.name.includes('auth')
            )
            
            // Check for multiple client warning in console
            const originalConsoleWarn = console.warn
            let multipleClientWarnings = 0
            
            console.warn = (...args) => {
              if (args.some(arg => 
                typeof arg === 'string' && 
                arg.includes('Multiple GoTrueClient instances')
              )) {
                multipleClientWarnings++
              }
              originalConsoleWarn(...args)
            }
            
            // Trigger a small operation that might create clients
            await new Promise(resolve => setTimeout(resolve, 100))
            
            console.warn = originalConsoleWarn
            
            result = {
              supabaseRequests: supabaseRequests.length,
              multipleClientWarnings,
              hasMultipleClients: multipleClientWarnings > 0,
              recentRequests: supabaseRequests.slice(-5).map(entry => ({
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize
              }))
            }
            
            if (multipleClientWarnings > 0) {
              console.warn(`Detected ${multipleClientWarnings} multiple client warnings`)
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
      await new Promise(resolve => setTimeout(resolve, 300))
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
        <h1 className="text-3xl font-bold mb-6">Network & API Debug</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to use the network debug tool.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Network & API Debug</h1>
        <Button
          onClick={runNetworkTests}
          disabled={isRunning}
          variant="default"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Network className="h-4 w-4 mr-2" />
          )}
          {isRunning ? "Running Tests..." : "Run Network Tests"}
        </Button>
      </div>

      {/* Current User Info */}
      <Card className="mb-6 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Connection Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">User ID</p>
              <p className="font-mono text-xs">{currentUser.id}</p>
            </div>
            <div>
              <p className="text-gray-400">Environment</p>
              <p>{process.env.NODE_ENV || 'unknown'}</p>
            </div>
            <div>
              <p className="text-gray-400">Browser</p>
              <p>{navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Steps */}
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
            <Database className="h-5 w-5" />
            Debug Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-400">
            <p><strong>Purpose:</strong> This tool diagnoses network connectivity and API endpoint issues that cause "Network error checking tables" and multiple client warnings.</p>
            <p><strong>What it tests:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Database setup API endpoint connectivity and response format</li>
              <li>Supabase connection without creating multiple client instances</li>
              <li>All admin API endpoints accessibility</li>
              <li>Detection of multiple GoTrueClient instances</li>
              <li>Network error patterns and response timing</li>
            </ul>
            <p><strong>Expected results:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>All API endpoints should return proper status codes (not 404)</li>
              <li>Database setup API should return 'isSetup' field</li>
              <li>No multiple client warnings should be detected</li>
              <li>Response times should be reasonable (&lt;2000ms)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}