"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FourStateToggle, type ToggleState } from "@/components/ui/four-state-toggle"
import { WidgetSelector, type WidgetOption } from "@/components/admin/widget-selector"
import {
  AlertCircle,
  CheckCircle,
  Package,
  Shield,
  RefreshCw,
  AlertTriangle,
  Info,
  Activity,
  Search,
  Clock,
  Globe,
  GitPullRequest,
  ExternalLink,
  RotateCcw,
  X,
} from "lucide-react"
import { VulnerabilityDetails } from "@/components/admin/vulnerability-details"
import { DependencyList } from "@/components/admin/dependency-list"
import { WidgetComponent } from "@/components/admin/widget"
import { motion, AnimatePresence } from "framer-motion"

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
  hasDependabotAlert?: boolean
  dependabotAlertDetails?: any
  updateMode: ToggleState
  isDev?: boolean
}

interface SecurityStats {
  vulnerabilities: number
  dependabotAlerts: number
  outdatedPackages: number
  securityScore: number
  lastScan: string
}

interface Widget {
  id: string
  type: string
  visible: boolean
  order: number
  column?: number
  height?: number
}

interface DashboardState {
  widgets: Widget[]
  activeTab: string
  filter: string
  searchTerm: string
  globalUpdateMode: ToggleState
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
    id: "dependabot-alerts",
    title: "Dependabot Alerts",
    description: "Security alerts from GitHub Dependabot",
    icon: <GitPullRequest className="h-4 w-4" />,
  },
  {
    id: "outdated-packages",
    title: "Outdated Packages",
    description: "Dependencies that need updates",
    icon: <Package className="h-4 w-4" />,
  },
  {
    id: "update-settings",
    title: "Global Update Settings",
    description: "Configure automatic update behavior",
    icon: <Globe className="h-4 w-4" />,
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
  const [globalUpdateMode, setGlobalUpdateMode] = useState<ToggleState>("conservative")
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [availableWidgetsForAdd, setAvailableWidgetsForAdd] = useState<WidgetOption[]>([])
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    vulnerabilities: 0,
    dependabotAlerts: 0,
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
  const [selectedDependabotAlert, setSelectedDependabotAlert] = useState<{
    alert: any
    packageName: string
    currentVersion: string
    latestVersion: string
  } | null>(null)
  const [updateResults, setUpdateResults] = useState<any[]>([])
  const [showUpdateResults, setShowUpdateResults] = useState(false)
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null)
  const widgetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Load dashboard state from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem("securityDashboardState")
        if (savedState) {
          const parsedState: DashboardState = JSON.parse(savedState)

          // Set widgets
          if (parsedState.widgets && parsedState.widgets.length > 0) {
            setWidgets(parsedState.widgets)
          } else {
            // Default widgets if none saved
            setDefaultWidgets()
          }

          // Set active tab
          if (parsedState.activeTab) {
            setActiveTab(parsedState.activeTab)
          }

          // Set filter
          if (parsedState.filter) {
            setFilter(parsedState.filter)
          }

          // Set search term
          if (parsedState.searchTerm) {
            setSearchTerm(parsedState.searchTerm)
          }

          // Set global update mode
          if (parsedState.globalUpdateMode) {
            setGlobalUpdateMode(parsedState.globalUpdateMode)
          }
        } else {
          // No saved state, set defaults
          setDefaultWidgets()
        }
      } catch (error) {
        console.error("Error loading dashboard state:", error)
        setDefaultWidgets()
      }
    }
  }, [])

  // Set default widgets
  const setDefaultWidgets = () => {
    const defaultWidgets: Widget[] = [
      { id: "update-settings", type: "update-settings", visible: true, order: 0 },
      { id: "security-score", type: "security-score", visible: true, order: 1 },
      { id: "dependabot-alerts", type: "dependabot-alerts", visible: true, order: 2 },
      { id: "vulnerabilities", type: "vulnerabilities", visible: true, order: 3 },
      { id: "outdated-packages", type: "outdated-packages", visible: true, order: 4 },
      { id: "security-recommendations", type: "security-recommendations", visible: true, order: 5 },
      { id: "recent-activity", type: "recent-activity", visible: true, order: 6 },
    ]
    setWidgets(defaultWidgets)
  }

  // Save dashboard state to localStorage
  const saveDashboardState = useCallback(() => {
    if (typeof window !== "undefined") {
      const state: DashboardState = {
        widgets,
        activeTab,
        filter,
        searchTerm,
        globalUpdateMode,
      }
      localStorage.setItem("securityDashboardState", JSON.stringify(state))
    }
  }, [widgets, activeTab, filter, searchTerm, globalUpdateMode])

  // Save state when relevant state changes
  useEffect(() => {
    if (hasMounted) {
      saveDashboardState()
    }
  }, [widgets, activeTab, filter, searchTerm, globalUpdateMode, hasMounted, saveDashboardState])

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

  // Measure widget heights after render
  useEffect(() => {
    if (hasMounted && widgets.length > 0) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const updatedWidgets = [...widgets]
        let changed = false

        updatedWidgets.forEach((widget, index) => {
          const element = widgetRefs.current[widget.id]
          if (element) {
            const height = element.offsetHeight
            if (widget.height !== height) {
              updatedWidgets[index] = { ...widget, height }
              changed = true
            }
          }
        })

        if (changed) {
          setWidgets(updatedWidgets)
        }
      })
    }
  }, [widgets, hasMounted])

  // Organize widgets into columns (masonry layout)
  const organizeWidgetsIntoColumns = useCallback(
    (columnCount = 3) => {
      if (widgets.length === 0) return []

      // Create empty columns
      const columns: Widget[][] = Array.from({ length: columnCount }, () => [])

      // Sort widgets by order
      const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order)

      // Calculate column heights
      const columnHeights = Array(columnCount).fill(0)

      // Place each widget in the shortest column
      sortedWidgets.forEach((widget) => {
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
        columns[shortestColumnIndex].push(widget)
        columnHeights[shortestColumnIndex] += widget.height || 200 // Use default height if not measured
      })

      return columns
    },
    [widgets],
  )

  const fetchDependencies = useCallback(async () => {
    if (!isSignedIn) return

    try {
      setLoading(true)
      setError(null)
      setDiagnosticInfo(null)

      const response = await fetch("/api/dependencies")
      const data = await response.json()

      // Store the full response for diagnostics
      setDiagnosticInfo(data)

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
        hasDependabotAlert: dep.has_dependabot_alert || dep.hasDependabotAlert || false,
        dependabotAlertDetails: dep.dependabot_alert_details || dep.dependabotAlertDetails,
        updateMode: dep.update_mode || dep.updateMode || "global",
        isDev: dep.is_dev || dep.isDev || false,
      }))

      setDependencies(mappedDependencies)

      // Update security stats
      setSecurityStats({
        vulnerabilities: data.vulnerabilities || mappedDependencies.filter((d) => d.hasSecurityIssue).length,
        dependabotAlerts: data.dependabotAlerts || mappedDependencies.filter((d) => d.hasDependabotAlert).length,
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
  }, [isSignedIn])

  useEffect(() => {
    if (isSignedIn) {
      fetchDependencies()
    }
  }, [isSignedIn, fetchDependencies])

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

  const scanDependencies = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dependencies/scan", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to scan dependencies")
      }

      // Refresh dependencies after scan
      await fetchDependencies()

      // Clear setup message after a delay
      setTimeout(() => {
        // Success message could be shown here if needed
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

      // Show a message if no updates were needed
      if (data.results.length === 0) {
        setError("No updates were needed. All packages are up to date.")
      }

      // Refresh dependencies
      fetchDependencies()
    } catch (err: any) {
      setError(`Error applying changes: ${err.message}`)
      console.error("Error applying changes:", err)
    } finally {
      setApplyingChanges(false)
    }
  }

  // Calculate a security score based on vulnerabilities
  const calculateSecurityScore = (deps: Dependency[]) => {
    const totalDeps = deps.length
    if (totalDeps === 0) return 100

    const vulnerableDeps = deps.filter((d) => d.hasSecurityIssue).length
    const dependabotAlertDeps = deps.filter((d) => d.hasDependabotAlert).length
    const outdatedDeps = deps.filter((d) => d.outdated).length

    // Calculate score: start with 100 and deduct points
    let score = 100

    // Deduct more for Dependabot alerts (highest priority)
    score -= (dependabotAlertDeps / totalDeps) * 60

    // Deduct for vulnerable dependencies
    score -= (vulnerableDeps / totalDeps) * 40

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
        dependabotAlerts: data.dependabotAlerts || 0,
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
  }

  const handleRemoveWidget = (id: string) => {
    const updatedWidgets = widgets.filter((w) => w.id !== id)
    setWidgets(updatedWidgets)
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("widgetId", id)
    setDraggingWidgetId(id)

    // Add a dragging class to the element
    const element = document.getElementById(id)
    if (element) {
      element.classList.add("dragging")
    }
  }

  const handleDragEnd = () => {
    setDraggingWidgetId(null)

    // Remove dragging class from all elements
    document.querySelectorAll(".dragging").forEach((el) => {
      el.classList.remove("dragging")
    })
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

    // Remove dragging class
    handleDragEnd()
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

  const viewDependabotAlertDetails = (dependency: Dependency) => {
    if (dependency.hasDependabotAlert && dependency.dependabotAlertDetails) {
      setSelectedDependabotAlert({
        alert: dependency.dependabotAlertDetails,
        packageName: dependency.name,
        currentVersion: dependency.currentVersion,
        latestVersion: dependency.latestVersion,
      })
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilter("all")
  }

  // Count dependencies using global settings
  const globalDependenciesCount = dependencies.filter((dep) => dep.updateMode === "global").length
  const dependabotAlertCount = dependencies.filter((dep) => dep.hasDependabotAlert).length

  // Render widget content based on type
  const renderWidgetContent = (type: string) => {
    switch (type) {
      case "security-score":
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="text-3xl font-bold">{securityStats.securityScore}%</div>
            <div className="mt-2">
              <Progress value={securityStats.securityScore} className="h-2" />
            </div>
            <p className="text-sm text-gray-400 mt-2">Last scan: {securityStats.lastScan}</p>
          </div>
        )

      case "vulnerabilities":
        return (
          <div className="flex flex-col h-full justify-between">
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

      case "dependabot-alerts":
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center">
              <div className="text-3xl font-bold">{securityStats.dependabotAlerts}</div>
              <Badge
                variant="outline"
                className={`ml-2 ${securityStats.dependabotAlerts > 0 ? "bg-purple-900/20 text-purple-400 border-purple-800" : "bg-green-900/20 text-green-400 border-green-800"}`}
              >
                {securityStats.dependabotAlerts > 0 ? "Critical updates" : "All clear"}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-2">GitHub Dependabot alerts</p>
            {securityStats.dependabotAlerts > 0 && (
              <div className="mt-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setActiveTab("dependencies")
                    setFilter("dependabot")
                  }}
                >
                  View Alerts
                </Button>
                <div className="bg-gray-800 p-2 rounded-md border border-gray-700">
                  <p className="text-xs text-gray-300">
                    <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                    Dependabot alerts will be updated automatically regardless of update settings
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case "outdated-packages":
        return (
          <div className="flex flex-col h-full justify-between">
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
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-gray-300" />
                  Global Update Policy
                </h3>
                <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                  {globalDependenciesCount} packages using this policy
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <FourStateToggle
                    value={globalUpdateMode}
                    onValueChange={updateGlobalMode}
                    hideGlobal={true}
                    labels={{
                      off: "Off",
                      conservative: "Security Only",
                      aggressive: "All Updates",
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 bg-gray-700/50 hover:bg-gray-600"
                    onClick={resetAllSettings}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset All
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-300 space-y-2 mt-4 bg-gray-900/60 p-3 rounded-md">
                <p className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${globalUpdateMode === "off" ? "bg-gray-400" : "bg-gray-700"}`}
                  ></span>
                  <strong>Off:</strong> No automatic updates
                </p>
                <p className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${globalUpdateMode === "conservative" ? "bg-blue-400" : "bg-blue-900"}`}
                  ></span>
                  <strong>Security Only:</strong> Only security patches
                </p>
                <p className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${globalUpdateMode === "aggressive" ? "bg-green-400" : "bg-green-900"}`}
                  ></span>
                  <strong>All Updates:</strong> All package updates
                </p>
              </div>

              {dependabotAlertCount > 0 && (
                <div className="mt-4 bg-gray-900/60 p-3 rounded-md border border-gray-700">
                  <p className="text-sm text-gray-300 flex items-start">
                    <GitPullRequest className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Important:</strong> Packages with Dependabot alerts will be updated automatically
                      regardless of update mode settings to protect your application from security vulnerabilities.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case "recent-activity":
        return (
          <div className="space-y-3 flex flex-col h-full justify-between">
            <div className="space-y-3 flex-grow">
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
                        {result.dependabotAlert && (
                          <Badge className="ml-2 bg-gray-700 text-gray-300 border-gray-600">Dependabot</Badge>
                        )}
                        {result.forcedUpdate && (
                          <Badge className="ml-2 bg-gray-700 text-gray-300 border-gray-600">Forced</Badge>
                        )}
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
            {updateResults.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  handleAddWidget("update-history")
                }}
              >
                View All Updates
              </Button>
            )}
          </div>
        )

      case "security-audit":
        return (
          <div className="flex flex-col h-full justify-between">
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
          <div className="space-y-3 flex flex-col h-full justify-between">
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[200px] pr-1">
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
                        {result.dependabotAlert && (
                          <Badge className="ml-2 bg-gray-700 text-gray-300 border-gray-600">Dependabot</Badge>
                        )}
                        {result.forcedUpdate && (
                          <Badge className="ml-2 bg-gray-700 text-gray-300 border-gray-600">Forced</Badge>
                        )}
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
            {updateResults.length > 0 && (
              <Button variant="outline" size="sm" className="mt-2" onClick={applyChanges}>
                Apply More Updates
              </Button>
            )}
          </div>
        )

      case "security-recommendations":
        return (
          <div className="space-y-4 flex flex-col h-full justify-between">
            <div className="space-y-4 flex-grow">
              {securityStats.dependabotAlerts > 0 && (
                <div className="flex items-start">
                  <GitPullRequest className="h-4 w-4 text-purple-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Update Dependabot alerts</p>
                    <p className="text-xs text-gray-500">
                      {securityStats.dependabotAlerts} packages have Dependabot alerts
                    </p>
                  </div>
                </div>
              )}
              {securityStats.vulnerabilities > 0 && (
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Update vulnerable packages</p>
                    <p className="text-xs text-gray-500">
                      {securityStats.vulnerabilities} packages have known security vulnerabilities
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Enable security updates</p>
                  <p className="text-xs text-gray-500">Set update mode to at least "Security Only"</p>
                </div>
              </div>
            </div>
            {(securityStats.dependabotAlerts > 0 || securityStats.vulnerabilities > 0) && (
              <Button variant="outline" size="sm" className="mt-2" onClick={applyChanges}>
                Apply Recommended Updates
              </Button>
            )}
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

  const checkForScheduledUpdates = useCallback(async () => {
    console.log("Checking for scheduled updates based on preferences...")
    try {
      const response = await fetch("/api/dependencies/scheduled-update")
      if (response.ok) {
        const data = await response.json()
        if (data.updated > 0) {
          console.log(`Applied ${data.updated} updates based on preferences`)
          fetchDependencies()
          setUpdateResults(data.results || [])
          setShowUpdateResults(true)
        }
      }
    } catch (error) {
      console.error("Error in scheduled update:", error)
    }
  }, [fetchDependencies])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted) {
      return
    }

    // Run immediately
    checkForScheduledUpdates()

    // Set up interval (3 hours = 3 * 60 * 60 * 1000 ms)
    const intervalId = setInterval(checkForScheduledUpdates, 3 * 60 * 60 * 1000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [hasMounted, checkForScheduledUpdates])

  // Organize widgets into columns for masonry layout
  const widgetColumns = organizeWidgetsIntoColumns(3)

  return (
    <div className="container mx-auto p-6 bg-gray-950 text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Center</h1>
        <div className="flex space-x-2">
          <Button onClick={fetchDependencies} variant="outline" size="sm" className="border-gray-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
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
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-red-900/30 border border-red-800 text-white p-4 rounded-md mb-6 flex items-center"
          >
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

                  <AnimatePresence>
                    {showDiagnostics && (
                      <motion.pre
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 text-xs bg-red-950/50 p-2 rounded overflow-auto max-h-40"
                      >
                        {JSON.stringify(diagnosticInfo, null, 2)}
                      </motion.pre>
                    )}
                  </AnimatePresence>
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpdateResults && updateResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-green-900/30 border border-green-800 text-white p-4 rounded-md mb-6"
          >
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
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="text-sm flex items-center"
                >
                  {result.success ? (
                    <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-400 mr-2" />
                  )}
                  <span>
                    {result.name}: {result.success ? `${result.from} → ${result.to}` : result.error}
                    {result.dependabotAlert && (
                      <Badge className="ml-2 bg-gray-700 text-gray-300 border-gray-600 text-xs">Dependabot</Badge>
                    )}
                    {result.forcedUpdate && (
                      <Badge className="ml-2 bg-gray-700 text-gray-300 border-gray-600 text-xs">Forced</Badge>
                    )}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Grid layout for widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets
              .sort((a, b) => a.order - b.order)
              .map((widget) => {
                const widgetDef = availableWidgets.find((w) => w.id === widget.type)
                const isUpdateSettings = widget.type === "update-settings"

                return (
                  <WidgetComponent
                    key={widget.id}
                    id={widget.id}
                    title={widgetDef?.title || widget.type}
                    onRemove={handleRemoveWidget}
                    draggable={true}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    draggingWidgetId={draggingWidgetId}
                    fullWidth={false}
                    highlighted={isUpdateSettings}
                    className={isUpdateSettings ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}
                  >
                    {renderWidgetContent(widget.type)}
                  </WidgetComponent>
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
                    variant={filter === "dependabot" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("dependabot")}
                    className={filter !== "dependabot" ? "border-gray-700 bg-gray-800" : ""}
                  >
                    Dependabot
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
                    variant={filter === "outdated" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("outdated")}
                    className={filter !== "outdated" ? "border-gray-700" : ""}
                  >
                    Outdated
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
                    Run a dependency scan to populate the system with your project dependencies.
                  </p>
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4">
                      <Button onClick={scanDependencies}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Scan Dependencies
                      </Button>
                    </div>

                    <div className="mt-6 bg-gray-800 p-4 rounded-md text-left max-w-md mx-auto">
                      <h3 className="font-medium mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Troubleshooting Steps
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                        <li>Verify that your package.json file exists and is valid</li>
                        <li>Make sure npm is installed and accessible on the server</li>
                        <li>Check the server logs for more detailed error information</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <DependencyList
                  dependencies={dependencies}
                  filter={filter}
                  searchTerm={searchTerm}
                  updateDependencyMode={updateDependencyMode}
                  viewVulnerabilityDetails={viewVulnerabilityDetails}
                  viewDependabotAlertDetails={viewDependabotAlertDetails}
                  clearFilters={clearFilters}
                />
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

      {selectedDependabotAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <GitPullRequest className="mr-2 h-5 w-5 text-gray-300" />
                Dependabot Alert: {selectedDependabotAlert.packageName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDependabotAlert(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
                <h3 className="font-medium text-gray-300 mb-2">
                  {selectedDependabotAlert.alert.summary || "Security Vulnerability"}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-gray-700 text-gray-300 border-gray-600">
                    Severity: {selectedDependabotAlert.alert.severity || "Unknown"}
                  </Badge>
                  <Badge className="bg-gray-700 text-gray-300 border-gray-600">
                    Current: {selectedDependabotAlert.currentVersion}
                  </Badge>
                  <Badge className="bg-gray-700 text-gray-300 border-gray-600">
                    Latest: {selectedDependabotAlert.latestVersion}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300">
                  This package will be automatically updated regardless of your update mode settings to protect your
                  application from security vulnerabilities.
                </p>
              </div>

              {selectedDependabotAlert.alert.url && (
                <div>
                  <a
                    href={selectedDependabotAlert.alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-gray-100 flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View full advisory on GitHub
                  </a>
                </div>
              )}

              <div className="mt-4">
                <Button
                  onClick={() => {
                    setSelectedDependabotAlert(null)
                    applyChanges()
                  }}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  Update Now
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        .dragging {
          opacity: 0.7;
          transform: scale(1.05);
          z-index: 100;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  )
}
