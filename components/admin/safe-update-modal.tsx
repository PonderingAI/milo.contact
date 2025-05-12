"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface SafeUpdateModalProps {
  dependencies: any[]
  onClose: () => void
  onUpdateComplete: () => void
}

export function SafeUpdateModal({ dependencies, onClose, onUpdateComplete }: SafeUpdateModalProps) {
  const [selectedMode, setSelectedMode] = useState<string>("compatible")
  const [selectedDeps, setSelectedDeps] = useState<string[]>([])
  const [updating, setUpdating] = useState<boolean>(false)
  const [dryRun, setDryRun] = useState<boolean>(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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

  const toggleDependency = (name: string) => {
    if (selectedDeps.includes(name)) {
      setSelectedDeps(selectedDeps.filter((dep) => dep !== name))
    } else {
      setSelectedDeps([...selectedDeps, name])
    }
  }

  const selectAllDependencies = () => {
    setSelectedDeps(dependencies.map((dep) => dep.name))
  }

  const selectOutdatedDependencies = () => {
    setSelectedDeps(dependencies.filter((dep) => dep.outdated).map((dep) => dep.name))
  }

  const clearSelection = () => {
    setSelectedDeps([])
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
      const response = await fetch("/api/dependencies/safe-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packages: selectedDeps,
          mode: selectedMode,
          dryRun,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update dependencies")
      }

      setResult(data)

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Safe Dependency Updates</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="h-6 w-6" />
            </Button>
          </div>

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

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

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
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating || selectedDeps.length === 0}>
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : dryRun ? (
                "Simulate Update"
              ) : (
                "Update Dependencies"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
