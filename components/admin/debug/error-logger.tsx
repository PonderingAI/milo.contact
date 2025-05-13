"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Trash2, Filter, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ErrorLog {
  id: string
  timestamp: number
  message: string
  source?: string
  stack?: string
  type: "error" | "warning" | "info"
}

export default function ErrorLogger() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">("all")
  const [search, setSearch] = useState("")
  const [copying, setCopying] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Set up error listener
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleInfo = console.info

    console.error = (...args) => {
      const errorMessage = args.join(" ")
      const errorObj = args.find((arg) => arg instanceof Error)

      addErrorLog({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        message: errorMessage,
        stack: errorObj?.stack,
        source: new Error().stack?.split("\n")[2]?.trim() || "unknown",
        type: "error",
      })

      originalConsoleError.apply(console, args)
    }

    console.warn = (...args) => {
      const warnMessage = args.join(" ")

      addErrorLog({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        message: warnMessage,
        source: new Error().stack?.split("\n")[2]?.trim() || "unknown",
        type: "warning",
      })

      originalConsoleWarn.apply(console, args)
    }

    console.info = (...args) => {
      const infoMessage = args.join(" ")

      addErrorLog({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        message: infoMessage,
        source: new Error().stack?.split("\n")[2]?.trim() || "unknown",
        type: "info",
      })

      originalConsoleInfo.apply(console, args)
    }

    // Also listen for unhandled errors
    const handleWindowError = (event: ErrorEvent) => {
      addErrorLog({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        message: event.message,
        stack: event.error?.stack,
        source: event.filename + ":" + event.lineno + ":" + event.colno,
        type: "error",
      })
    }

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      addErrorLog({
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        source: "Promise Rejection",
        type: "error",
      })
    }

    window.addEventListener("error", handleWindowError)
    window.addEventListener("unhandledrejection", handlePromiseRejection)

    // Load any existing logs from localStorage
    const savedLogs = localStorage.getItem("errorLogs")
    if (savedLogs) {
      try {
        setErrorLogs(JSON.parse(savedLogs))
      } catch (e) {
        // If parsing fails, just start with empty logs
        localStorage.removeItem("errorLogs")
      }
    }

    return () => {
      // Restore original functions
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.info = originalConsoleInfo
      window.removeEventListener("error", handleWindowError)
      window.removeEventListener("unhandledrejection", handlePromiseRejection)
    }
  }, [])

  // Save logs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("errorLogs", JSON.stringify(errorLogs))
  }, [errorLogs])

  const addErrorLog = (log: ErrorLog) => {
    setErrorLogs((prev) => {
      // Keep only the last 100 logs
      const newLogs = [log, ...prev]
      if (newLogs.length > 100) {
        return newLogs.slice(0, 100)
      }
      return newLogs
    })
  }

  const clearLogs = () => {
    setErrorLogs([])
    toast({
      title: "Logs cleared",
      description: "All error logs have been cleared",
    })
  }

  const copyToClipboard = async (id: string, content: string) => {
    setCopying((prev) => ({ ...prev, [id]: true }))

    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Copied to clipboard",
        description: "Log content copied successfully",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    } finally {
      // Reset the copying state after a short delay for UI feedback
      setTimeout(() => {
        setCopying((prev) => ({ ...prev, [id]: false }))
      }, 1000)
    }
  }

  const filteredLogs = errorLogs.filter((log) => {
    // Apply type filter
    if (filter !== "all" && log.type !== filter) {
      return false
    }

    // Apply search filter
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-bold text-green-400">Error Logger</h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              // Generate a test error
              try {
                throw new Error("Test error from debug console")
              } catch (e) {
                console.error(e)
              }
              console.warn("Test warning from debug console")
              console.info("Test info from debug console")
            }}
            variant="outline"
            size="sm"
            className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/20"
          >
            Generate Test Errors
          </Button>
          <Button
            onClick={clearLogs}
            variant="outline"
            size="sm"
            className="border-red-700 text-red-400 hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search error messages..."
            className="bg-black border-green-700 text-green-400"
          />
        </div>
        <div className="w-40">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="bg-black border-green-700 text-green-400">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-black border-green-700 text-green-400">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Logs */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card className="bg-black border-green-700">
            <CardContent className="p-4 text-center text-gray-500">
              No logs to display. Errors, warnings, and info messages will appear here.
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card
              key={log.id}
              className={`bg-black border-l-4 ${
                log.type === "error"
                  ? "border-l-red-600"
                  : log.type === "warning"
                    ? "border-l-yellow-600"
                    : "border-l-blue-600"
              } border-t-green-700 border-r-green-700 border-b-green-700`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          log.type === "error"
                            ? "bg-red-900/30 text-red-400"
                            : log.type === "warning"
                              ? "bg-yellow-900/30 text-yellow-400"
                              : "bg-blue-900/30 text-blue-400"
                        }`}
                      >
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-green-300 font-mono text-sm mb-2">{log.message}</p>
                    {log.source && <p className="text-gray-500 text-xs mb-2">Source: {log.source}</p>}
                    {log.stack && (
                      <pre className="bg-black/50 p-2 rounded text-xs text-gray-400 font-mono overflow-x-auto mt-2">
                        {log.stack}
                      </pre>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-green-400"
                    onClick={() =>
                      copyToClipboard(log.id, `${log.type.toUpperCase()}: ${log.message}\n${log.stack || ""}`)
                    }
                  >
                    {copying[log.id] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
