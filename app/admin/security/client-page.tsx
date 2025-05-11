"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, RefreshCw, AlertTriangle, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { MaterialWidgetContainer } from "@/components/admin/material-widget-container"
import { UpdatePolicyWidget } from "@/components/admin/update-policy-widget"

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
  updateMode: string
  isDev?: boolean
}

interface SecurityStats {
  vulnerabilities: number
  dependabotAlerts: number
  outdatedPackages: number
  securityScore: number
  lastScan: string
}

interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

interface Widget {
  id: string
  type: string
  title: string
  position: WidgetPosition
  isCollapsed?: boolean
}

export default function SecurityClientPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateMode, setUpdateMode] = useState("manual")
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    vulnerabilities: 0,
    dependabotAlerts: 0,
    outdatedPackages: 0,
    securityScore: 100,
    lastScan: new Date().toLocaleDateString(),
  })
  const [auditRunning, setAuditRunning] = useState(false)
  const [applyingChanges, setApplyingChanges] = useState(false)
  const [updateResults, setUpdateResults] = useState<any[]>([])
  const [showUpdateResults, setShowUpdateResults] = useState(false)
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Default widgets
  const defaultWidgets: Widget[] = [
    {
      id: "security-score",
      type: "security-score",
      title: "Security Score",
      position: { x: 20, y: 20, width: 300, height: 200 },
    },
    {
      id: "vulnerabilities",
      type: "vulnerabilities",
      title: "Vulnerabilities",
      position: { x: 340, y: 20, width: 300, height: 200 },
    },
    {
      id: "update-policy",
      type: "update-policy",
      title: "Update Policy",
      position: { x: 660, y: 20, width: 400, height: 300 },
    },
    {
      id: "outdated-packages",
      type: "outdated-packages",
      title: "Outdated Packages",
      position: { x: 20, y: 240, width: 300, height: 200 },
    },
    {
      id: "dependabot-alerts",
      type: "dependabot-alerts",
      title: "Dependabot Alerts",
      position: { x: 340, y: 240, width: 300, height: 200 },
    },
  ]

  // Load widgets from localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedWidgets = localStorage.getItem("security-dashboard-widgets")
        if (savedWidgets) {
          setWidgets(JSON.parse(savedWidgets))
        } else {
          setWidgets(defaultWidgets)
        }
      }
    } catch (error) {
      console.error("Error loading dashboard state:", error)
      setWidgets(defaultWidgets)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save widgets to localStorage when they change
  useEffect(() => {
    if (isLoaded && widgets.length > 0) {
      try {
        localStorage.setItem("security-dashboard-widgets", JSON.stringify(widgets))
      } catch (error) {
        console.error("Error saving dashboard state:", error)
      }
    }
  }, [widgets, isLoaded])

  // Fetch update mode from API
  useEffect(() => {
    const fetchUpdateMode = async () => {
      try {
        const response = await fetch("/api/dependencies/settings")
        if (response.ok) {
          const data = await response.json()
          setUpdateMode(data.updateMode || "manual")
        }
      } catch (error) {
        console.error("Failed to fetch update mode:", error)
      }
    }

    fetchUpdateMode()
  }, [])

  // Handle widget position change
  const handleWidgetPositionChange = (id: string, position: WidgetPosition) => {
    setWidgets((prevWidgets) => prevWidgets.map((widget) => (widget.id === id ? { ...widget, position } : widget)))
  }

  // Handle widget collapse toggle
  const handleWidgetCollapseToggle = (id: string, isCollapsed: boolean) => {
    setWidgets((prevWidgets) => prevWidgets.map((widget) => (widget.id === id ? { ...widget, isCollapsed } : widget)))
  }

  // Handle update mode change
  const handleUpdateModeChange = async (mode: string) => {
    try {
      const response = await fetch("/api/dependencies/update-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
      })

      if (response.ok) {
        setUpdateMode(mode)
        toast({
          title: "Update Mode Changed",
          description: `Update mode set to ${mode}`,
        })
      } else {
        throw new Error("Failed to update mode")
      }
    } catch (error) {
      console.error("Error updating mode:", error)
      toast({
        title: "Error",
        description: "Failed to update mode",
        variant: "destructive",
      })
    }
  }

  // Fetch dependencies
  const fetchDependencies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data for now - replace with actual API call
      setTimeout(() => {
        setDependencies([
          {
            id: "react",
            name: "react",
            currentVersion: "18.2.0",
            latestVersion: "18.2.0",
            outdated: false,
            locked: false,
            description: "React is a JavaScript library for building user interfaces.",
            hasSecurityIssue: false,
            updateMode: "global",
          },
          {
            id: "next",
            name: "next",
            currentVersion: "13.4.12",
            latestVersion: "14.0.3",
            outdated: true,
            locked: false,
            description: "The React Framework for the Web",
            hasSecurityIssue: false,
            updateMode: "global",
          },
          {
            id: "lodash",
            name: "lodash",
            currentVersion: "4.17.20",
            latestVersion: "4.17.21",
            outdated: true,
            locked: false,
            description: "Lodash modular utilities.",
            hasSecurityIssue: true,
            securityDetails: {
              severity: "high",
              summary: "Prototype Pollution in lodash",
              description: "Versions of lodash prior to 4.17.21 are vulnerable to prototype pollution.",
            },
            updateMode: "global",
          },
        ])

        setSecurityStats({
          vulnerabilities: 1,
          dependabotAlerts: 0,
          outdatedPackages: 2,
          securityScore: 85,
          lastScan: new Date().toLocaleDateString(),
        })

        setLoading(false)
      }, 1000)
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError(`Error fetching dependencies: ${err instanceof Error ? err.message : String(err)}`)
      setDependencies([])
      setLoading(false)
    }
  }, [])

  // Fetch dependencies on mount
  useEffect(() => {
    fetchDependencies()
  }, [fetchDependencies])

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
                className={`ml-2 ${
                  securityStats.vulnerabilities > 0
                    ? "bg-red-900/20 text-red-400 border-red-800"
                    : "bg-green-900/20 text-green-400 border-green-800"
                }`}
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

      case "dependabot-alerts":
        return (
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center">
              <div className="text-3xl font-bold">{securityStats.dependabotAlerts}</div>
              <Badge
                variant="outline"
                className={`ml-2 ${
                  securityStats.dependabotAlerts > 0
                    ? "bg-purple-900/20 text-purple-400 border-purple-800"
                    : "bg-green-900/20 text-green-400 border-green-800"
                }`}
              >
                {securityStats.dependabotAlerts > 0 ? "Critical updates" : "All clear"}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-2">GitHub Dependabot alerts</p>
            {securityStats.dependabotAlerts > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setActiveTab("dependencies")
                  setFilter("dependabot")
                }}
              >
                View Alerts
              </Button>
            )}
          </div>
        )

      case "update-policy":
        return <UpdatePolicyWidget updateMode={updateMode} onUpdateModeChange={handleUpdateModeChange} />

      default:
        return <div>Unknown widget type: {type}</div>
    }
  }

  return (
    <div className="container mx-auto p-6 bg-gray-950 text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Center</h1>
        <div className="flex space-x-2">
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

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-gray-900 border-gray-800">
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Security Dashboard</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          </div>

          <div className="relative w-full min-h-[600px] bg-gray-900 rounded-lg p-4">
            {/* Widget container */}
            {isLoaded &&
              widgets.map((widget) => (
                <MaterialWidgetContainer
                  key={widget.id}
                  id={widget.id}
                  title={widget.title}
                  initialPosition={widget.position}
                  onPositionChange={handleWidgetPositionChange}
                  isCollapsed={widget.isCollapsed}
                  onCollapseToggle={handleWidgetCollapseToggle}
                >
                  {renderWidgetContent(widget.type)}
                </MaterialWidgetContainer>
              ))}
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
                </div>
              ) : (
                <div className="space-y-4">
                  {dependencies
                    .filter((dep) => {
                      if (filter === "security") return dep.hasSecurityIssue
                      if (filter === "outdated") return dep.outdated
                      return true
                    })
                    .filter((dep) => dep.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((dep) => (
                      <div
                        key={dep.id}
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium flex items-center">
                              {dep.name}
                              {dep.hasSecurityIssue && (
                                <Badge className="ml-2 bg-red-900/20 text-red-400 border-red-800">Security</Badge>
                              )}
                              {dep.outdated && !dep.hasSecurityIssue && (
                                <Badge className="ml-2 bg-yellow-900/20 text-yellow-400 border-yellow-800">
                                  Outdated
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">{dep.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              <span className="text-gray-400">Current:</span>{" "}
                              <span className="font-medium">{dep.currentVersion}</span>
                            </div>
                            {dep.outdated && (
                              <div className="text-sm">
                                <span className="text-gray-400">Latest:</span>{" "}
                                <span className="font-medium text-green-400">{dep.latestVersion}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {dep.hasSecurityIssue && dep.securityDetails && (
                          <div className="mt-3 bg-red-900/10 border border-red-900/20 rounded p-3">
                            <div className="flex items-start">
                              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                              <div>
                                <p className="font-medium text-red-400">{dep.securityDetails.summary}</p>
                                <p className="text-sm text-gray-300 mt-1">{dep.securityDetails.description}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
