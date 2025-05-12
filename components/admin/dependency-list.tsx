"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FourStateToggle, type ToggleState } from "@/components/ui/four-state-toggle"
import { Info, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Dependency {
  id: string
  name: string
  current_version: string // Changed from currentVersion
  latest_version: string // Changed from latestVersion
  outdated: boolean
  locked: boolean
  description: string
  has_security_issue: boolean // Changed from hasSecurityIssue
  security_details?: any
  has_dependabot_alert?: boolean // Changed from hasDependabotAlert
  dependabot_alert_details?: any
  update_mode: ToggleState
  is_dev?: boolean // Changed from isDev
}

interface DependencyListProps {
  dependencies: Dependency[]
  filter: string
  searchTerm: string
  updateDependencyMode: (id: string, value: ToggleState) => void
  viewVulnerabilityDetails: (dependency: Dependency) => void
  viewDependabotAlertDetails: (dependency: Dependency) => void
  clearFilters: () => void
}

export function DependencyList({
  dependencies,
  filter,
  searchTerm,
  updateDependencyMode,
  viewVulnerabilityDetails,
  viewDependabotAlertDetails,
  clearFilters,
}: DependencyListProps) {
  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "outdated") return dep.outdated
      if (filter === "locked") return dep.locked
      if (filter === "security") return dep.has_security_issue
      if (filter === "dependabot") return dep.has_dependabot_alert
      if (filter === "dev") return dep.is_dev
      return true
    })
    .filter(
      (dep) =>
        dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  // Get severity badge for a dependency
  const getSeverityBadge = (dependency: Dependency) => {
    if (dependency.has_dependabot_alert && dependency.dependabot_alert_details) {
      const severity = dependency.dependabot_alert_details.severity?.toLowerCase()

      switch (severity) {
        case "critical":
          return <Badge className="bg-red-900/20 text-red-400 border-red-800">Dependabot: Critical</Badge>
        case "high":
          return <Badge className="bg-orange-900/20 text-orange-400 border-orange-800">Dependabot: High</Badge>
        case "moderate":
        case "medium":
          return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-800">Dependabot: Medium</Badge>
        case "low":
          return <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">Dependabot: Low</Badge>
        default:
          return <Badge className="bg-purple-900/20 text-purple-400 border-purple-800">Dependabot Alert</Badge>
      }
    }

    if (dependency.has_security_issue && dependency.security_details) {
      const severity = dependency.security_details.severity?.toLowerCase()

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

    return null
  }

  if (filteredDependencies.length === 0) {
    return (
      <div className="text-center py-8">
        <p>No dependencies match your search or filter criteria.</p>
        <Button variant="outline" className="mt-4 border-gray-700" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4">Package</th>
            <th className="text-left py-3 px-4">Current</th>
            <th className="text-left py-3 px-4">Latest</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4 font-medium text-base">
              <div className="flex items-center">
                Update Mode
                <div className="relative ml-1 group">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-80 p-3 bg-gray-800 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    <p className="mb-2">
                      <strong>Off:</strong> No automatic updates
                    </p>
                    <p className="mb-2">
                      <strong>Security Only:</strong> Only apply security patches
                    </p>
                    <p className="mb-2">
                      <strong>All Updates:</strong> Apply all package updates
                    </p>
                    <p className="mb-2">
                      <strong>Global:</strong> Use the global setting
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-gray-300">
                        <strong>Note:</strong> Packages with Dependabot alerts will be updated regardless of update mode
                        to protect your application from security vulnerabilities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {filteredDependencies.map((dep, index) => (
              <motion.tr
                key={dep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`${index % 2 === 0 ? "bg-gray-800/30" : ""} ${
                  dep.has_dependabot_alert ? "bg-gray-700/30" : dep.has_security_issue ? "bg-gray-700/20" : ""
                } ${dep.update_mode === "global" ? "border-l-2 border-gray-600" : ""} ${
                  dep.has_dependabot_alert && dep.update_mode === "off" ? "border-l-2 border-gray-500" : ""
                }`}
              >
                <td className="py-3 px-4">
                  <div className="font-medium flex items-center">
                    {dep.name}
                    {dep.is_dev && (
                      <Badge variant="outline" className="ml-2 border-gray-700 text-gray-400">
                        Dev
                      </Badge>
                    )}
                    {dep.update_mode === "global" && (
                      <Badge variant="outline" className="ml-2 border-gray-600 text-gray-300 bg-gray-700/50">
                        Global
                      </Badge>
                    )}
                    {dep.has_dependabot_alert && dep.update_mode === "off" && (
                      <Badge variant="outline" className="ml-2 border-gray-500 text-gray-300 bg-gray-700/50">
                        Force Update
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{dep.description || "No description"}</div>
                  {dep.has_dependabot_alert && dep.dependabot_alert_details?.url && (
                    <a
                      href={dep.dependabot_alert_details.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-gray-300 flex items-center mt-1"
                    >
                      View Dependabot Alert
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </td>
                <td className="py-3 px-4">{dep.current_version}</td>
                <td className="py-3 px-4">{dep.latest_version}</td>
                <td className="py-3 px-4">
                  {dep.has_dependabot_alert ? (
                    <div className="flex items-center gap-1">
                      {getSeverityBadge(dep)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => viewDependabotAlertDetails(dep)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : dep.has_security_issue ? (
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
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      Outdated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-700/50 text-gray-300 border-gray-600">
                      Up to date
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="relative">
                    <FourStateToggle
                      value={dep.update_mode}
                      onValueChange={(value) => updateDependencyMode(dep.id, value)}
                      showLabels={false}
                      className="w-[300px] max-w-full"
                    />
                    {dep.has_dependabot_alert && dep.update_mode === "off" && (
                      <div className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs px-1 rounded-full">!</div>
                    )}
                  </div>
                  {dep.has_dependabot_alert && dep.update_mode === "off" && (
                    <div className="text-xs text-gray-400 mt-1">
                      Will be updated despite "Off" setting due to Dependabot alert
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Button
                    size="sm"
                    disabled={!dep.outdated && !dep.has_security_issue && !dep.has_dependabot_alert}
                    className={
                      dep.has_dependabot_alert || dep.has_security_issue ? "bg-gray-700 hover:bg-gray-600" : ""
                    }
                  >
                    Update
                  </Button>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
