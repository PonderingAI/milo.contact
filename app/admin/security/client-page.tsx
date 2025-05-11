"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { FourStateToggle } from "@/components/ui/four-state-toggle"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, RefreshCw, Save } from "lucide-react"

export default function SecurityClientPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalUpdateMode, setGlobalUpdateMode] = useState("conservative")
  const [widgets, setWidgets] = useState([])
  const [layoutChanged, setLayoutChanged] = useState(false)

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("securityDashboardState")
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        if (parsedState.activeTab) {
          setActiveTab(parsedState.activeTab)
        }
        if (parsedState.globalUpdateMode) {
          setGlobalUpdateMode(parsedState.globalUpdateMode)
        }
      }
    } catch (error) {
      console.error("Error loading dashboard state:", error)
    }
  }, [])

  // Save state to localStorage
  const saveDashboardState = () => {
    try {
      const state = {
        activeTab,
        globalUpdateMode,
      }
      localStorage.setItem("securityDashboardState", JSON.stringify(state))
      setLayoutChanged(false)
      toast({
        title: "Layout saved",
        description: "Your dashboard layout has been saved",
      })
    } catch (error) {
      console.error("Error saving dashboard state:", error)
      setError("Failed to save dashboard state")
    }
  }

  const updateGlobalMode = async (value: string) => {
    try {
      setGlobalUpdateMode(value)

      // Save to localStorage
      const state = {
        activeTab,
        globalUpdateMode: value,
      }
      localStorage.setItem("securityDashboardState", JSON.stringify(state))

      toast({
        title: "Update Mode Changed",
        description: `Global update mode set to ${value}`,
      })
    } catch (err: any) {
      setError(`Error updating settings: ${err.message}`)
      console.error("Error updating settings:", err)
    }
  }

  const handleRefresh = () => {
    setLoading(true)

    // Simulate refresh
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Dashboard refreshed",
        description: "Your dashboard has been refreshed",
      })
    }, 1000)
  }

  return (
    <div className="container mx-auto p-6 bg-gray-950 text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Security Center</h1>
        <div className="flex space-x-2">
          {layoutChanged && (
            <Button onClick={saveDashboardState} variant="outline" size="sm" className="border-gray-700">
              <Save className="mr-2 h-4 w-4" />
              Save Layout
            </Button>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm" className="border-gray-700" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Update Policy Widget */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Update Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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

                  <div className="text-sm text-gray-300 space-y-2 mt-4 bg-gray-900/40 p-3 rounded-md">
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
                </div>
              </CardContent>
            </Card>

            {/* Security Score Widget */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col h-full justify-between">
                  <div className="text-3xl font-bold">85%</div>
                  <div className="mt-2">
                    <Progress value={85} className="h-2" />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Last scan: Today at 10:30 AM</p>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerabilities Widget */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold">3</div>
                    <Badge variant="outline" className="ml-2 bg-red-900/20 text-red-400 border-red-800">
                      Action needed
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Detected security issues</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setActiveTab("dependencies")
                    }}
                  >
                    View Issues
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                  <Button variant="outline" size="sm" className="border-gray-700">
                    Scan Dependencies
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-700">
                    Reset Settings
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <Input placeholder="Search dependencies..." className="w-full bg-gray-800 border-gray-700" />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="default" size="sm" className="border-gray-700">
                    All
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800">
                    Dependabot
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-700">
                    Security
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-700">
                    Outdated
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="mt-4">Loading dependencies...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
