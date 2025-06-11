"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Play, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  success: boolean
  step: string
  error?: string
  data?: any
  debug?: any
}

export default function BtsDebugPage() {
  const [testProjectId, setTestProjectId] = useState("")
  const [testImages, setTestImages] = useState("https://example.com/image1.jpg\nhttps://example.com/image2.jpg")
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)

  // Load existing projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
          if (data.projects && data.projects.length > 0) {
            setTestProjectId(data.projects[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    loadProjects()
  }, [])

  const runBtsTest = async (testMode = false) => {
    setIsTestRunning(true)
    setTestResults([])

    const images = testImages.split('\n').filter(img => img.trim())
    
    if (!testProjectId || images.length === 0) {
      setTestResults([{
        success: false,
        step: "validation",
        error: "Project ID and at least one image URL required"
      }])
      setIsTestRunning(false)
      return
    }

    try {
      // Test the debug BTS API
      const debugResponse = await fetch('/api/debug/bts-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          images,
          testMode: true
        })
      })

      const debugResult = await debugResponse.json()
      
      setTestResults(prev => [...prev, {
        success: debugResponse.ok,
        step: "debug_api_test",
        error: debugResponse.ok ? null : debugResult.error,
        data: debugResult,
        debug: debugResult.debug
      }])

      if (debugResponse.ok && !testMode) {
        // Test the actual BTS API
        const realResponse = await fetch('/api/projects/bts-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            projectId: testProjectId,
            images,
            replaceExisting: true
          })
        })

        let realResult: any = null
        try {
          realResult = await realResponse.json()
        } catch (jsonError) {
          realResult = {
            error: "JSON parse error",
            parseError: (jsonError as Error).message,
            responseStatus: realResponse.status,
            responseStatusText: realResponse.statusText
          }
        }

        setTestResults(prev => [...prev, {
          success: realResponse.ok,
          step: "real_bts_api_test",
          error: realResponse.ok ? null : realResult.error,
          data: realResult,
          debug: realResult.debug
        }])

        // Test project creation flow
        const createResponse = await fetch('/api/projects/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: `BTS Test Project ${Date.now()}`,
            category: "Test",
            role: "Test",
            image: images[0],
            is_public: false,
            project_date: new Date().toISOString().split('T')[0]
          })
        })

        let createResult: any = null
        try {
          createResult = await createResponse.json()
        } catch (jsonError) {
          createResult = {
            error: "JSON parse error",
            parseError: (jsonError as Error).message,
            responseStatus: createResponse.status,
            responseStatusText: createResponse.statusText
          }
        }

        setTestResults(prev => [...prev, {
          success: createResponse.ok,
          step: "project_creation_test",
          error: createResponse.ok ? null : createResult.error,
          data: createResult,
          debug: createResult.debug
        }])

        // If project creation succeeded, test BTS with new project
        if (createResponse.ok && createResult.data && createResult.data[0]) {
          const newProjectId = createResult.data[0].id
          
          const newBtsResponse = await fetch('/api/projects/bts-images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              projectId: newProjectId,
              images,
              replaceExisting: false
            })
          })

          let newBtsResult: any = null
          try {
            newBtsResult = await newBtsResponse.json()
          } catch (jsonError) {
            newBtsResult = {
              error: "JSON parse error",
              parseError: (jsonError as Error).message,
              responseStatus: newBtsResponse.status,
              responseStatusText: newBtsResponse.statusText
            }
          }

          setTestResults(prev => [...prev, {
            success: newBtsResponse.ok,
            step: "new_project_bts_test",
            error: newBtsResponse.ok ? null : newBtsResult.error,
            data: newBtsResult,
            debug: newBtsResult.debug
          }])
        }
      }

    } catch (error) {
      setTestResults(prev => [...prev, {
        success: false,
        step: "fetch_error",
        error: error instanceof Error ? error.message : "Unknown error",
        debug: { errorType: typeof error, errorString: String(error) }
      }])
    } finally {
      setIsTestRunning(false)
    }
  }

  const getStepIcon = (result: TestResult) => {
    if (isTestRunning) return <Loader2 className="h-4 w-4 animate-spin" />
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStepName = (step: string) => {
    switch (step) {
      case "debug_api_test": return "Debug BTS API Test"
      case "real_bts_api_test": return "Real BTS API Test"
      case "project_creation_test": return "Project Creation Test"
      case "new_project_bts_test": return "New Project BTS Test"
      case "fetch_error": return "Network/Fetch Error"
      default: return step
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">BTS Images Debug Tool</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Project ID</label>
              {isLoadingProjects ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading projects...</span>
                </div>
              ) : (
                <select 
                  value={testProjectId} 
                  onChange={(e) => setTestProjectId(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title} ({project.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
              )}
              {testProjectId && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {testProjectId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Test Image URLs (one per line)</label>
              <Textarea
                value={testImages}
                onChange={(e) => setTestImages(e.target.value)}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => runBtsTest(true)} 
                disabled={isTestRunning || !testProjectId}
                variant="outline"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Only (No Changes)
              </Button>
              <Button 
                onClick={() => runBtsTest(false)} 
                disabled={isTestRunning || !testProjectId}
              >
                <Play className="h-4 w-4 mr-2" />
                Full Test (Creates Data)
              </Button>
            </div>

            {(!testProjectId || testImages.split('\n').filter(img => img.trim()).length === 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a project and provide at least one test image URL.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 && !isTestRunning && (
              <p className="text-gray-500">No tests run yet. Click a test button to start.</p>
            )}

            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStepIcon(result)}
                    <h3 className="font-medium">{getStepName(result.step)}</h3>
                  </div>

                  {result.error && (
                    <Alert variant="destructive" className="mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}

                  {result.success && result.data && (
                    <div className="text-green-600 text-sm mb-2">
                      ✓ {result.data.message || "Success"}
                    </div>
                  )}

                  {result.debug && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.debug, null, 2)}
                      </pre>
                    </details>
                  )}

                  {result.data && result.data !== result.debug && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Response Data</summary>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              
              {isTestRunning && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Running tests...</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Issues Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Known Issues & Debugging Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-red-600">Current Error:</h3>
              <p className="text-sm">
                <code>TypeError: e.currentTarget is null</code> and 
                <code>Error saving project: SyntaxError: JSON.parse: unexpected end of data at line 1 column 1 of the JSON data</code>
              </p>
            </div>

            <div>
              <h3 className="font-medium">Debugging Steps:</h3>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>Verify authentication and admin role permissions</li>
                <li>Check if projects table and bts_images table exist and are accessible</li>
                <li>Test project creation API independently</li>
                <li>Test BTS images API independently</li>
                <li>Test the full project creation + BTS images flow</li>
                <li>Check for import/export issues in API routes</li>
                <li>Verify response format and JSON parsing</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium">Recent Fixes:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Fixed import path for <code>getRouteHandlerSupabaseClient</code> in project creation API</li>
                <li>Added comprehensive logging and error handling</li>
                <li>Created debug API endpoint for detailed testing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}