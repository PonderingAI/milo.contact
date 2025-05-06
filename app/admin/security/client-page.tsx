"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Package, Shield, RefreshCw, Lock, AlertTriangle } from "lucide-react"

export default function SecurityClientPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [dependencies, setDependencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false)
  const [conservativeMode, setConservativeMode] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

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

  const fetchDependencies = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dependencies")
      if (!response.ok) {
        throw new Error("Failed to fetch dependencies")
      }
      const data = await response.json()
      setDependencies(data.dependencies || [])
      setAutoUpdateEnabled(data.autoUpdateEnabled || false)
      setConservativeMode(data.conservativeMode || true)
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching dependencies:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleAutoUpdate = async () => {
    try {
      const newValue = !autoUpdateEnabled
      setAutoUpdateEnabled(newValue)
      await fetch("/api/dependencies/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ autoUpdateEnabled: newValue, conservativeMode }),
      })
    } catch (err: any) {
      setError(err.message)
      console.error("Error updating settings:", err)
    }
  }

  const toggleConservativeMode = async () => {
    try {
      const newValue = !conservativeMode
      setConservativeMode(newValue)
      await fetch("/api/dependencies/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ autoUpdateEnabled, conservativeMode: newValue }),
      })
    } catch (err: any) {
      setError(err.message)
      console.error("Error updating settings:", err)
    }
  }

  const toggleLock = async (packageName: string, locked: boolean) => {
    try {
      const updatedDependencies = dependencies.map((dep) => {
        if (dep.name === packageName) {
          return { ...dep, locked: !locked }
        }
        return dep
      })
      setDependencies(updatedDependencies)

      await fetch("/api/dependencies/lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageName, locked: !locked }),
      })
    } catch (err: any) {
      setError(err.message)
      console.error("Error toggling lock:", err)
      // Revert the UI change if the API call fails
      fetchDependencies()
    }
  }

  const updatePackage = async (packageName: string) => {
    try {
      const updatedDependencies = dependencies.map((dep) => {
        if (dep.name === packageName) {
          return { ...dep, updating: true }
        }
        return dep
      })
      setDependencies(updatedDependencies)

      await fetch("/api/dependencies/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageName }),
      })

      // Refresh the dependencies list
      fetchDependencies()
    } catch (err: any) {
      setError(err.message)
      console.error("Error updating package:", err)
      // Revert the UI change if the API call fails
      fetchDependencies()
    }
  }

  const runAutoUpdates = async () => {
    try {
      setLoading(true)
      await fetch("/api/dependencies/auto-update", {
        method: "POST",
      })
      fetchDependencies()
    } catch (err: any) {
      setError(err.message)
      console.error("Error running auto updates:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "outdated") return dep.outdated
      if (filter === "locked") return dep.locked
      if (filter === "security") return dep.hasSecurityIssue
      return true
    })
    .filter(
      (dep) =>
        dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  // Mock data for the security overview
  const securityStats = {
    vulnerabilities: 3,
    outdatedPackages: dependencies.filter((d) => d.outdated).length || 5,
    securityScore: 85,
    lastScan: new Date().toLocaleDateString(),
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Center</h1>
        <Button onClick={fetchDependencies} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6 flex items-center">
          <AlertCircle className="mr-2" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto text-white hover:bg-red-600"
          >
            Dismiss
          </Button>
        </div>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{securityStats.securityScore}%</div>
                <p className="text-sm text-gray-500">Last scan: {securityStats.lastScan}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Vulnerabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{securityStats.vulnerabilities}</div>
                <p className="text-sm text-gray-500">Detected issues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Outdated Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{securityStats.outdatedPackages}</div>
                <p className="text-sm text-gray-500">Need updates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Auto Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{autoUpdateEnabled ? "Enabled" : "Disabled"}</div>
                <p className="text-sm text-gray-500">{conservativeMode ? "Conservative mode" : "Standard mode"}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Recommendations</CardTitle>
                <CardDescription>Actions to improve your site security</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Update vulnerable packages</p>
                      <p className="text-sm text-gray-500">3 packages have known security vulnerabilities</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setActiveTab("dependencies")
                          setFilter("security")
                        }}
                      >
                        View Packages
                      </Button>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Enable automatic security updates</p>
                      <p className="text-sm text-gray-500">Stay protected with automatic security patches</p>
                      <div className="flex items-center mt-2">
                        <Switch
                          id="auto-security-updates"
                          checked={autoUpdateEnabled && conservativeMode}
                          onCheckedChange={() => {
                            if (!autoUpdateEnabled) {
                              setAutoUpdateEnabled(true)
                              setConservativeMode(true)
                            } else {
                              setConservativeMode(!conservativeMode)
                            }
                          }}
                        />
                        <Label htmlFor="auto-security-updates" className="ml-2">
                          {autoUpdateEnabled && conservativeMode ? "Enabled" : "Disabled"}
                        </Label>
                      </div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest security events</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Security scan completed</p>
                      <p className="text-sm text-gray-500">Today at {new Date().toLocaleTimeString()}</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Package className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Package updates available</p>
                      <p className="text-sm text-gray-500">5 packages can be updated</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-purple-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Security policy updated</p>
                      <p className="text-sm text-gray-500">Yesterday at 2:30 PM</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle>Dependency Management</CardTitle>
              <CardDescription>Manage your project dependencies and updates</CardDescription>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search dependencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                    All
                  </Button>
                  <Button
                    variant={filter === "outdated" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("outdated")}
                  >
                    Outdated
                  </Button>
                  <Button
                    variant={filter === "locked" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("locked")}
                  >
                    Locked
                  </Button>
                  <Button
                    variant={filter === "security" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("security")}
                  >
                    Security
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
                  <p className="mt-4">Loading dependencies...</p>
                </div>
              ) : dependencies.length === 0 ? (
                <div className="text-center py-8">
                  <p>No dependencies found. This could be because the dependencies table hasn't been set up yet.</p>
                  <Button className="mt-4" onClick={fetchDependencies}>
                    Retry
                  </Button>
                </div>
              ) : filteredDependencies.length === 0 ? (
                <div className="text-center py-8">
                  <p>No dependencies match your search or filter criteria.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
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
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Package</th>
                        <th className="text-left py-3 px-4">Current</th>
                        <th className="text-left py-3 px-4">Latest</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Auto Update</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDependencies.map((dep, index) => (
                        <tr key={dep.name} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="py-3 px-4">
                            <div className="font-medium">{dep.name}</div>
                            <div className="text-sm text-gray-500">{dep.description || "No description"}</div>
                          </td>
                          <td className="py-3 px-4">{dep.currentVersion}</td>
                          <td className="py-3 px-4">{dep.latestVersion}</td>
                          <td className="py-3 px-4">
                            {dep.hasSecurityIssue ? (
                              <Badge variant="destructive">Security Issue</Badge>
                            ) : dep.outdated ? (
                              <Badge variant="outline">Outdated</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Up to date
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Switch
                                id={`lock-${dep.name}`}
                                checked={!dep.locked}
                                onCheckedChange={() => toggleLock(dep.name, dep.locked)}
                              />
                              <Label htmlFor={`lock-${dep.name}`} className="ml-2">
                                {dep.locked ? (
                                  <span className="flex items-center">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </span>
                                ) : (
                                  "Auto"
                                )}
                              </Label>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              disabled={!dep.outdated || dep.updating}
                              onClick={() => updatePackage(dep.name)}
                            >
                              {dep.updating ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Updating...
                                </>
                              ) : (
                                "Update"
                              )}
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

        <TabsContent value="updates">
          <Card>
            <CardHeader>
              <CardTitle>Update Settings</CardTitle>
              <CardDescription>Configure how package updates are handled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-update" className="text-base">
                        Automatic Updates
                      </Label>
                      <p className="text-sm text-gray-500">
                        Automatically update packages when new versions are available
                      </p>
                    </div>
                    <Switch id="auto-update" checked={autoUpdateEnabled} onCheckedChange={toggleAutoUpdate} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="conservative-mode" className="text-base">
                        Conservative Mode
                      </Label>
                      <p className="text-sm text-gray-500">
                        Only automatically apply security updates, delay feature updates
                      </p>
                    </div>
                    <Switch
                      id="conservative-mode"
                      checked={conservativeMode}
                      onCheckedChange={toggleConservativeMode}
                      disabled={!autoUpdateEnabled}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Manual Updates</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Run updates manually for all non-locked packages that have updates available
                  </p>
                  <Button onClick={runAutoUpdates} disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Running Updates...
                      </>
                    ) : (
                      "Run Updates Now"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit</CardTitle>
              <CardDescription>Scan your dependencies for security vulnerabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                    <div>
                      <h3 className="font-medium text-yellow-800">Security vulnerabilities detected</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        We found 3 packages with known security vulnerabilities that should be updated.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Package</th>
                        <th className="text-left py-3 px-4">Vulnerability</th>
                        <th className="text-left py-3 px-4">Severity</th>
                        <th className="text-left py-3 px-4">Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Mock vulnerability data */}
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">lodash</div>
                          <div className="text-sm text-gray-500">4.17.15</div>
                        </td>
                        <td className="py-3 px-4">Prototype Pollution</td>
                        <td className="py-3 px-4">
                          <Badge variant="destructive">High</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm">Update to 4.17.21</Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">
                          <div className="font-medium">node-fetch</div>
                          <div className="text-sm text-gray-500">2.6.1</div>
                        </td>
                        <td className="py-3 px-4">Exposure of Sensitive Information</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            Medium
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm">Update to 2.6.7</Button>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">postcss</div>
                          <div className="text-sm text-gray-500">8.2.10</div>
                        </td>
                        <td className="py-3 px-4">Regular Expression Denial of Service</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            Medium
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm">Update to 8.4.31</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Run Security Audit</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Scan your dependencies for known security vulnerabilities
                  </p>
                  <Button>Run Security Audit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
