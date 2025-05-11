"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FourStateToggle, type ToggleState } from "@/components/ui/four-state-toggle"
import {
  AlertCircle,
  CheckCircle,
  Package,
  AlertTriangle,
  Globe,
  GripVertical,
  X,
  GitPullRequest,
  RotateCcw,
} from "lucide-react"
import { motion } from "framer-motion"

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

interface WidgetProps {
  type: string
  id: string
  securityStats: SecurityStats
  dependencies: Dependency[]
  updateResults: any[]
  globalUpdateMode: ToggleState
  globalDependenciesCount: number
  dependabotAlertCount: number
  setActiveTab: (tab: string) => void
  setFilter: (filter: string) => void
  updateGlobalMode: (value: ToggleState) => void
  resetAllSettings: () => void
  runSecurityAudit: () => void
  auditRunning: boolean
  applyChanges: () => void
  handleAddWidget: (widgetId: string) => void
}

export function SecurityWidget({
  type,
  id,
  securityStats,
  dependencies,
  updateResults,
  globalUpdateMode,
  globalDependenciesCount,
  dependabotAlertCount,
  setActiveTab,
  setFilter,
  updateGlobalMode,
  resetAllSettings,
  runSecurityAudit,
  auditRunning,
  applyChanges,
  handleAddWidget,
}: WidgetProps) {
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
                    <strong>Important:</strong> Packages with Dependabot alerts will be updated automatically regardless
                    of update mode settings to protect your application from security vulnerabilities.
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

export function DraggableSecurityWidget({
  id,
  type,
  title,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggingWidgetId,
  ...widgetProps
}: WidgetProps & {
  title: string
  onRemove: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd?: () => void
  draggingWidgetId: string | null
}) {
  return (
    <motion.div
      id={id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        zIndex: draggingWidgetId === id ? 10 : 1,
        boxShadow: draggingWidgetId === id ? "0 10px 25px rgba(0, 0, 0, 0.5)" : "none",
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card
        className={`bg-gray-800 border-gray-700 transition-all duration-200 h-full ${
          draggingWidgetId === id ? "opacity-70 scale-105" : ""
        }`}
        draggable
        onDragStart={(e) => onDragStart(e, id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, id)}
      >
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-gray-800 rounded-t-lg border-b border-gray-700">
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 text-gray-500 mr-2 cursor-move" />
            <CardTitle className="text-sm font-medium text-gray-200">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRemove(id)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <SecurityWidget type={type} id={id} {...widgetProps} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
