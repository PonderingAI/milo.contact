"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Server, Cpu, MemoryStickIcon as Memory, HardDrive, RefreshCw } from "lucide-react"

export default function SystemDebugPage() {
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchSystemInfo = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll just simulate some data
      setTimeout(() => {
        setSystemInfo({
          environment: process.env.NODE_ENV || "development",
          runtime: "Next.js",
          version: "Simulated data - would come from server",
          platform: "Vercel",
          region: "Simulated data - would come from server",
          memory: "Simulated data - would come from server",
          uptime: "Simulated data - would come from server",
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching system info:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="h-6 w-6" />
          <h1 className="text-2xl font-bold">System Information</h1>
        </div>
        <Button onClick={fetchSystemInfo} disabled={loading} variant="outline" size="sm">
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-20 bg-gray-700 rounded"></div>
            ) : systemInfo ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Node Environment:</span>
                  <span>{systemInfo.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Runtime:</span>
                  <span>{systemInfo.runtime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version:</span>
                  <span>{systemInfo.version}</span>
                </div>
              </div>
            ) : (
              <p>Failed to load system information</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-20 bg-gray-700 rounded"></div>
            ) : systemInfo ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform:</span>
                  <span>{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Region:</span>
                  <span>{systemInfo.region}</span>
                </div>
              </div>
            ) : (
              <p>Failed to load platform information</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Memory className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-20 bg-gray-700 rounded"></div>
            ) : systemInfo ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory:</span>
                  <span>{systemInfo.memory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime:</span>
                  <span>{systemInfo.uptime}</span>
                </div>
              </div>
            ) : (
              <p>Failed to load resource information</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-gray-400 mt-6">
        Note: This is a placeholder page. In a production environment, this would display actual system information from
        the server.
      </p>
    </div>
  )
}
