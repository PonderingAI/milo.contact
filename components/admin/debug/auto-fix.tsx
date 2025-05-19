"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Check, RefreshCw, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface FixStatus {
  name: string
  status: "pending" | "running" | "success" | "error" | "skipped"
  message?: string
  error?: string
}

export default function AutoFix() {
  const [isRunning, setIsRunning] = useState(false)
  const [fixes, setFixes] = useState<FixStatus[]>([
    { name: "Check Database Connection", status: "pending" },
    { name: "Setup RPC Functions", status: "pending" },
    { name: "Setup exec_sql Function", status: "pending" },
    { name: "Setup list_tables Function", status: "pending" },
    { name: "Check Tables", status: "pending" },
    { name: "Check Favicons", status: "pending" },
    { name: "Check Analytics", status: "pending" },
  ])

  const runFixes = async () => {
    setIsRunning(true)

    // Reset all fixes to pending
    setFixes((prev) => prev.map((fix) => ({ ...fix, status: "pending", message: undefined, error: undefined })))

    // Run each fix in sequence
    await runDatabaseConnectionCheck()
    await runSetupRpcFunctions()
    await runSetupExecSql()
    await runSetupListTables()
    await runCheckTables()
    await runCheckFavicons()
    await runCheckAnalytics()

    setIsRunning(false)
    toast({
      title: "Auto-fix complete",
      description: "All diagnostic checks and fixes have been completed.",
    })
  }

  const updateFixStatus = (name: string, status: FixStatus["status"], message?: string, error?: string) => {
    setFixes((prev) => prev.map((fix) => (fix.name === name ? { ...fix, status, message, error } : fix)))
  }

  const runDatabaseConnectionCheck = async () => {
    const fixName = "Check Database Connection"
    updateFixStatus(fixName, "running")

    try {
      const response = await fetch("/api/test-supabase-connection")
      const data = await response.json()

      if (data.success) {
        updateFixStatus(fixName, "success", "Database connection is working")
      } else {
        updateFixStatus(fixName, "error", "Database connection failed", data.error || "Unknown error")
      }
    } catch (error) {
      updateFixStatus(
        fixName,
        "error",
        "Failed to check database connection",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  const runSetupRpcFunctions = async () => {
    const fixName = "Setup RPC Functions"
    updateFixStatus(fixName, "running")

    try {
      const response = await fetch("/api/setup-rpc-functions")
      const data = await response.json()

      if (data.success) {
        updateFixStatus(fixName, "success", "RPC functions set up successfully")
      } else {
        updateFixStatus(fixName, "error", "Failed to set up RPC functions", data.error || "Unknown error")
      }
    } catch (error) {
      updateFixStatus(
        fixName,
        "error",
        "Failed to set up RPC functions",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  const runSetupExecSql = async () => {
    const fixName = "Setup exec_sql Function"
    updateFixStatus(fixName, "running")

    try {
      const response = await fetch("/api/debug/setup-exec-sql")
      const data = await response.json()

      if (data.success) {
        updateFixStatus(fixName, "success", "exec_sql function set up successfully")
      } else {
        updateFixStatus(fixName, "error", "Failed to set up exec_sql function", data.error || "Unknown error")
      }
    } catch (error) {
      updateFixStatus(
        fixName,
        "error",
        "Failed to set up exec_sql function",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  const runSetupListTables = async () => {
    const fixName = "Setup list_tables Function"
    updateFixStatus(fixName, "running")

    try {
      const response = await fetch("/api/debug/setup-list-tables")
      const data = await response.json()

      if (data.success) {
        updateFixStatus(fixName, "success", "list_tables function set up successfully")
      } else {
        updateFixStatus(fixName, "error", "Failed to set up list_tables function", data.error || "Unknown error")
      }
    } catch (error) {
      updateFixStatus(
        fixName,
        "error",
        "Failed to set up list_tables function",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  const runCheckTables = async () => {
    const fixName = "Check Tables"
    updateFixStatus(fixName, "running")

    try {
      const response = await fetch("/api/list-all-tables")
      const data = await response.json()

      if (data.success) {
        updateFixStatus(fixName, "success", `Found ${data.count} tables: ${data.tables.join(", ")}`)
      } else {
        updateFixStatus(fixName, "error", "Failed to list tables", data.error || "Unknown error")
      }
    } catch (error) {
      updateFixStatus(
        fixName,
        "error",
        "Failed to check tables",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  const runCheckFavicons = async () => {
    const fixName = "Check Favicons"
    updateFixStatus(fixName, "running")

    try {
      const response = await fetch("/api/debug/check-favicons")
      const data = await response.json()

      const missingFavicons = Object.entries(data.favicons)
        .filter(([_, status]: [string, any]) => !status.exists)
        .map(([path]: [string, any]) => path)

      if (missingFavicons.length === 0) {
        updateFixStatus(fixName, "success", "All favicons are available")
      } else {
        updateFixStatus(fixName, "error", `Missing favicons: ${missingFavicons.join(", ")}`, data.solution)
      }
    } catch (error) {
      updateFixStatus(
        fixName,
        "error",
        "Failed to check favicons",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  const runCheckAnalytics = async () => {
    const fixName = "Check Analytics"
    updateFixStatus(fixName, "running")

    try {
      const response = await fetch("/api/debug/check-analytics")
      const data = await response.json()

      if (data.success) {
        updateFixStatus(fixName, "success", "Vercel Web Analytics script is available")
      } else {
        updateFixStatus(
          fixName,
          "error",
          "Vercel Web Analytics script is not available",
          data.solution || "Unknown error",
        )
      }
    } catch (error) {
      updateFixStatus(
        fixName,
        "error",
        "Failed to check analytics",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  return (
    <Card className="bg-black border-green-700">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-mono flex items-center justify-between">
          <span>Auto-Fix Diagnostics</span>
          <Button
            onClick={runFixes}
            disabled={isRunning}
            variant="outline"
            size="sm"
            className="h-8 border-green-700 text-green-400 hover:bg-green-900/20"
          >
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              "Run All Fixes"
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {fixes.map((fix) => (
            <div
              key={fix.name}
              className={`p-2 rounded-md border ${
                fix.status === "pending"
                  ? "border-gray-700 bg-gray-900/20"
                  : fix.status === "running"
                    ? "border-blue-700 bg-blue-900/20"
                    : fix.status === "success"
                      ? "border-green-700 bg-green-900/20"
                      : fix.status === "error"
                        ? "border-red-700 bg-red-900/20"
                        : "border-yellow-700 bg-yellow-900/20"
              }`}
            >
              <div className="flex items-center">
                {fix.status === "pending" && <div className="w-4 h-4 mr-2" />}
                {fix.status === "running" && <RefreshCw className="w-4 h-4 mr-2 text-blue-500 animate-spin" />}
                {fix.status === "success" && <Check className="w-4 h-4 mr-2 text-green-500" />}
                {fix.status === "error" && <X className="w-4 h-4 mr-2 text-red-500" />}
                {fix.status === "skipped" && <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />}
                <span className="text-xs font-mono">{fix.name}</span>
              </div>
              {fix.message && <div className="text-xs mt-1 ml-6 font-mono text-gray-400">{fix.message}</div>}
              {fix.error && <div className="text-xs mt-1 ml-6 font-mono text-red-400">{fix.error}</div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
