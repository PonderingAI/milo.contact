"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Check, Database, RefreshCw, Shield, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DependencyCompatibilitySetupGuide } from "./dependency-compatibility-setup-guide"

interface TableStatus {
  dependencies: boolean
  dependency_settings: boolean
  security_audits: boolean
  dependency_compatibility: boolean
}

export function DependencySystemSetupGuide() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tableStatus, setTableStatus] = useState<TableStatus>({
    dependencies: false,
    dependency_settings: false,
    security_audits: false,
    dependency_compatibility: false,
  })
  const [checking, setChecking] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Function to check if tables exist
  const checkTables = async () => {
    setChecking(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies/check-tables")
      const data = await response.json()

      if (response.ok) {
        setTableStatus(data.tables)
      } else {
        throw new Error(data.error || "Failed to check tables")
      }
    } catch (error) {
      console.error("Error checking tables:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setChecking(false)
    }
  }

  // Function to set up all tables
  const setupTables = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies/setup", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        await checkTables() // Refresh table status
      } else {
        throw new Error(data.error || "Failed to set up tables")
      }
    } catch (error) {
      console.error("Error setting up tables:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Check tables on component mount
  useEffect(() => {
    checkTables()
  }, [])

  // Check if all tables are set up
  const allTablesSetUp = Object.values(tableStatus).every((status) => status === true)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Dependency Management System
        </CardTitle>
        <CardDescription>
          Set up the dependency management system to track and update project dependencies
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
        </TabsList>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertDescription>Dependency management system set up successfully!</AlertDescription>
            </Alert>
          )}

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="font-medium mb-2">Dependency Management System</h3>
              <p className="text-sm text-gray-600 mb-4">
                This system helps you track, manage, and update your project dependencies automatically. It provides
                security monitoring, compatibility tracking, and automatic updates.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-3 bg-white rounded-md border">
                  <Shield className="h-8 w-8 text-amber-500 mb-2" />
                  <h4 className="font-medium text-center">Security Monitoring</h4>
                  <p className="text-xs text-center text-gray-500">
                    Tracks vulnerabilities and security issues in dependencies
                  </p>
                </div>

                <div className="flex flex-col items-center p-3 bg-white rounded-md border">
                  <Settings className="h-8 w-8 text-blue-500 mb-2" />
                  <h4 className="font-medium text-center">Automatic Updates</h4>
                  <p className="text-xs text-center text-gray-500">
                    Safely updates dependencies based on compatibility data
                  </p>
                </div>

                <div className="flex flex-col items-center p-3 bg-white rounded-md border">
                  <Database className="h-8 w-8 text-green-500 mb-2" />
                  <h4 className="font-medium text-center">Compatibility Tracking</h4>
                  <p className="text-xs text-center text-gray-500">
                    Maintains a database of compatible package versions
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">System Status</h3>
                <p className="text-sm text-gray-500">
                  {allTablesSetUp
                    ? "All components are installed and ready to use"
                    : "Some components need to be installed"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {allTablesSetUp && <Check className="h-4 w-4 text-green-500" />}
                {!allTablesSetUp && <AlertCircle className="h-4 w-4 text-amber-500" />}
                <span className="text-sm">{allTablesSetUp ? "Ready" : "Setup Required"}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Dependencies Table</h3>
                  <p className="text-sm text-gray-500">Stores information about project dependencies</p>
                </div>
                <div className="flex items-center gap-2">
                  {tableStatus.dependencies && <Check className="h-4 w-4 text-green-500" />}
                  {!tableStatus.dependencies && <AlertCircle className="h-4 w-4 text-amber-500" />}
                  <span className="text-sm">{tableStatus.dependencies ? "Installed" : "Not Installed"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Dependency Settings Table</h3>
                  <p className="text-sm text-gray-500">Stores settings for dependency management</p>
                </div>
                <div className="flex items-center gap-2">
                  {tableStatus.dependency_settings && <Check className="h-4 w-4 text-green-500" />}
                  {!tableStatus.dependency_settings && <AlertCircle className="h-4 w-4 text-amber-500" />}
                  <span className="text-sm">{tableStatus.dependency_settings ? "Installed" : "Not Installed"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Security Audits Table</h3>
                  <p className="text-sm text-gray-500">Stores security audit results</p>
                </div>
                <div className="flex items-center gap-2">
                  {tableStatus.security_audits && <Check className="h-4 w-4 text-green-500" />}
                  {!tableStatus.security_audits && <AlertCircle className="h-4 w-4 text-amber-500" />}
                  <span className="text-sm">{tableStatus.security_audits ? "Installed" : "Not Installed"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Dependency Compatibility Table</h3>
                  <p className="text-sm text-gray-500">Stores compatibility information for dependencies</p>
                </div>
                <div className="flex items-center gap-2">
                  {tableStatus.dependency_compatibility && <Check className="h-4 w-4 text-green-500" />}
                  {!tableStatus.dependency_compatibility && <AlertCircle className="h-4 w-4 text-amber-500" />}
                  <span className="text-sm">
                    {tableStatus.dependency_compatibility ? "Installed" : "Not Installed"}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compatibility" className="mt-0">
            <DependencyCompatibilitySetupGuide />
          </TabsContent>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={checkTables} disabled={checking}>
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Check Status
          </Button>

          {!allTablesSetUp && (
            <Button onClick={setupTables} disabled={loading}>
              {loading ? "Setting Up..." : "Set Up All Tables"}
            </Button>
          )}

          {allTablesSetUp && (
            <Button variant="outline" disabled>
              <Check className="h-4 w-4 mr-2" />
              All Tables Installed
            </Button>
          )}
        </CardFooter>
      </Tabs>
    </Card>
  )
}
