"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LogsDebugPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [logLevel, setLogLevel] = useState("all")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll just simulate some data
      setTimeout(() => {
        setLogs([
          {
            id: 1,
            level: "error",
            message: "Failed to connect to database",
            timestamp: "2025-05-12T10:15:30Z",
            source: "api/database",
          },
          {
            id: 2,
            level: "warn",
            message: "Slow query detected",
            timestamp: "2025-05-12T09:45:22Z",
            source: "api/projects",
          },
          { id: 3, level: "info", message: "User logged in", timestamp: "2025-05-12T09:30:15Z", source: "auth/login" },
          {
            id: 4,
            level: "error",
            message: "Image upload failed",
            timestamp: "2025-05-12T08:20:10Z",
            source: "api/media",
          },
          {
            id: 5,
            level: "info",
            message: "Project created",
            timestamp: "2025-05-12T08:10:05Z",
            source: "api/projects",
          },
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching logs:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = logLevel === "all" || log.level === logLevel
    return matchesSearch && matchesLevel
  })

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-500"
      case "warn":
        return "text-yellow-500"
      case "info":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Error Logs</h1>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm">
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

      <Card>
        <CardHeader>
          <CardTitle>Application Logs</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search logs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={logLevel} onValueChange={setLogLevel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border border-gray-700 rounded-md p-4">
                  <div className="flex justify-between mb-2">
                    <span className={`font-medium ${getLevelColor(log.level)}`}>{log.level.toUpperCase()}</span>
                    <span className="text-gray-400 text-sm">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mb-2">{log.message}</p>
                  <p className="text-sm text-gray-400">Source: {log.source}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-400">No logs found matching your criteria</p>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-gray-400 mt-6">
        Note: This is a placeholder page. In a production environment, this would display actual application logs from
        the server.
      </p>
    </div>
  )
}
