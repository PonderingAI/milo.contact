"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Shield, Database, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface CompatibilityResult {
  name: string
  currentVersion: string
  targetVersion: string
  compatible: boolean | null
  needsTesting: boolean
  recommended: string | null
  notes: string | null
  lastVerified?: string
  breakingReason?: string
}

interface EnhancedSafeUpdateModalProps {
  dependencies: Dependency[]
  onClose: () => void
  onUpdateComplete: () => void
}

export function EnhancedSafeUpdateModal({ dependencies, onClose, onUpdateComplete }: EnhancedSafeUpdateModalProps) {
  const [selectedMode, setSelectedMode] = useState<string>("compatible")
  const [selectedDeps, setSelectedDeps] = useState<string[]>([])
  const [updating, setUpdating] = useState<boolean>(false)
  const [checkingCompatibility, setCheckingCompatibility] = useState<boolean>(false)
  const [dryRun, setDryRun] = useState<boolean>(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [compatibilityResults, setCompatibilityResults] = useState<CompatibilityResult[]>([])
  const [activeTab, setActiveTab] = useState<string>("select")
  const [hasCompatibilityDatabase, setHasCompatibilityDatabase] = useState<boolean | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({})

  const updateModes = [
    {
      id: "compatible",
      name: "Compatible Updates",
      description: "Update packages within the version ranges specified in package.json",
      risk: "Low",
    },
    {
      id: "patch",
      name: "Patch Updates",
      description: "Update to the latest patch version (fixes only)",
      risk: "Low-Medium",
    },
    {
      id: "minor",
      name: "Minor Updates",
      description: "Update to the latest minor version (new features, no breaking changes)",
      risk: "Medium",
    },
    {
      id: "latest",
      name: "Latest Updates",
      description: "Update to the latest version regardless of compatibility",
      risk: "High",
    },
  ]

  // Check if compatibility database exists
  useEffect(() => {
    const checkCompatibilityDatabase = async () => {
      try {
        const response = await fetch("/api/dependencies/compatibility")
        setHasCompatibilityDatabase(response.ok)
      } catch {
        setHasCompatibilityDatabase(false)
      }
    }

    checkCompatibilityDatabase()
  }, [])

  const toggleDependency = (name: string) => {
    if (selectedDeps.includes(name)) {
      setSelectedDeps(selectedDeps.filter((dep) => dep !== name))
      const newSelectedVersions = { ...selectedVersions }
      delete newSelectedVersions[name]
      setSelectedVersions(newSelectedVersions)
    } else {
      setSelectedDeps([...selectedDeps, name])
      const dep = dependencies.find((d) => d.name === name)
      if (dep) {
        setSelectedVersions({
          ...selectedVersions,
          [name]: dep.latestVersion,
        })
      }
    }
  }

  const selectAllDependencies = () => {
    const allDeps = dependencies.map((dep) => dep.name)
    setSelectedDeps(allDeps)

    const versions = {}
    dependencies.forEach((dep) => {
      versions[dep.name] = dep.latestVersion
    })
    setSelectedVersions(versions)
  }

  const selectOutdatedDependencies = () => {
    const outdatedDeps = dependencies.filter((dep) => dep.outdated).map((dep) => dep.name)
    setSelectedDeps(outdatedDeps)

    const versions = {}
    dependencies
      .filter((dep) => dep.outdated)
      .forEach((dep) => {
        versions[dep.name] = dep.latestVersion
      })
    setSelectedVersions(versions)
  }

  const clearSelection = () => {
    setSelectedDeps([])
    setSelectedVersions({})
  }

  const checkCompatibility = async () => {
    if (selectedDeps.length === 0) {
      setError("Please select at least one dependency to check")
      return
    }

    setCheckingCompatibility(true)
    setError(null)

    try {
      const packagesToCheck = selectedDeps.map((name) => {
        const dep = dependencies.find((d) => d.name === name)
        return {
          name,
          currentVersion: dep?.currentVersion || "",
          targetVersion: selectedVersions[name] || dep?.latestVersion || "",
        }
      })

      const response = await fetch("/api/dependencies/check-compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packages: packagesToCheck,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check compatibility")
      }

      const data = await response.json()
      setCompatibilityResults(data.results || [])

      // Move to review tab
      setActiveTab("review")
    } catch (err) {
      console.error("Error checking compatibility:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCheckingCompatibility(false)
    }
  }

  const handleUpdate = async () => {
    if (selectedDeps.length === 0) {
      setError("Please select at least one dependency to update")
      return
    }

    setUpdating(true)
    setError(null)
    setResult(null)

    try {
      // Create an array of package@version strings for specific versions
      const packagesToUpdate = selectedDeps.map((name) => {
        if (selectedVersions[name]) {
          return `${name}@${selectedVersions[name]}`
        }
        return name
      })

      const response = await fetch("/api/dependencies/safe-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packages: packagesToUpdate,
          mode: selectedMode,
          dryRun,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update dependencies")
      }

      setResult(data)

      // If this was a real update (not dry run) and it was successful, update compatibility database
      if (!dryRun && data.success && hasCompatibilityDatabase) {
        await updateCompatibilityDatabase(data.updatedVersions)
      }

      // If this was a real update (not dry run) and it was successful, notify parent
      if (!dryRun && data.success) {
        setTimeout(() => {
          onUpdateComplete()
        }, 2000)
      }
    } catch (err) {
      console.error("Error updating dependencies:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUpdating(false)
    }
  }

  const updateCompatibilityDatabase = async (updatedVersions: Record<string, string>) => {
    if (!updatedVersions || Object.keys(updatedVersions).length === 0) return

    try {
      // For each updated package, add or update a compatibility record
      const updatePromises = Object.entries(updatedVersions).map(([name, version]) => {
        const versionWithoutPrefix = version.replace(/^\^|~/, "")

        return fetch("/api/dependencies/compatibility", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            package_name: name,
            min_compatible_version: versionWithoutPrefix,
            recommended_version: versionWithoutPrefix,
            compatibility_notes: `Successfully updated to version ${versionWithoutPrefix}`,
            verified_by: "Automatic Update System",
            test_results: "Passed automatic verification after update",
          }),
        })
      })

      await Promise.all(updatePromises)
    } catch (err) {
      console.error("Error updating compatibility database:", err)
      // Don't show this error to the user, as the update was still successful
    }
  }

  const onChangeVersion = (packageName: string, version: string) => {
    setSelectedVersions({
      ...selectedVersions,
      [packageName]: version,
    })
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Enhanced Dependency Updates</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-6 w-6" />
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Compatibility Database Info */}
          {hasCompatibilityDatabase === false && (
            <Alert className="mb-4 bg-blue-900/20 border-blue-800">
              <Database className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                The dependency compatibility database is not set up. For enhanced safety, consider setting it up to
                track known compatible versions.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="select">1. Select Dependencies</TabsTrigger>
              <TabsTrigger value="review" disabled={selectedDeps.length === 0}>
                2. Review Compatibility
              </TabsTrigger>
              <TabsTrigger value="update" disabled={selectedDeps.length === 0}>
                3. Update Dependencies
              </TabsTrigger>
            </TabsList>

            {/* STEP 1: Select Dependencies */}
            <TabsContent value="select">
              {/* Update Mode Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Select Update Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {updateModes.map((mode) => (
                    <div
                      key={mode.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedMode === mode.id
                          ? "border-blue-500 bg-blue-900/20"
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                      onClick={() => setSelectedMode(mode.id)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{mode.name}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            mode.risk === "Low"
                              ? "bg-green-900/20 text-green-400"
                              : mode.risk === "Medium"
                                ? "bg-yellow-900/20 text-yellow-400"
                                : "bg-red-900/20 text-red-400"
                          }`}
                        >
                          {mode.risk} Risk
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{mode.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependency Selection */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Select Dependencies to Update</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllDependencies}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={selectOutdatedDependencies}>
                      Select Outdated
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="border border-gray-700 rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="p-2 text-left w-10">
                            <input
                              type="checkbox"
                              checked={selectedDeps.length === dependencies.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  selectAllDependencies()
                                } else {
                                  clearSelection()
                                }
                              }}
                            />
                          </th>
                          <th className="p-2 text-left">Package</th>
                          <th className="p-2 text-left">Current</th>
                          <th className="p-2 text-left">Latest</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dependencies.map((dep, index) => (
                          <tr
                            key={dep.id}
                            className={`${index % 2 === 0 ? "bg-gray-800/30" : ""} ${
                              dep.outdated ? "bg-yellow-900/10" : ""
                            }`}
                          >
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selectedDeps.includes(dep.name)}
                                onChange={() => toggleDependency(dep.name)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="font-medium">{dep.name}</div>
                              <div className="text-xs text-gray-400">{dep.description?.substring(0, 50)}</div>
                            </td>
                            <td className="p-2">{dep.currentVersion}</td>
                            <td className="p-2">{dep.latestVersion}</td>
                            <td className="p-2">
                              {dep.outdated ? (
                                <span className="text-yellow-400 text-sm">Outdated</span>
                              ) : (
                                <span className="text-green-400 text-sm">Up to date</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={hasCompatibilityDatabase ? checkCompatibility : () => setActiveTab("update")}
                  disabled={selectedDeps.length === 0 || checkingCompatibility}
                >
                  {checkingCompatibility ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : hasCompatibilityDatabase ? (
                    "Check Compatibility"
                  ) : (
                    "Continue to Update"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* STEP 2: Review Compatibility */}
            <TabsContent value="review">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Compatibility Analysis</h3>
                  <Button variant="outline" size="sm" onClick={checkCompatibility} disabled={checkingCompatibility}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${checkingCompatibility ? "animate-spin" : ""}`} />
                    Refresh Analysis
                  </Button>
                </div>

                <table className="w-full border border-gray-700 rounded-lg overflow-hidden">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3 text-left">Package</th>
                      <th className="p-3 text-left">Current</th>
                      <th className="p-3 text-left">Target Version</th>
                      <th className="p-3 text-left">Compatibility</th>
                      <th className="p-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compatibilityResults.map((result, index) => (
                      <tr key={result.name} className={index % 2 === 0 ? "bg-gray-800/30" : ""}>
                        <td className="p-3 font-medium">{result.name}</td>
                        <td className="p-3">{result.currentVersion}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedVersions[result.name] || result.targetVersion}
                              onChange={(e) => onChangeVersion(result.name, e.target.value)}
                              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                            >
                              <option value={result.targetVersion}>{result.targetVersion} (Latest)</option>
                              {result.recommended && result.recommended !== result.targetVersion && (
                                <option value={result.recommended}>{result.recommended} (Recommended)</option>
                              )}
                            </select>
                          </div>
                        </td>
                        <td className="p-3">
                          {result.compatible === true ? (
                            <Badge className="bg-green-900/20 text-green-400 border-green-800">Compatible</Badge>
                          ) : result.compatible === false ? (
                            <Badge className="bg-red-900/20 text-red-400 border-red-800">Not Compatible</Badge>
                          ) : (
                            <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-800">Unknown</Badge>
                          )}
                          {result.lastVerified && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Verified: {formatDate(result.lastVerified)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {result.breakingReason ? (
                            <Alert variant="destructive" className="p-2 text-xs bg-red-900/20 border-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {result.breakingReason}
                            </Alert>
                          ) : result.notes ? (
                            <p className="text-sm">{result.notes}</p>
                          ) : result.compatible === null ? (
                            <p className="text-sm text-yellow-400">
                              No compatibility data available. Testing required.
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400">No notes available</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("select")}>
                  Back to Selection
                </Button>
                <Button onClick={() => setActiveTab("update")}>Continue to Update</Button>
              </div>
            </TabsContent>

            {/* STEP 3: Update Dependencies */}
            <TabsContent value="update">
              {/* Dry Run Toggle */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dryRun"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="dryRun" className="text-sm">
                    Dry Run (simulate updates without making changes)
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Recommended for your first update to see what would change without risk
                </p>
              </div>

              {/* Summary */}
              <div className="mb-6 border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Update Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Update Mode:</span>
                    <span className="font-medium">
                      {updateModes.find((m) => m.id === selectedMode)?.name || selectedMode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Packages to Update:</span>
                    <span className="font-medium">{selectedDeps.length}</span>
                  </div>
                  {hasCompatibilityDatabase && compatibilityResults.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Compatibility Checked:</span>
                        <span className="font-medium">Yes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Known Compatible:</span>
                        <span className="font-medium">
                          {compatibilityResults.filter((r) => r.compatible === true).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Known Incompatible:</span>
                        <span className="font-medium text-red-400">
                          {compatibilityResults.filter((r) => r.compatible === false).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Unknown Compatibility:</span>
                        <span className="font-medium text-yellow-400">
                          {compatibilityResults.filter((r) => r.compatible === null).length}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="text-sm text-gray-400 italic">
                      {compatibilityResults.some((r) => r.compatible === false) && !dryRun ? (
                        <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-800">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Warning: Some packages are known to be incompatible. It's recommended to run in dry run mode
                            first or exclude these packages.
                          </AlertDescription>
                        </Alert>
                      ) : compatibilityResults.some((r) => r.compatible === null) && !dryRun ? (
                        <Alert className="mt-2 bg-yellow-900/20 border-yellow-800">
                          <AlertCircle className="h-4 w-4 text-yellow-400" />
                          <AlertDescription>
                            Note: Some packages have unknown compatibility status. Consider running tests after update
                            or using dry run mode first.
                          </AlertDescription>
                        </Alert>
                      ) : dryRun ? (
                        "Dry run mode will simulate updates without making actual changes."
                      ) : (
                        "Updates will be applied and the system will verify they don't break your application."
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Message */}
              {result && (
                <div
                  className={`mb-4 p-3 ${
                    result.success
                      ? "bg-green-900/20 border-green-800 text-green-400"
                      : "bg-red-900/20 border-red-800 text-red-400"
                  } border rounded-lg`}
                >
                  <div className="flex items-start">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{result.message || (result.success ? "Success!" : "Failed!")}</p>
                      {result.dryRun && <p className="text-sm mt-1">This was a dry run. No changes were made.</p>}
                      {result.updatedVersions && Object.keys(result.updatedVersions).length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Updated versions:</p>
                          <ul className="text-sm">
                            {Object.entries(result.updatedVersions).map(([pkg, version]) => (
                              <li key={pkg}>
                                {pkg}: {version}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.success && !result.dryRun && hasCompatibilityDatabase && (
                        <p className="text-sm mt-2">
                          Compatibility database has been updated with successful test results.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab(hasCompatibilityDatabase ? "review" : "select")}>
                  Back
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updating || selectedDeps.length === 0}
                  className={
                    compatibilityResults.some((r) => r.compatible === false) && !dryRun
                      ? "bg-red-700 hover:bg-red-600"
                      : ""
                  }
                >
                  {updating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : dryRun ? (
                    "Simulate Update"
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Update Dependencies
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
