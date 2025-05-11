"use client"

import type React from "react"
import { FourStateToggle } from "@/components/ui/four-state-toggle"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CheckCircle,
  Package,
  Shield,
  AlertTriangle,
  Activity,
  Search,
  Clock,
  Globe,
  GitPullRequest,
  RotateCcw,
} from "lucide-react"

// Define widget types
export type WidgetType =
  | "security-score"
  | "vulnerabilities"
  | "dependabot-alerts"
  | "outdated-packages"
  | "update-settings"
  | "reset-settings"
  | "recent-activity"
  | "security-audit"
  | "update-history"
  | "security-recommendations"

// Define widget metadata
export interface WidgetDefinition {
  id: WidgetType
  title: string
  description: string
  icon: React.ReactNode
  defaultSize: { w: number; h: number }
  renderContent: (props: any) => React.ReactNode
}

// Define widget registry
export const widgetRegistry: Record<WidgetType, WidgetDefinition> = {
  "security-score": {
    id: "security-score",
    title: "Security Score",
    description: "Overall security rating of your application",
    icon: <Shield className="h-4 w-4" />,
    defaultSize: { w: 3, h: 2 },
    renderContent: ({ securityStats }) => (
      <div className="flex flex-col h-full justify-between">
        <div className="text-3xl font-bold">{securityStats.securityScore}%</div>
        <div className="mt-2">
          <Progress value={securityStats.securityScore} className="h-2" />
        </div>
        <p className="text-sm text-gray-400 mt-2">Last scan: {securityStats.lastScan}</p>
      </div>
    ),
  },

  vulnerabilities: {
    id: "vulnerabilities",
    title: "Vulnerabilities",
    description: "Known security issues in your dependencies",
    icon: <AlertTriangle className="h-4 w-4" />,
    defaultSize: { w: 3, h: 2 },
    renderContent: ({ securityStats, setActiveTab, setFilter }) => (
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
    ),
  },

  "dependabot-alerts": {
    id: "dependabot-alerts",
    title: "Dependabot Alerts",
    description: "Security alerts from GitHub Dependabot",
    icon: <GitPullRequest className="h-4 w-4" />,
    defaultSize: { w: 3, h: 3 },
    renderContent: ({ securityStats, setActiveTab, setFilter }) => (
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
    ),
  },

  "outdated-packages": {
    id: "outdated-packages",
    title: "Outdated Packages",
    description: "Dependencies that need updates",
    icon: <Package className="h-4 w-4" />,
    defaultSize: { w: 3, h: 2 },
    renderContent: ({ securityStats, setActiveTab, setFilter }) => (
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
    ),
  },

  "update-settings": {
    id: "update-settings",
    title: "Global Update Policy",
    description: "Configure automatic update behavior",
    icon: <Globe className="h-4 w-4" />,
    defaultSize: { w: 6, h: 4 },
    renderContent: ({ globalUpdateMode, updateGlobalMode, globalDependenciesCount, dependabotAlertCount }) => (
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
    ),
  },

  "reset-settings": {
    id: "reset-settings",
    title: "Reset All Settings",
    description: "Reset all dependency settings to defaults",
    icon: <RotateCcw className="h-4 w-4" />,
    defaultSize: { w: 3, h: 2 },
    renderContent: ({ resetAllSettings, dependencies, isLoading }) => (
      <div className="flex flex-col h-full justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Reset All Settings</h3>
          <p className="text-sm text-gray-400 mb-4">
            Reset all dependency update settings to use the global policy. This will affect {dependencies.length}{" "}
            packages.
          </p>
        </div>
        <Button variant="outline" onClick={resetAllSettings} disabled={isLoading} className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All Settings
        </Button>
      </div>
    ),
  },

  "recent-activity": {
    id: "recent-activity",
    title: "Recent Activity",
    description: "Latest security events and actions",
    icon: <Activity className="h-4 w-4" />,
    defaultSize: { w: 3, h: 3 },
    renderContent: ({ updateResults, securityStats, handleAddWidget }) => (
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
    ),
  },

  "security-audit": {
    id: "security-audit",
    title: "Security Audit",
    description: "Run a security scan of your application",
    icon: <Search className="h-4 w-4" />,
    defaultSize: { w: 3, h: 2 },
    renderContent: ({ runSecurityAudit, auditRunning }) => (
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
    ),
  },

  "update-history": {
    id: "update-history",
    title: "Update History",
    description: "Recent package updates",
    icon: <Clock className="h-4 w-4" />,
    defaultSize: { w: 4, h: 4 },
    renderContent: ({ updateResults, applyChanges }) => (
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
    ),
  },

  "security-recommendations": {
    id: "security-recommendations",
    title: "Security Recommendations",
    description: "Suggested actions to improve security",
    icon: <AlertCircle className="h-4 w-4" />,
    defaultSize: { w: 3, h: 3 },
    renderContent: ({ securityStats, applyChanges }) => (
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
    ),
  },
}

// Helper function to get widget definition
export function getWidgetDefinition(type: WidgetType): WidgetDefinition {
  return widgetRegistry[type]
}

// Helper function to get all available widget definitions
export function getAllWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(widgetRegistry)
}
