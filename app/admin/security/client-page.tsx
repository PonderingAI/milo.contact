"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"
import { DraggableWidget } from "@/components/admin/draggable-widget"
import { VulnerabilityDetails } from "@/components/admin/vulnerability-details"
import { UpdatePolicyWidget } from "@/components/admin/update-policy-widget"
import { SecurityDashboardHeader } from "@/components/admin/security-dashboard-header"
import { DependencyList } from "@/components/admin/dependency-list"

export default function SecurityDashboardClient() {
  const [dependencies, setDependencies] = useState<any[]>([])
  const [audits, setAudits] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [updateMode, setUpdateMode] = useState("minor")
  const [selectedVulnerability, setSelectedVulnerability] = useState<any>(null)
  const [showVulnerabilityDetails, setShowVulnerabilityDetails] = useState(false)
  const [filters, setFilters] = useState({
    showDev: true,
    showPeer: true,
    showOptional: true,
  })

  // Widget layout state
  const [widgetLayout, setWidgetLayout] = useState<{ [key: string]: { order: number; span: number } }>({
    "update-policy": { order: 1, span: 1 },
    "dependency-stats": { order: 2, span: 1 },
    "vulnerability-summary": { order: 3, span: 1 },
    "recent-audits": { order: 4, span: 1 },
    "update-actions": { order: 5, span: 1 },
    "outdated-packages": { order: 6, span: 1 },
  })

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("securityDashboardState")
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        if (parsedState.activeTab) setActiveTab(parsedState.activeTab)
        if (parsedState.filters) setFilters(parsedState.filters)
        if (parsedState.widgetLayout) setWidgetLayout(parsedState.widgetLayout)
        if (parsedState.updateMode) setUpdateMode(parsedState.updateMode)
      }
    } catch (error) {
      console.error("Error loading saved state:", error)
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "securityDashboardState",
        JSON.stringify({
          activeTab,
          filters,
          widgetLayout,
          updateMode,
        }),
      )
    } catch (error) {
      console.error("Error saving state:", error)
    }
  }, [activeTab, filters, widgetLayout, updateMode])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch dependencies
      const depsResponse = await fetch("/api/dependencies/list")
      if (!depsResponse.ok) throw new Error("Failed to fetch dependencies")
      const depsData = await depsResponse.json()
      setDependencies(depsData.dependencies || [])

      // Fetch audits
      const auditsResponse = await fetch("/api/dependencies/audit")
      if (!auditsResponse.ok) throw new Error("Failed to fetch audits")
      const auditsData = await auditsResponse.json()
      setAudits(auditsData.audits || [])

      // Fetch update mode
      const modeResponse = await fetch("/api/dependencies/settings")
      if (modeResponse.ok) {
        const modeData = await modeResponse.json()
        if (modeData.settings?.updateMode) {
          setUpdateMode(modeData.settings.updateMode)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const resetAllSettings = async () => {
    if (!confirm("Are you sure you want to reset all dependency settings?")) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/dependencies/reset-all", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to reset settings")

      toast({
        title: "Settings Reset",
        description: "All dependency settings have been reset to defaults",
      })

      // Refresh data after reset
      fetchData()
    } catch (error) {
      console.error("Error resetting settings:", error)
      toast({
        title: "Error",
        description: "Failed to reset settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateWidgetLayout = (id: string, newLayout: { order?: number; span?: number }) => {
    setWidgetLayout((prev) => {
      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          ...(newLayout.order !== undefined ? { order: newLayout.order } : {}),
          ...(newLayout.span !== undefined ? { span: newLayout.span } : {}),
        },
      }
      return updated
    })
  }

  const filteredDependencies = dependencies.filter((dep) => {
    if (dep.type === "dev" && !filters.showDev) return false
    if (dep.type === "peer" && !filters.showPeer) return false
    if (dep.type === "optional" && !filters.showOptional) return false
    return true
  })

  const outdatedDependencies = filteredDependencies.filter((dep) => dep.currentVersion !== dep.latestVersion)

  const vulnerableDependencies = filteredDependencies.filter(
    (dep) => dep.vulnerabilities && dep.vulnerabilities.length > 0,
  )

  const sortedWidgets = Object.entries(widgetLayout)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([id]) => id)

  return (
    <div className="container mx-auto p-4">
      <SecurityDashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        refreshData={fetchData}
        isLoading={isLoading}
        filters={filters}
        setFilters={setFilters}
      />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          {sortedWidgets.map((widgetId) => {
            const layout = widgetLayout[widgetId]

            if (widgetId === "update-policy") {
              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  title="Update Policy"
                  onLayoutChange={(newLayout) => updateWidgetLayout(widgetId, newLayout)}
                  currentLayout={layout}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                >
                  <UpdatePolicyWidget
                    updateMode={updateMode}
                    setUpdateMode={setUpdateMode}
                    resetAllSettings={resetAllSettings}
                    isLoading={isLoading}
                  />
                </DraggableWidget>
              )
            }

            if (widgetId === "dependency-stats") {
              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  title="Dependency Statistics"
                  onLayoutChange={(newLayout) => updateWidgetLayout(widgetId, newLayout)}
                  currentLayout={layout}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                >
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{filteredDependencies.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Dependencies</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{outdatedDependencies.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Outdated</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{vulnerableDependencies.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Vulnerable</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{audits.length}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Recent Audits</div>
                    </div>
                  </div>
                </DraggableWidget>
              )
            }

            if (widgetId === "vulnerability-summary") {
              const highSeverity = vulnerableDependencies.filter((dep) =>
                dep.vulnerabilities.some((v) => v.severity === "high" || v.severity === "critical"),
              ).length

              const mediumSeverity = vulnerableDependencies.filter((dep) =>
                dep.vulnerabilities.some((v) => v.severity === "moderate" || v.severity === "medium"),
              ).length

              const lowSeverity = vulnerableDependencies.filter((dep) =>
                dep.vulnerabilities.some((v) => v.severity === "low"),
              ).length

              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  title="Vulnerability Summary"
                  onLayoutChange={(newLayout) => updateWidgetLayout(widgetId, newLayout)}
                  currentLayout={layout}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                >
                  <div className="space-y-4 mt-2">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        {highSeverity > 0 && (
                          <div
                            className="bg-red-500 h-4 rounded-full"
                            style={{ width: `${(highSeverity / filteredDependencies.length) * 100}%` }}
                          ></div>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium">{highSeverity} High</span>
                    </div>

                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        {mediumSeverity > 0 && (
                          <div
                            className="bg-orange-500 h-4 rounded-full"
                            style={{ width: `${(mediumSeverity / filteredDependencies.length) * 100}%` }}
                          ></div>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium">{mediumSeverity} Medium</span>
                    </div>

                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        {lowSeverity > 0 && (
                          <div
                            className="bg-yellow-500 h-4 rounded-full"
                            style={{ width: `${(lowSeverity / filteredDependencies.length) * 100}%` }}
                          ></div>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium">{lowSeverity} Low</span>
                    </div>

                    {vulnerableDependencies.length > 0 ? (
                      <button
                        onClick={() => setActiveTab("dependencies")}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                      >
                        View vulnerable dependencies
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">No vulnerabilities detected</div>
                    )}
                  </div>
                </DraggableWidget>
              )
            }

            if (widgetId === "recent-audits") {
              const recentAudits = [...audits]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)

              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  title="Recent Audits"
                  onLayoutChange={(newLayout) => updateWidgetLayout(widgetId, newLayout)}
                  currentLayout={layout}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                >
                  {recentAudits.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {recentAudits.map((audit, index) => (
                        <div key={index} className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{new Date(audit.created_at).toLocaleDateString()}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                audit.status === "success"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {audit.status}
                            </span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-300 mt-1">
                            {audit.findings > 0
                              ? `Found ${audit.findings} vulnerabilities`
                              : "No vulnerabilities found"}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => setActiveTab("audits")}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View all audits
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">No recent audits</div>
                  )}
                </DraggableWidget>
              )
            }

            if (widgetId === "update-actions") {
              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  title="Actions"
                  onLayoutChange={(newLayout) => updateWidgetLayout(widgetId, newLayout)}
                  currentLayout={layout}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                >
                  <div className="space-y-3 mt-2">
                    <button
                      onClick={() => {
                        if (confirm("Run security audit now?")) {
                          setIsLoading(true)
                          fetch("/api/dependencies/audit", { method: "POST" })
                            .then((res) => res.json())
                            .then((data) => {
                              toast({
                                title: "Audit Complete",
                                description: data.message || "Security audit completed",
                              })
                              fetchData()
                            })
                            .catch((err) => {
                              console.error(err)
                              toast({
                                title: "Error",
                                description: "Failed to run security audit",
                                variant: "destructive",
                              })
                            })
                            .finally(() => setIsLoading(false))
                        }
                      }}
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Run Security Audit
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Update all eligible dependencies based on your update policy?")) {
                          setIsLoading(true)
                          fetch("/api/dependencies/auto-update", { method: "POST" })
                            .then((res) => res.json())
                            .then((data) => {
                              toast({
                                title: "Update Complete",
                                description: data.message || "Dependencies updated",
                              })
                              fetchData()
                            })
                            .catch((err) => {
                              console.error(err)
                              toast({
                                title: "Error",
                                description: "Failed to update dependencies",
                                variant: "destructive",
                              })
                            })
                            .finally(() => setIsLoading(false))
                        }
                      }}
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Update All Eligible
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Scan for new dependencies?")) {
                          setIsLoading(true)
                          fetch("/api/dependencies/scan", { method: "POST" })
                            .then((res) => res.json())
                            .then((data) => {
                              toast({
                                title: "Scan Complete",
                                description: data.message || "Dependencies scanned",
                              })
                              fetchData()
                            })
                            .catch((err) => {
                              console.error(err)
                              toast({
                                title: "Error",
                                description: "Failed to scan dependencies",
                                variant: "destructive",
                              })
                            })
                            .finally(() => setIsLoading(false))
                        }
                      }}
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Scan Dependencies
                    </button>
                  </div>
                </DraggableWidget>
              )
            }

            if (widgetId === "outdated-packages") {
              const topOutdated = [...outdatedDependencies]
                .sort((a, b) => {
                  const aVersionDiff =
                    Number.parseInt(a.latestVersion.split(".")[0]) - Number.parseInt(a.currentVersion.split(".")[0])
                  const bVersionDiff =
                    Number.parseInt(b.latestVersion.split(".")[0]) - Number.parseInt(b.currentVersion.split(".")[0])
                  return bVersionDiff - aVersionDiff
                })
                .slice(0, 5)

              return (
                <DraggableWidget
                  key={widgetId}
                  id={widgetId}
                  title="Outdated Packages"
                  onLayoutChange={(newLayout) => updateWidgetLayout(widgetId, newLayout)}
                  currentLayout={layout}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
                >
                  {topOutdated.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {topOutdated.map((dep, index) => (
                        <div key={index} className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{dep.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {dep.currentVersion} → {dep.latestVersion}
                            </span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-300 mt-1 text-xs">
                            {dep.type === "dev"
                              ? "Development"
                              : dep.type === "peer"
                                ? "Peer"
                                : dep.type === "optional"
                                  ? "Optional"
                                  : "Production"}
                          </div>
                        </div>
                      ))}

                      {outdatedDependencies.length > 5 && (
                        <button
                          onClick={() => setActiveTab("dependencies")}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View all outdated ({outdatedDependencies.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">No outdated packages</div>
                  )}
                </DraggableWidget>
              )
            }

            return null
          })}
        </div>
      )}

      {activeTab === "dependencies" && (
        <DependencyList
          dependencies={filteredDependencies}
          isLoading={isLoading}
          onViewVulnerability={(vulnerability) => {
            setSelectedVulnerability(vulnerability)
            setShowVulnerabilityDetails(true)
          }}
          fetchData={fetchData}
        />
      )}

      {activeTab === "audits" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-semibold mb-4">Security Audits</h2>

          {audits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Findings
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {[...audits]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((audit, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(audit.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              audit.status === "success"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {audit.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {audit.findings} vulnerabilities
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              // Show audit details
                              alert(`Audit details: ${JSON.stringify(audit.details || {}, null, 2)}`)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No audit records found</div>
          )}
        </div>
      )}

      {showVulnerabilityDetails && selectedVulnerability && (
        <VulnerabilityDetails
          vulnerability={selectedVulnerability}
          onClose={() => {
            setShowVulnerabilityDetails(false)
            setSelectedVulnerability(null)
          }}
        />
      )}
    </div>
  )
}
