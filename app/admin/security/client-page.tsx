"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FourStateToggle, type ToggleState } from "@/components/ui/four-state-toggle"
import { DraggableWidget } from "@/components/admin/draggable-widget"
import { WidgetSelector, type WidgetOption } from "@/components/admin/widget-selector"
import {
  AlertCircle,
  CheckCircle,
  Package,
  Shield,
  RefreshCw,
  AlertTriangle,
  Settings,
  Info,
  Activity,
  Search,
  Clock,
} from "lucide-react"
import { VulnerabilityDetails } from "@/components/admin/vulnerability-details"
import { DependencySystemSetupGuide } from "@/components/admin/dependency-system-setup-guide"

// Types
interface Dependency {
  id: string
  name: string
  currentVersion: string
  latestVersion: string
  outdated: boolean
  locked: boolean
  description: string
  hasSecurityIssue: boolean
  securityDetails?: any
  updateMode: ToggleState
  isDev?: boolean
}

interface SecurityStats {
  vulnerabilities: number
  outdatedPackages: number
  securityScore: number
  lastScan: string
}

interface Widget {
  id: string
  type: string
  visible: boolean
  order: number
}

// Available widgets
const availableWidgets: WidgetOption[] = [
  {
    id: "security-score",
    title: "Security Score",
    description: "Overall security rating of your application",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: "vulnerabilities",
    title: "Vulnerabilities",
    description: "Known security issues in your dependencies",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    id: "outdated-packages",
    title: "Outdated Packages",
    description: "Dependencies that need updates",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "update-settings",
    title: "Update Settings",
    description: "Configure automatic update behavior",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    id: "recent-activity",
    title: "Recent Activity",
    description: "Latest security events and actions",
    icon: <Activity className="h-4 w-4" />,
  },
  {
    id: "security-audit",
    title: "Security Audit",
    description: "Run a security scan of your application",
    icon: <Search className="h-4 w-4" />,
  },
  {
    id: "update-history",
    title: "Update History",
    description: "Recent package updates",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "security-recommendations",
    title: "Security Recommendations",
    description: "Suggested actions to improve security",
    icon: <AlertCircle className="h-4 w-4" />,
  },
]

export default function SecurityClientPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupMessage, setSetupMessage] = useState<string | null>(null)
  const [globalUpdateMode, setGlobalUpdateMode] = useState<ToggleState>("conservative")
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [availableWidgetsForAdd, setAvailableWidgetsForAdd] = useState<WidgetOption[]>([])
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    vulnerabilities: 0,
    outdatedPackages: 0,
    securityScore: 100,
    lastScan: new Date().toLocaleDateString(),
  })
  const [auditRunning, setAuditRunning] = useState(false)
  const [applyingChanges, setApplyingChanges] = useState(false)
  const [selectedVulnerability, setSelectedVulnerability] = useState<{
    vulnerability: any
    packageName: string
    currentVersion: string
    latestVersion: string
  } | null>(null)
  const [updateResults, setUpdateResults] = useState<any[]>([])
  const [showUpdateResults, setShowUpdateResults] = useState(false)
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [setupAttempted, setSetupAttempted] = useState(false)

  // Load widgets from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidgets = localStorage.getItem("securityWidgets")
      if (savedWidgets) {
        setWidgets(JSON.parse(savedWidgets))
      } else {
        // Default widgets
        const defaultWidgets: Widget[] = [
          { id: "security-score", type: "security-score", visible: true, order: 0 },
          { id: "vulnerabilities", type: "vulnerabilities", visible: true, order: 1 },
          { id: "outdated-packages", type: "outdated-packages", visible: true, order: 2 },
          { id: "update-settings", type: "update-settings", visible: true, order: 3 },
          { id: "security-recommendations", type: "security-recommendations", visible: true, order: 4 },
          { id: "recent-activity", type: "recent-activity", visible: true, order: 5 },
        ]
        setWidgets(defaultWidgets)
        localStorage.setItem("securityWidgets", JSON.stringify(defaultWidgets))
      }
    }
  }, [])

  // Update available widgets for adding
  useEffect(() => {
    const currentWidgetTypes = widgets.map((w) => w.type)
    const filtered = availableWidgets.filter((w) => !currentWidgetTypes.includes(w.id))
    setAvailableWidgetsForAdd(filtered)
  }, [widgets])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin/security")
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isSignedIn) {
      fetchDependencies()
    }
  }, [isSignedIn])

  // Set up hourly check for updates
  useEffect(() => {
    // Initial check
    checkForUpdates()

    // Set up interval for hourly checks
    const intervalId = setInterval(checkForUpdates, 60 * 60 * 1000) // 1 hour in milliseconds

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const checkForUpdates = async () => {
    try {
      const response = await fetch("/api/dependencies/scheduled-update")

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Scheduled update check failed:", errorData.error || (await response.text()))
        return
      }

      const data = await response.json()

      // If any dependencies were updated, refresh the list
      if (data.updated > 0) {
        fetchDependencies()
      }
    } catch (error) {
      console.error("Error checking for updates:", error)
    }
  }

  const setupDependencySystem = async () => {
    try {
      setSetupAttempted(true)
      setLoading(true)
      setError(null)
      setSetupMessage("Setting up dependency management system...")

      const response = await fetch("/api/dependencies/setup", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to set up dependency system")
      }

      const data = await response.json()
      setSetupMessage(data.message || "Dependency system set up successfully. Scanning dependencies...")

      // After setup, scan for dependencies
      await scanDependencies()
    } catch (err: any) {
      setError(`Error setting up dependency system: ${err.message}`)
      console.error("Error setting up dependency system:", err)
    } finally {
      setLoading(false)
    }
  }

  const scanDependencies = async () => {
    try {
      setLoading(true)
      setError(null)
      setSetupMessage("Scanning dependencies...")

      const response = await fetch("/api/dependencies/scan", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to scan dependencies")
      }

      // Refresh dependencies after scan
      await fetchDependencies()
      setSetupMessage("Dependency scan completed successfully.")

      // Clear setup message after a delay
      setTimeout(() => {
        setSetupMessage(null)
      }, 3000)
    } catch (err: any) {
      setError(`Error scanning dependencies: ${err.message}`)
      console.error("Error scanning dependencies:", err)
    } finally {
      setLoading(false)
    }
  }

  const applyChanges = async () => {
    try {
      setApplyingChanges(true)
      setError(null)
      setShowUpdateResults(false)

      // Call the API to apply changes
      const response = await fetch("/api/dependencies/apply", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to apply changes")
      }

      const data = await response.json()

      // Store the results
      setUpdateResults(data.results || [])
      setShowUpdateResults(true)

      // Refresh dependencies
      fetchDependencies()
    } catch (err: any) {
      setError(`Error applying changes: ${err.message}`)
      console.error("Error applying changes:", err)
    } finally {
      setApplyingChanges(false)
    }
  }

  const fetchDependencies = async () => {
    try {
      setLoading(true)
      setError(null)
      setDiagnosticInfo(null)

      const response = await fetch("/api/dependencies")
      const data = await response.json()

      // Store the full response for diagnostics
      setDiagnosticInfo(data)

      // Check for setup needed
      if (data.setupNeeded) {
        setSetupMessage(data.setupMessage || "The dependency system needs to be set up.")
        setDependencies([])
        return
      }

      // Check for error
      if (data.error) {
        setError(`Error: ${data.message || data.error}`)
        setDependencies([])
        return
      }

      // If no dependencies found, show a clear message
      if (!data.dependencies || data.dependencies.length === 0) {
        setDependencies([])
        setError("No dependencies found. Please run a dependency scan to populate the database.")
        return
      }

      // Map the data to our internal format
      const mappedDependencies = data.dependencies.map((dep) => ({
        id: dep.id || dep.name,
        name: dep.name,
        currentVersion: dep.current_version || dep.currentVersion,
        latestVersion: dep.latest_version || dep.latestVersion,
        outdated: dep.outdated || (dep.current_version !== dep.latest_version && dep.latest_version),
        locked: dep.locked || false,
        description: dep.description || "",
        hasSecurityIssue: dep.has_security_issue || dep.hasSecurityIssue || false,
        securityDetails: dep.security_details || dep.securityDetails,
        updateMode: dep.update_mode || dep.updateMode || "global",
        isDev: dep.is_dev || dep.isDev || false,
      }))

      setDependencies(mappedDependencies)

      // Update security stats
      setSecurityStats({
        vulnerabilities: data.vulnerabilities || mappedDependencies.filter((d) => d.hasSecurityIssue).length,
        outdatedPackages: data.outdatedPackages || mappedDependencies.filter((d) => d.outdated).length,
        securityScore: data.securityScore || calculateSecurityScore(mappedDependencies),
        lastScan: data.lastScan || new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
      })

      // Get global update mode - default to conservative (security only)
      setGlobalUpdateMode(data.updateMode || "conservative")
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError(`Error fetching dependencies: ${err instanceof Error ? err.message : String(err)}`)
      setDependencies([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate a security score based on vulnerabilities
  const calculateSecurityScore = (deps: Dependency[]) => {
    const totalDeps = deps.length
    if (totalDeps === 0) return 100

    const vulnerableDeps = deps.filter((d) => d.hasSecurityIssue).length
    const outdatedDeps = deps.filter((d) => d.outdated).length

    // Calculate score: start with 100 and deduct points
    let score = 100

    // Deduct more for vulnerable dependencies
    score -= (vulnerableDeps / totalDeps) * 50

    // Deduct less for outdated dependencies
    score -= (outdatedDeps / totalDeps) * 20

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  const updateGlobalMode = async (value: ToggleState) => {
    try {
      // Don't allow setting global mode to "global" (that would be recursive)
      if (value === "global") return

      setGlobalUpdateMode(value)
      const response = await fetch("/api/dependencies/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updateMode: value }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to update settings")
      }
    } catch (err: any) {
      setError(`Error updating settings: ${err.message}`)
      console.error("Error updating settings:", err)
    }
  }

  const updateDependencyMode = async (id: string, value: ToggleState) => {
    try {
      // Update local state
      setDependencies((prev) => prev.map((dep) => (dep.id === id ? { ...dep, updateMode: value } : dep)))

      // Send to API
      const response = await fetch("/api/dependencies/update-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, updateMode: value }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to update dependency mode")
      }
    } catch (err: any) {
      setError(`Error updating dependency mode: ${err.message}`)
      console.error("Error updating dependency mode:", err)
      // Revert on error
      fetchDependencies()
    }
  }

  const resetAllSettings = async () => {
    try {
      // Update local state
      setDependencies((prev) => prev.map((dep) => ({ ...dep, updateMode: "global" })))

      // Send to API
      const response = await fetch("/api/dependencies/reset-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updateMode: "global" }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to reset settings")
      }
    } catch (err: any) {
      setError(`Error resetting settings: ${err.message}`)
      console.error("Error resetting settings:", err)
      // Revert on error
      fetchDependencies()
    }
  }

  const runSecurityAudit = async () => {
    try {
      setAuditRunning(true)
      setError(null)

      // Call the actual audit API
      const response = await fetch("/api/dependencies/audit", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to run security audit")
      }

      const data = await response.json()

      // Update security stats with new data
      setSecurityStats({
        vulnerabilities: data.vulnerabilities || 0,
        outdatedPackages: data.outdatedPackages || dependencies.filter((d) => d.outdated).length,
        securityScore: data.securityScore || 100,
        lastScan: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
      })

      // Refresh dependencies to get updated vulnerability info
      fetchDependencies()
    } catch (err: any) {
      setError(`Error running security audit: ${err.message}`)
      console.error("Error running security audit:", err)
    } finally {
      setAuditRunning(false)
    }
  }

  // Widget management functions
  const handleAddWidget = (widgetId: string) => {
    const newWidget: Widget = {
      id: `${widgetId}-${Date.now()}`,
      type: widgetId,
      visible: true,
      order: widgets.length,
    }

    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    localStorage.setItem("securityWidgets", JSON.stringify(updatedWidgets))
  }

  const handleRemoveWidget = (id: string) => {
    const updatedWidgets = widgets.filter((w) => w.id !== id)
    setWidgets(updatedWidgets)
    localStorage.setItem("securityWidgets", JSON.stringify(updatedWidgets))
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("widgetId", id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData("widgetId")

    if (draggedId === targetId) return

    const updatedWidgets = [...widgets]
    const draggedIndex = updatedWidgets.findIndex((w) => w.id === draggedId)
    const targetIndex = updatedWidgets.findIndex((w) => w.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder
    const [draggedWidget] = updatedWidgets.splice(draggedIndex, 1)
    updatedWidgets.splice(targetIndex, 0, draggedWidget)

    // Update order property
    const reorderedWidgets = updatedWidgets.map((w, i) => ({ ...w, order: i }))

    setWidgets(reorderedWidgets)
    localStorage.setItem("securityWidgets", JSON.stringify(reorderedWidgets))
  }

  const viewVulnerabilityDetails = (dependency: Dependency) => {
    if (dependency.hasSecurityIssue && dependency.securityDetails) {
      setSelectedVulnerability({
        vulnerability: dependency.securityDetails,
        packageName: dependency.name,
        currentVersion: dependency.currentVersion,
        latestVersion: dependency.latestVersion,
      })
    }
  }

  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "outdated") return dep.outdated
      if (filter === "locked") return dep.locked
      if (filter === "security") return dep.hasSecurityIssue
      if (filter === "dev") return dep.isDev
      return true
    })
    .filter(
      (dep) =>
        dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  // Get severity badge for a dependency
  const getSeverityBadge = (dependency: Dependency) => {
    if (!dependency.hasSecurityIssue || !dependency.securityDetails) {
      return null
    }

    const severity = dependency.securityDetails.severity?.toLowerCase()

    switch (severity) {
      case "critical":
        return <Badge className="bg-red-900/20 text-red-400 border-red-800">Critical</Badge>
      case "high":
        return <Badge className="bg-orange-900/20 text-orange-400 border-orange-800">High</Badge>
      case "moderate":
      case "medium":
        return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-800">Medium</Badge>
      case "low":
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">Low</Badge>
      default:
        return <Badge className="bg-red-900/20 text-red-400 border-red-800">Security Issue</Badge>
    }
  }

  // Render widget content based on type
  const renderWidgetContent = (type: string) => {
    switch (type) {
      case "security-score":
        return (
          <div>
            <div className="text-3xl font-bold">{securityStats.securityScore}%</div>
            <div className="mt-2">
              <Progress value={securityStats.securityScore} className="h-2" />
            </div>
            <p className="text-sm text-gray-400 mt-2">Last scan: {securityStats.lastScan}</p>
          </div>
        )

      case "vulnerabilities":
        return (
          <div>
            <div className="flex items-center">
              <div className="text-3xl font-bold">{securityStats.vulnerabilities}</div>
              <Badge
                variant="outline"
                className={`ml-2 ${securityStats.vulnerabilities > 0 ? "bg-red-900/20 text-red-400 border-red-800" : "bg-green-900/20 text-green-400 border-green-800"}`}
              >
                {securityStats.vulnerabilities > 0 ? "Action needed" : "All clear"}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-2">Detected security issues</p>
            {securityStats.vulnerabilities > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setActiveTab("dependencies")
                  setFilter("security")
                }}
              >
                View Issues
              </Button>
            )}
          </div>
        )

      case "outdated-packages":
        return (
          <div>
            <div className="text-3xl font-bold">{securityStats.outdatedPackages}</div>
            <p className="text-sm text-gray-400 mt-2">Packages need updates</p>
            {securityStats.outdatedPackages > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setActiveTab("dependencies")
                  setFilter("outdated")
                }}
              >
                View Outdated
              </Button>
            )}
          </div>
        )

      case "update-settings":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Global Update Mode</Label>
              <FourStateToggle
                value={globalUpdateMode}
                onValueChange={updateGlobalMode}
                labels={{
                  off: "Off",
                  conservative: "Security Only",
                  aggressive: "All Updates",
                  global: "N/A",
                }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-2">
              <p>
                <strong>Off:</strong> No automatic updates
              </p>
              <p>
                <strong>Security Only:</strong> Only security patches
              </p>
              <p>
                <strong>All Updates:</strong> All package updates
              </p>
            </div>
          </div>
        )

      case "recent-activity":
        return (
          <div className="space-y-3">
            {updateResults.length > 0 ? (
              updateResults.slice(0, 3).map((result, index) => (
                <div key={index} className="flex items-start">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {result.name} {result.success ? `updated to ${result.to}` : "update failed"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Security scan completed</p>
                    <p className="text-xs text-gray-500">{securityStats.lastScan}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Package className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Package updates available</p>
                    <p className="text-xs text-gray-500">{securityStats.outdatedPackages} packages can be updated</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case "security-audit":
        return (
          <div>
            <p className="text-sm text-gray-400 mb-3">Scan your dependencies for known security vulnerabilities</p>
            <Button onClick={runSecurityAudit} disabled={auditRunning} className="w-full">
              {auditRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Audit...
                </>
              ) : (
                "Run Security Audit"
              )}
            </Button>
          </div>
        )

      case "update-history":
        return (
          <div className="space-y-3">
            {updateResults.length > 0 ? (
              updateResults.map((result, index) => (
                <div key={index} className="flex items-start">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {result.name} {result.success ? `updated to ${result.to}` : "update failed"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No recent updates</p>
            )}
          </div>
        )

      case "security-recommendations":
        return (
          <div className="space-y-4">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Update vulnerable packages</p>
                <p className="text-xs text-gray-500">
                  {securityStats.vulnerabilities} packages have known security vulnerabilities
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Enable security updates</p>
                <p className="text-xs text-gray-500">Set update mode to at least "Security Only"</p>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Unknown widget type</div>
    }
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 bg-gray-950 text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Center</h1>
        <div className="flex space-x-2">
          <Button onClick={applyChanges} variant="destructive" size="sm" disabled={applyingChanges}>
            {applyingChanges ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Applying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Apply Updates
              </>
            )}
          </Button>
          <Button onClick={fetchDependencies} variant="outline" size="sm" className="border-gray-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-white p-4 rounded-md mb-6 flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          <div className="flex-1">
            <span>{error}</span>

            {/* Add diagnostic information toggle */}
            {diagnosticInfo && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="text-xs flex items-center text-red-300 hover:text-white"
                >
                  <Info className="h-3 w-3 mr-1" />
                  {showDiagnostics ? "Hide" : "Show"} Diagnostic Information
                </button>

                {showDiagnostics && (
                  <pre className="mt-2 text-xs bg-red-950/50 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(diagnosticInfo, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto text-white hover:bg-red-800/50"
          >
            Dismiss
          </Button>
        </div>
      )}

      {setupMessage && (
        <div className="bg-blue-900/30 border border-blue-800 text-white p-4 rounded-md mb-6 flex items-center">
          <Info className="mr-2 h-5 w-5" />
          <div className="flex-1">
            <span>{setupMessage}</span>
            {!setupAttempted && (
              <div className="mt-2">
                <Button size="sm" onClick={setupDependencySystem} className="mr-2">
                  Set Up Dependency System
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSetupMessage(null)}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
          {setupAttempted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupMessage(null)}
              className="ml-auto text-white hover:bg-blue-800/50"
            >
              Dismiss
            </Button>
          )}
        </div>
      )}

      {showUpdateResults && updateResults.length > 0 && (
        <div className="bg-green-900/30 border border-green-800 text-white p-4 rounded-md mb-6">
          <div className="flex items-center mb-2">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span className="font-medium">Updates applied successfully</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpdateResults(false)}
              className="ml-auto text-white hover:bg-green-800/50"
            >
              Dismiss
            </Button>
          </div>
          <div className="mt-2 space-y-1">
            {updateResults.map((result, index) => (
              <div key={index} className="text-sm flex items-center">
                {result.success ? (
                  <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-red-400 mr-2" />
                )}
                <span>
                  {result.name}: {result.success ? `${result.from} → ${result.to}` : result.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-gray-900 border-gray-800">
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Security Dashboard</h2>
            <WidgetSelector availableWidgets={availableWidgetsForAdd} onAddWidget={handleAddWidget} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets
              .sort((a, b) => a.order - b.order)
              .map((widget) => {
                const widgetDef = availableWidgets.find((w) => w.id === widget.type)
                return (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id}
                    title={widgetDef?.title || widget.type}
                    onRemove={handleRemoveWidget}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {renderWidgetContent(widget.type)}
                  </DraggableWidget>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="dependencies">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Dependency Management</CardTitle>
                  <CardDescription>Manage your project dependencies and updates</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={scanDependencies} className="border-gray-700">
                    Scan Dependencies
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetAllSettings} className="border-gray-700">
                    Reset Settings
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search dependencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border-gray-700"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className={filter !== "all" ? "border-gray-700" : ""}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "outdated" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("outdated")}
                    className={filter !== "outdated" ? "border-gray-700" : ""}
                  >
                    Outdated
                  </Button>
                  <Button
                    variant={filter === "security" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("security")}
                    className={filter !== "security" ? "border-gray-700" : ""}
                  >
                    Security
                  </Button>
                  <Button
                    variant={filter === "locked" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("locked")}
                    className={filter !== "locked" ? "border-gray-700" : ""}
                  >
                    Locked
                  </Button>
                  <Button
                    variant={filter === "dev" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("dev")}
                    className={filter !== "dev" ? "border-gray-700" : ""}
                  >
                    Dev
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-4">Loading dependencies...</p>
                </div>
              ) : dependencies.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-xl font-semibold mb-2">No dependencies found</p>
                  <p className="text-gray-400 mb-4 max-w-md mx-auto">
                    This could be because the dependency system is still setting up or there was an error fetching the
                    data.
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4">
                      <Button onClick={setupDependencySystem} disabled={setupAttempted}>
                        {setupAttempted ? "Setup Attempted" : "Setup System"}
                      </Button>
                      <Button onClick={scanDependencies}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Dependencies
                      </Button>
                    </div>

                    <DependencySystemSetupGuide />

                    <div className="mt-6 bg-gray-800 p-4 rounded-md text-left max-w-md mx-auto">
                      <h3 className="font-medium mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Troubleshooting Steps
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                        <li>Check if the database tables are set up correctly</li>
                        <li>Verify that your package.json file exists and is valid</li>
                        <li>Make sure npm is installed and accessible on the server</li>
                        <li>Check the server logs for more detailed error information</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : filteredDependencies.length === 0 ? (
                <div className="text-center py-8">
                  <p>No dependencies match your search or filter criteria.</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-gray-700"
                    onClick={() => {
                      setSearchTerm("")
                      setFilter("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4">Package</th>
                        <th className="text-left py-3 px-4">Current</th>
                        <th className="text-left py-3 px-4">Latest</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-base">Update Mode</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDependencies.map((dep, index) => (
                        <tr
                          key={dep.id}
                          className={`${index % 2 === 0 ? "bg-gray-800/30" : ""} ${dep.hasSecurityIssue ? "bg-red-900/10" : ""}`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium flex items-center">
                              {dep.name}
                              {dep.isDev && (
                                <Badge variant="outline" className="ml-2 border-gray-700 text-gray-400">
                                  Dev
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">{dep.description || "No description"}</div>
                          </td>
                          <td className="py-3 px-4">{dep.currentVersion}</td>
                          <td className="py-3 px-4">{dep.latestVersion}</td>
                          <td className="py-3 px-4">
                            {dep.hasSecurityIssue ? (
                              <div className="flex items-center gap-1">
                                {getSeverityBadge(dep)}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => viewVulnerabilityDetails(dep)}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : dep.outdated ? (
                              <Badge variant="outline" className="border-yellow-800 text-yellow-400">
                                Outdated
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                                Up to date
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <FourStateToggle
                              value={dep.updateMode}
                              onValueChange={(value) => updateDependencyMode(dep.id, value)}
                              showLabels={false}
                              className="w-[300px] max-w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              disabled={!dep.outdated && !dep.hasSecurityIssue}
                              className={dep.hasSecurityIssue ? "bg-red-600 hover:bg-red-700" : ""}
                            >
                              Update
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedVulnerability && (
        <VulnerabilityDetails
          isOpen={!!selectedVulnerability}
          onClose={() => setSelectedVulnerability(null)}
          vulnerability={selectedVulnerability.vulnerability}
          packageName={selectedVulnerability.packageName}
          currentVersion={selectedVulnerability.currentVersion}
          latestVersion={selectedVulnerability.latestVersion}
        />
      )}
    </div>
  )
}
