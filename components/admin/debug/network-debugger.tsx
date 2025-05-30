"use client"

import { useState, useEffect } from "react"
import { Network, RefreshCw, Check, X, AlertTriangle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface EndpointStatus {
  url: string
  status: "success" | "error" | "pending" | "warning"
  responseTime?: number
  statusCode?: number
  error?: string
}

export default function NetworkDebugger() {
  const [endpointStatuses, setEndpointStatuses] = useState<EndpointStatus[]>([])
  const [customUrl, setCustomUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [corsIssues, setCorsIssues] = useState<string[]>([])
  const [networkLogs, setNetworkLogs] = useState<string[]>([])

  // Default endpoints to check
  const defaultEndpoints = [
    "/api/ping",
    "/api/test-supabase-connection",
    "/api/check-database-setup",
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/_vercel/insights/script.js",
  ]

  useEffect(() => {
    // Initial check
    checkEndpoints(defaultEndpoints)

    // Listen for network errors
    const originalFetch = window.fetch
    window.fetch = async (input, init) => {
      try {
        const response = await originalFetch(input, init)
        // Log successful requests
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
        setNetworkLogs((prev) =>
          [`[${new Date().toLocaleTimeString()}] Fetch: ${url} - ${response.status}`].concat(prev.slice(0, 99)),
        )
        return response
      } catch (error) {
        // Log failed requests
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
        setNetworkLogs((prev) =>
          [`[${new Date().toLocaleTimeString()}] Error: ${url} - ${error.message}`].concat(prev.slice(0, 99)),
        )
        throw error
      }
    }

    // Check for CORS issues
    const originalConsoleError = console.error
    console.error = (...args) => {
      const errorMessage = args.join(" ")
      if (errorMessage.includes("CORS") || errorMessage.includes("cross-origin")) {
        setCorsIssues((prev) => [errorMessage, ...prev])
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      // Restore original functions
      window.fetch = originalFetch
      console.error = originalConsoleError
    }
  }, [])

  const checkEndpoints = async (endpoints: string[]) => {
    setIsLoading(true)

    // Reset statuses
    setEndpointStatuses(
      endpoints.map((url) => ({
        url,
        status: "pending",
      })),
    )

    // Check each endpoint
    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i]
      try {
        const startTime = performance.now()
        const response = await fetch(url, {
          method: "HEAD",
          // No-cache to ensure we're testing the actual network
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
          },
        })
        const endTime = performance.now()

        setEndpointStatuses((prev) => {
          const newStatuses = [...prev]
          const index = newStatuses.findIndex((s) => s.url === url)
          if (index !== -1) {
            newStatuses[index] = {
              url,
              status: response.ok ? "success" : "warning",
              responseTime: Math.round(endTime - startTime),
              statusCode: response.status,
            }
          }
          return newStatuses
        })
      } catch (error) {
        setEndpointStatuses((prev) => {
          const newStatuses = [...prev]
          const index = newStatuses.findIndex((s) => s.url === url)
          if (index !== -1) {
            newStatuses[index] = {
              url,
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            }
          }
          return newStatuses
        })
      }
    }

    setIsLoading(false)
  }

  const checkCustomUrl = async () => {
    if (!customUrl) return

    try {
      setIsLoading(true)
      const startTime = performance.now()
      const response = await fetch(customUrl, {
        method: "HEAD",
        cache: "no-cache",
      })
      const endTime = performance.now()

      setEndpointStatuses((prev) => [
        {
          url: customUrl,
          status: response.ok ? "success" : "warning",
          responseTime: Math.round(endTime - startTime),
          statusCode: response.status,
        },
        ...prev,
      ])
    } catch (error) {
      setEndpointStatuses((prev) => [
        {
          url: customUrl,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
        ...prev,
      ])
    } finally {
      setIsLoading(false)
      setCustomUrl("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-bold text-green-400">Network Diagnostics</h2>
        </div>
        <Button
          onClick={() => checkEndpoints(defaultEndpoints)}
          disabled={isLoading}
          variant="outline"
          className="border-green-700 text-green-400 hover:bg-green-900/20"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Custom URL checker */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="Enter URL to check..."
          className="flex-1 bg-black border-green-700 text-green-400"
        />
        <Button
          onClick={checkCustomUrl}
          disabled={isLoading || !customUrl}
          variant="outline"
          className="border-green-700 text-green-400 hover:bg-green-900/20"
        >
          Check URL
        </Button>
      </div>

      {/* Endpoint statuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {endpointStatuses.map((endpoint, index) => (
          <Card key={index} className="bg-black border-green-700">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-mono flex items-center justify-between">
                <span className="truncate">{endpoint.url}</span>
                {endpoint.status === "success" && <Check className="h-4 w-4 text-green-500" />}
                {endpoint.status === "error" && <X className="h-4 w-4 text-red-500" />}
                {endpoint.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                {endpoint.status === "pending" && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs space-y-1">
                {endpoint.status === "pending" ? (
                  <Progress value={50} className="h-1 bg-green-900/20" />
                ) : (
                  <>
                    {endpoint.statusCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span
                          className={
                            endpoint.statusCode >= 200 && endpoint.statusCode < 300
                              ? "text-green-500"
                              : endpoint.statusCode >= 300 && endpoint.statusCode < 400
                                ? "text-blue-500"
                                : endpoint.statusCode >= 400 && endpoint.statusCode < 500
                                  ? "text-yellow-500"
                                  : "text-red-500"
                          }
                        >
                          {endpoint.statusCode}
                        </span>
                      </div>
                    )}
                    {endpoint.responseTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response time:</span>
                        <span
                          className={
                            endpoint.responseTime < 100
                              ? "text-green-500"
                              : endpoint.responseTime < 300
                                ? "text-blue-500"
                                : endpoint.responseTime < 1000
                                  ? "text-yellow-500"
                                  : "text-red-500"
                          }
                        >
                          {endpoint.responseTime}ms
                        </span>
                      </div>
                    )}
                    {endpoint.error && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Error:</span>
                        <span className="text-red-500 truncate max-w-[200px]" title={endpoint.error}>
                          {endpoint.error}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CORS Issues */}
      {corsIssues.length > 0 && (
        <Card className="bg-black border-red-700">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-mono flex items-center text-red-500">
              <AlertTriangle className="h-4 w-4 mr-2" />
              CORS Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
              {corsIssues.map((issue, i) => (
                <div key={i} className="text-red-400 border-b border-red-900 pb-1 mb-1">
                  {issue}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Logs */}
      <Card className="bg-black border-green-700">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-mono flex items-center justify-between">
            <span>Network Activity Log</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-green-400 hover:bg-green-900/20"
              onClick={() => setNetworkLogs([])}
            >
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto font-mono">
            {networkLogs.length > 0 ? (
              networkLogs.map((log, i) => (
                <div key={i} className="text-green-400 border-b border-green-900/30 pb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500 italic">No network activity logged yet</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="bg-black border-green-700">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-mono">Troubleshooting Resources</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xs space-y-2">
            <div className="flex items-center">
              <ExternalLink className="h-3 w-3 mr-2 text-green-500" />
              <a
                href="https://vercel.com/docs/concepts/functions/serverless-functions/troubleshooting"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                Vercel Serverless Functions Troubleshooting
              </a>
            </div>
            <div className="flex items-center">
              <ExternalLink className="h-3 w-3 mr-2 text-green-500" />
              <a
                href="https://nextjs.org/docs/messages/api-routes-response-size-limit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                Next.js API Response Size Limits
              </a>
            </div>
            <div className="flex items-center">
              <ExternalLink className="h-3 w-3 mr-2 text-green-500" />
              <a
                href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                CORS Errors Guide
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
