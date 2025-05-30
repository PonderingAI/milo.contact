"use client"

import React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Cpu, HardDrive, MemoryStickIcon as Memory, Globe, Clock, Server, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SystemInfoProps {
  className?: string
}

export default function SystemInfo({ className }: SystemInfoProps) {
  const [systemInfo, setSystemInfo] = useState<{
    browser: {
      name: string
      version: string
      userAgent: string
      language: string
      platform: string
      cookiesEnabled: boolean
      doNotTrack: string | null
      online: boolean
      screenSize: string
      colorDepth: number
      timezone: string
    }
    performance: {
      memory?: {
        jsHeapSizeLimit: number
        totalJSHeapSize: number
        usedJSHeapSize: number
      }
      timing?: {
        navigationStart: number
        loadEventEnd: number
        domComplete: number
        domInteractive: number
        connectEnd: number
      }
      resources?: {
        count: number
        size: number
        slowest: { name: string; duration: number }
      }
    }
    runtime: {
      nextVersion: string
      reactVersion: string
      nodeEnv: string
    }
  } | null>(null)

  const [serverInfo, setServerInfo] = useState<{
    supabase: {
      connected: boolean
      version?: string
      tables?: string[]
      error?: string
    }
    environment: {
      nodeVersion?: string
      platform?: string
    }
  } | null>(null)

  useEffect(() => {
    // Collect browser and performance information
    const collectSystemInfo = () => {
      const performance = window.performance
      const memory = (performance as any).memory
      const timing = performance.timing

      // Get browser info
      const browserInfo = {
        name: getBrowserName(),
        version: getBrowserVersion(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        online: navigator.onLine,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      // Get performance info
      const performanceInfo: any = {
        memory: memory
          ? {
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              totalJSHeapSize: memory.totalJSHeapSize,
              usedJSHeapSize: memory.usedJSHeapSize,
            }
          : undefined,
        timing: timing
          ? {
              navigationStart: timing.navigationStart,
              loadEventEnd: timing.loadEventEnd,
              domComplete: timing.domComplete,
              domInteractive: timing.domInteractive,
              connectEnd: timing.connectEnd,
            }
          : undefined,
      }

      // Get resource info
      if (performance.getEntriesByType) {
        const resources = performance.getEntriesByType("resource")
        let totalSize = 0
        let slowestResource = { name: "", duration: 0 }

        resources.forEach((resource: any) => {
          if (resource.transferSize) {
            totalSize += resource.transferSize
          }

          if (resource.duration > slowestResource.duration) {
            slowestResource = {
              name: resource.name,
              duration: resource.duration,
            }
          }
        })

        performanceInfo.resources = {
          count: resources.length,
          size: totalSize,
          slowest: slowestResource,
        }
      }

      // Get runtime info
      const runtimeInfo = {
        nextVersion: (window as any).__NEXT_DATA__?.buildId || "unknown",
        reactVersion: React.version,
        nodeEnv: process.env.NODE_ENV || "unknown",
      }

      setSystemInfo({
        browser: browserInfo,
        performance: performanceInfo,
        runtime: runtimeInfo,
      })
    }

    // Fetch server info
    const fetchServerInfo = async () => {
      try {
        const response = await fetch("/api/debug/system-info")
        if (response.ok) {
          const data = await response.json()
          setServerInfo(data)
        } else {
          setServerInfo({
            supabase: {
              connected: false,
              error: `Failed to fetch server info: ${response.status}`,
            },
            environment: {},
          })
        }
      } catch (error) {
        setServerInfo({
          supabase: {
            connected: false,
            error: `Error fetching server info: ${error instanceof Error ? error.message : String(error)}`,
          },
          environment: {},
        })
      }
    }

    collectSystemInfo()
    fetchServerInfo()

    // Update every 5 seconds
    const interval = setInterval(collectSystemInfo, 5000)

    return () => clearInterval(interval)
  }, [])

  // Helper function to get browser name
  const getBrowserName = () => {
    const userAgent = navigator.userAgent
    let browserName

    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = "Chrome"
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = "Firefox"
    } else if (userAgent.match(/safari/i)) {
      browserName = "Safari"
    } else if (userAgent.match(/opr\//i)) {
      browserName = "Opera"
    } else if (userAgent.match(/edg/i)) {
      browserName = "Edge"
    } else {
      browserName = "Unknown"
    }

    return browserName
  }

  // Helper function to get browser version
  const getBrowserVersion = () => {
    const userAgent = navigator.userAgent
    let version = "Unknown"

    // Extract version based on browser
    if (userAgent.match(/chrome|chromium|crios/i)) {
      version = userAgent.match(/chrome\/([0-9.]+)/i)?.[1] || version
    } else if (userAgent.match(/firefox|fxios/i)) {
      version = userAgent.match(/firefox\/([0-9.]+)/i)?.[1] || version
    } else if (userAgent.match(/safari/i)) {
      version = userAgent.match(/version\/([0-9.]+)/i)?.[1] || version
    } else if (userAgent.match(/opr\//i)) {
      version = userAgent.match(/opr\/([0-9.]+)/i)?.[1] || version
    } else if (userAgent.match(/edg/i)) {
      version = userAgent.match(/edg\/([0-9.]+)/i)?.[1] || version
    }

    return version
  }

  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Format milliseconds to human-readable format
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <Card className={`${className} overflow-hidden border-green-500/20 bg-black text-green-500`}>
      <CardHeader className="bg-black/50 border-b border-green-500/20">
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Cpu className="h-5 w-5" />
          System Information
        </CardTitle>
        <CardDescription className="text-green-500/70">
          Detailed information about the current system environment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="browser" className="w-full">
          <TabsList className="w-full bg-black border-b border-green-500/20 rounded-none grid grid-cols-4">
            <TabsTrigger
              value="browser"
              className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
            >
              <Globe className="h-4 w-4 mr-2" />
              Browser
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
            >
              <Cpu className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="runtime"
              className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
            >
              <Clock className="h-4 w-4 mr-2" />
              Runtime
            </TabsTrigger>
            <TabsTrigger
              value="server"
              className="data-[state=active]:bg-green-900/20 data-[state=active]:text-green-400"
            >
              <Server className="h-4 w-4 mr-2" />
              Server
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browser" className="p-4 space-y-4 font-mono text-sm">
            {systemInfo ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Browser:</span>
                    <span>
                      {systemInfo.browser.name} {systemInfo.browser.version}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Platform:</span>
                    <span>{systemInfo.browser.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Language:</span>
                    <span>{systemInfo.browser.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Screen:</span>
                    <span>{systemInfo.browser.screenSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Color Depth:</span>
                    <span>{systemInfo.browser.colorDepth} bits</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Timezone:</span>
                    <span>{systemInfo.browser.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Cookies:</span>
                    <span>{systemInfo.browser.cookiesEnabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Do Not Track:</span>
                    <span>{systemInfo.browser.doNotTrack || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-500/70">Online:</span>
                    <Badge
                      variant={systemInfo.browser.online ? "default" : "destructive"}
                      className="bg-green-900/20 text-green-400 hover:bg-green-900/30"
                    >
                      {systemInfo.browser.online ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-green-500/70 mb-1">User Agent:</div>
                  <div className="bg-green-900/10 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {systemInfo.browser.userAgent}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">Loading browser information...</div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="p-4 space-y-4 font-mono text-sm">
            {systemInfo?.performance ? (
              <div className="space-y-6">
                {systemInfo.performance.memory && (
                  <div>
                    <h3 className="text-green-400 mb-2 flex items-center">
                      <Memory className="h-4 w-4 mr-2" />
                      Memory Usage
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Heap Size Limit:</span>
                        <span>{formatBytes(systemInfo.performance.memory.jsHeapSizeLimit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Total Heap Size:</span>
                        <span>{formatBytes(systemInfo.performance.memory.totalJSHeapSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Used Heap Size:</span>
                        <span>{formatBytes(systemInfo.performance.memory.usedJSHeapSize)}</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-green-500/70 mb-1">Memory Usage:</div>
                        <div className="w-full bg-green-900/20 rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full"
                            style={{
                              width: `${(systemInfo.performance.memory.usedJSHeapSize / systemInfo.performance.memory.jsHeapSizeLimit) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs mt-1 text-right">
                          {(
                            (systemInfo.performance.memory.usedJSHeapSize /
                              systemInfo.performance.memory.jsHeapSizeLimit) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {systemInfo.performance.timing && (
                  <div>
                    <h3 className="text-green-400 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Page Timing
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Total Load Time:</span>
                        <span>
                          {formatTime(
                            systemInfo.performance.timing.loadEventEnd - systemInfo.performance.timing.navigationStart,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500/70">DOM Interactive:</span>
                        <span>
                          {formatTime(
                            systemInfo.performance.timing.domInteractive -
                              systemInfo.performance.timing.navigationStart,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500/70">DOM Complete:</span>
                        <span>
                          {formatTime(
                            systemInfo.performance.timing.domComplete - systemInfo.performance.timing.navigationStart,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Connection Time:</span>
                        <span>
                          {formatTime(
                            systemInfo.performance.timing.connectEnd - systemInfo.performance.timing.navigationStart,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {systemInfo.performance.resources && (
                  <div>
                    <h3 className="text-green-400 mb-2 flex items-center">
                      <HardDrive className="h-4 w-4 mr-2" />
                      Resources
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Resource Count:</span>
                        <span>{systemInfo.performance.resources.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Total Size:</span>
                        <span>{formatBytes(systemInfo.performance.resources.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Slowest Resource:</span>
                        <span>{formatTime(systemInfo.performance.resources.slowest.duration)}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <div className="text-green-500/70 mb-1">Slowest Resource URL:</div>
                        <div className="bg-green-900/10 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
                          {systemInfo.performance.resources.slowest.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">Loading performance information...</div>
            )}
          </TabsContent>

          <TabsContent value="runtime" className="p-4 space-y-4 font-mono text-sm">
            {systemInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-500/70">Next.js Build ID:</span>
                      <span>{systemInfo.runtime.nextVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-500/70">React Version:</span>
                      <span>{systemInfo.runtime.reactVersion}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-500/70">Node Environment:</span>
                      <Badge className="bg-green-900/20 text-green-400 hover:bg-green-900/30">
                        {systemInfo.runtime.nodeEnv}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-green-400 mb-2 flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Environment Variables (Public)
                  </h3>
                  <div className="bg-green-900/10 p-3 rounded text-xs font-mono overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-all">
                      {Object.entries(process.env)
                        .filter(([key]) => key.startsWith("NEXT_PUBLIC_"))
                        .map(([key, value]) => `${key}: ${value}`)
                        .join("\n") || "No public environment variables found"}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">Loading runtime information...</div>
            )}
          </TabsContent>

          <TabsContent value="server" className="p-4 space-y-4 font-mono text-sm">
            {serverInfo ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-green-400 mb-2 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Supabase Connection
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-500/70">Connection Status:</span>
                      <Badge
                        variant={serverInfo.supabase.connected ? "default" : "destructive"}
                        className={
                          serverInfo.supabase.connected
                            ? "bg-green-900/20 text-green-400 hover:bg-green-900/30"
                            : "bg-red-900/20 text-red-400 hover:bg-red-900/30"
                        }
                      >
                        {serverInfo.supabase.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>

                    {serverInfo.supabase.version && (
                      <div className="flex justify-between">
                        <span className="text-green-500/70">Supabase Version:</span>
                        <span>{serverInfo.supabase.version}</span>
                      </div>
                    )}

                    {serverInfo.supabase.error && (
                      <div className="mt-2">
                        <div className="text-red-400 mb-1">Error:</div>
                        <div className="bg-red-900/10 p-2 rounded text-xs overflow-x-auto text-red-300">
                          {serverInfo.supabase.error}
                        </div>
                      </div>
                    )}

                    {serverInfo.supabase.tables && serverInfo.supabase.tables.length > 0 && (
                      <div className="mt-2">
                        <div className="text-green-500/70 mb-1">Available Tables:</div>
                        <div className="bg-green-900/10 p-2 rounded text-xs grid grid-cols-2 gap-1">
                          {serverInfo.supabase.tables.map((table, index) => (
                            <div key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {table}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {serverInfo.environment && Object.keys(serverInfo.environment).length > 0 && (
                  <div>
                    <h3 className="text-green-400 mb-2 flex items-center">
                      <Server className="h-4 w-4 mr-2" />
                      Server Environment
                    </h3>
                    <div className="space-y-2">
                      {serverInfo.environment.nodeVersion && (
                        <div className="flex justify-between">
                          <span className="text-green-500/70">Node.js Version:</span>
                          <span>{serverInfo.environment.nodeVersion}</span>
                        </div>
                      )}

                      {serverInfo.environment.platform && (
                        <div className="flex justify-between">
                          <span className="text-green-500/70">Platform:</span>
                          <span>{serverInfo.environment.platform}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">Loading server information...</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
