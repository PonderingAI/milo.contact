"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, Database, Edit, HelpCircle, RefreshCw, Search, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DependencyCompatibility {
  id: number
  package_name: string
  min_compatible_version: string
  max_compatible_version: string
  recommended_version: string
  compatibility_notes: string
  last_verified_date: string
  verified_by: string
  test_results: string
  breaking_versions: Record<string, string>
}

export function DependencyCompatibilityManager() {
  const [compatibilityData, setCompatibilityData] = useState<DependencyCompatibility[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSetupPrompt, setShowSetupPrompt] = useState(false)
  const [settingUp, setSettingUp] = useState(false)
  const [setupSuccess, setSetupSuccess] = useState(false)
  const [showAddEditDialog, setShowAddEditDialog] = useState(false)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [currentRecord, setCurrentRecord] = useState<Partial<DependencyCompatibility>>({})
  const [breakingVersions, setBreakingVersions] = useState<{ version: string; reason: string }[]>([])
  const [newBreakingVersion, setNewBreakingVersion] = useState({ version: "", reason: "" })

  // Fetch compatibility data
  const fetchCompatibilityData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies/compatibility")

      if (!response.ok) {
        if (response.status === 400) {
          setShowSetupPrompt(true)
          return
        }

        const data = await response.json()
        throw new Error(data.error || "Failed to fetch compatibility data")
      }

      const data = await response.json()
      setCompatibilityData(data.data || [])
      setShowSetupPrompt(false)
    } catch (err) {
      console.error("Error fetching compatibility data:", err)
      setError(err instanceof Error ? err.message : String(err))

      // Check if the error is because the table doesn't exist
      if (err instanceof Error && err.message.includes("relation") && err.message.includes("does not exist")) {
        setShowSetupPrompt(true)
      }
    } finally {
      setLoading(false)
    }
  }

  // Setup the compatibility table
  const setupCompatibilityTable = async () => {
    setSettingUp(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies/setup-compatibility-table", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to set up compatibility table")
      }

      setSetupSuccess(true)
      setTimeout(() => {
        setShowSetupPrompt(false)
        fetchCompatibilityData()
      }, 2000)
    } catch (err) {
      console.error("Error setting up compatibility table:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSettingUp(false)
    }
  }

  // Add or update compatibility record
  const saveCompatibilityRecord = async () => {
    if (!currentRecord.package_name) {
      setError("Package name is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Convert breaking versions array to object
      const breakingVersionsObj = {}
      breakingVersions.forEach((bv) => {
        if (bv.version && bv.reason) {
          breakingVersionsObj[bv.version] = bv.reason
        }
      })

      const response = await fetch("/api/dependencies/compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentRecord,
          breaking_versions: breakingVersionsObj,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save compatibility record")
      }

      setShowAddEditDialog(false)
      fetchCompatibilityData()
    } catch (err) {
      console.error("Error saving compatibility record:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  // Add new breaking version
  const addBreakingVersion = () => {
    if (newBreakingVersion.version && newBreakingVersion.reason) {
      setBreakingVersions([...breakingVersions, { ...newBreakingVersion }])
      setNewBreakingVersion({ version: "", reason: "" })
    }
  }

  // Remove breaking version
  const removeBreakingVersion = (index: number) => {
    setBreakingVersions(breakingVersions.filter((_, i) => i !== index))
  }

  // Open add/edit dialog
  const openAddEditDialog = (mode: "add" | "edit", record?: DependencyCompatibility) => {
    setFormMode(mode)

    if (mode === "edit" && record) {
      setCurrentRecord(record)

      // Convert breaking versions object to array
      const breakingVersionsArr = []
      if (record.breaking_versions) {
        Object.entries(record.breaking_versions).forEach(([version, reason]) => {
          breakingVersionsArr.push({ version, reason: reason as string })
        })
      }
      setBreakingVersions(breakingVersionsArr)
    } else {
      setCurrentRecord({})
      setBreakingVersions([])
    }

    setShowAddEditDialog(true)
  }

  // Load data on component mount
  useEffect(() => {
    fetchCompatibilityData()
  }, [])

  // Filter data by search term
  const filteredData = compatibilityData.filter((record) =>
    record.package_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Dependency Compatibility Knowledge Base</h2>
        <p className="text-gray-400">
          Track and document which versions of dependencies are known to work with your project. This helps ensure safer
          updates and prevents regressions.
        </p>
      </div>

      {/* Setup Prompt */}
      {showSetupPrompt && (
        <div className="bg-gray-800 border border-gray-700 rounded-md p-6 mb-6">
          <div className="flex items-start">
            <Database className="h-6 w-6 text-blue-400 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Setup Required</h3>
              <p className="text-gray-400 mb-4">
                The dependency compatibility database table needs to be set up before you can use this feature.
              </p>

              {setupSuccess ? (
                <Alert className="mb-4 bg-green-900/20 border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    Setup completed successfully! Loading data...
                  </AlertDescription>
                </Alert>
              ) : error ? (
                <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                onClick={setupCompatibilityTable}
                disabled={settingUp || setupSuccess}
                className="bg-blue-600 hover:bg-blue-500"
              >
                {settingUp ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Setting Up...
                  </>
                ) : setupSuccess ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setup Complete
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Setup Compatibility Database
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !showSetupPrompt && (
        <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Add Button */}
      {!showSetupPrompt && (
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchCompatibilityData} disabled={loading} className="border-gray-700">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => openAddEditDialog("add")}>Add Compatibility Record</Button>
          </div>
        </div>
      )}

      {/* Compatibility Table */}
      {!showSetupPrompt && (
        <div className="border border-gray-700 rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-800">
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Version Range</TableHead>
                <TableHead>Recommended</TableHead>
                <TableHead>Last Verified</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <span>Loading compatibility data...</span>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <HelpCircle className="h-5 w-5 mx-auto mb-2 text-gray-400" />
                    {searchTerm ? (
                      <span>No matching packages found</span>
                    ) : (
                      <span>No compatibility data found. Add your first record.</span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((record) => (
                  <TableRow key={record.id} className="border-t border-gray-700">
                    <TableCell className="font-medium">{record.package_name}</TableCell>
                    <TableCell>
                      {record.min_compatible_version && record.max_compatible_version ? (
                        `${record.min_compatible_version} - ${record.max_compatible_version}`
                      ) : record.min_compatible_version ? (
                        `>= ${record.min_compatible_version}`
                      ) : record.max_compatible_version ? (
                        `<= ${record.max_compatible_version}`
                      ) : (
                        <span className="text-gray-400">Any version</span>
                      )}
                      {record.breaking_versions && Object.keys(record.breaking_versions).length > 0 && (
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-800">
                            {Object.keys(record.breaking_versions).length} Breaking Version(s)
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.recommended_version ? (
                        <Badge className="bg-green-900/20 text-green-400 border-green-800">
                          {record.recommended_version}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{formatDate(record.last_verified_date)}</span>
                      </div>
                      {record.verified_by && <div className="text-xs text-gray-400 mt-1">by {record.verified_by}</div>}
                    </TableCell>
                    <TableCell>
                      {record.compatibility_notes ? (
                        <div className="max-w-xs truncate" title={record.compatibility_notes}>
                          {record.compatibility_notes}
                        </div>
                      ) : (
                        <span className="text-gray-400">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openAddEditDialog("edit", record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddEditDialog} onOpenChange={setShowAddEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "add" ? "Add New Compatibility Record" : "Edit Compatibility Record"}
            </DialogTitle>
            <DialogDescription>
              Document compatibility information for a dependency to help with future updates.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="package_name" className="text-right">
                Package Name*
              </Label>
              <Input
                id="package_name"
                value={currentRecord.package_name || ""}
                onChange={(e) => setCurrentRecord({ ...currentRecord, package_name: e.target.value })}
                className="col-span-3"
                disabled={formMode === "edit"}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min_compatible_version" className="text-right">
                Min Version
              </Label>
              <Input
                id="min_compatible_version"
                value={currentRecord.min_compatible_version || ""}
                onChange={(e) => setCurrentRecord({ ...currentRecord, min_compatible_version: e.target.value })}
                placeholder="e.g., 1.0.0"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max_compatible_version" className="text-right">
                Max Version
              </Label>
              <Input
                id="max_compatible_version"
                value={currentRecord.max_compatible_version || ""}
                onChange={(e) => setCurrentRecord({ ...currentRecord, max_compatible_version: e.target.value })}
                placeholder="e.g., 2.0.0"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recommended_version" className="text-right">
                Recommended
              </Label>
              <Input
                id="recommended_version"
                value={currentRecord.recommended_version || ""}
                onChange={(e) => setCurrentRecord({ ...currentRecord, recommended_version: e.target.value })}
                placeholder="e.g., 1.5.2"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="verified_by" className="text-right">
                Verified By
              </Label>
              <Input
                id="verified_by"
                value={currentRecord.verified_by || ""}
                onChange={(e) => setCurrentRecord({ ...currentRecord, verified_by: e.target.value })}
                placeholder="Your name"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="compatibility_notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="compatibility_notes"
                value={currentRecord.compatibility_notes || ""}
                onChange={(e) => setCurrentRecord({ ...currentRecord, compatibility_notes: e.target.value })}
                placeholder="Any compatibility notes or warnings"
                className="col-span-3 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="test_results" className="text-right pt-2">
                Test Results
              </Label>
              <Textarea
                id="test_results"
                value={currentRecord.test_results || ""}
                onChange={(e) => setCurrentRecord({ ...currentRecord, test_results: e.target.value })}
                placeholder="Summary of test results"
                className="col-span-3 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Breaking Versions</Label>
              <div className="col-span-3 space-y-4">
                {/* List of breaking versions */}
                {breakingVersions.length > 0 ? (
                  <div className="space-y-2">
                    {breakingVersions.map((bv, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 border border-gray-700 rounded-md">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Badge className="bg-red-900/20 text-red-400 border-red-800">{bv.version}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBreakingVersion(index)}
                              className="ml-auto h-6 w-6 text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm mt-1">{bv.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">No breaking versions documented</div>
                )}

                {/* Add new breaking version */}
                <div className="flex items-end gap-2 mt-2">
                  <div className="flex-1">
                    <Label htmlFor="breaking_version" className="text-xs">
                      Version
                    </Label>
                    <Input
                      id="breaking_version"
                      value={newBreakingVersion.version}
                      onChange={(e) => setNewBreakingVersion({ ...newBreakingVersion, version: e.target.value })}
                      placeholder="e.g., 3.0.0"
                      className="h-8"
                    />
                  </div>
                  <div className="flex-[2]">
                    <Label htmlFor="breaking_reason" className="text-xs">
                      Reason
                    </Label>
                    <Input
                      id="breaking_reason"
                      value={newBreakingVersion.reason}
                      onChange={(e) => setNewBreakingVersion({ ...newBreakingVersion, reason: e.target.value })}
                      placeholder="Why this version breaks your project"
                      className="h-8"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={addBreakingVersion}
                    disabled={!newBreakingVersion.version || !newBreakingVersion.reason}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveCompatibilityRecord} disabled={!currentRecord.package_name || loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
