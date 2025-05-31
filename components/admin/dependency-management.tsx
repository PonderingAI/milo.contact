"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import DependencyScanner from "@/components/admin/dependency-scanner"
import AddPackageDialog from "@/components/admin/add-package-dialog"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Loader2,
  Package,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

interface DependencyStats {
  count: number
  outdated: number
  vulnerabilities: number
  lastScan: string | null
  updateMode: string
  autoUpdateEnabled: boolean
}

export default function DependencyManagement() {
  // State for dependency data
  const [dependencies, setDependencies] = useState<any[]>([])
  const [stats, setStats] = useState<DependencyStats>({
    count: 0,
    outdated: 0,
    vulnerabilities: 0,
    lastScan: null,
    updateMode: "conservative",
    autoUpdateEnabled: false,
  })
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [setupRequired, setSetupRequired] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Fetch dependencies and stats
  useEffect(() => {
    const fetchDependencies = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch("/api/dependencies/list")
        const data = await response.json()
        
        if (!response.ok) {
          if (response.status === 404 && data.error?.includes("table does not exist")) {
            setSetupRequired(true)
            throw new Error("Dependency tables not set up")
          }
          throw new Error(data.message || data.error || "Failed to fetch dependencies")
        }
        
        setDependencies(data.dependencies || [])
        setStats({
          count: data.count || 0,
          outdated: data.dependencies?.filter(d => d.current_version !== d.latest_version)?.length || 0,
          vulnerabilities: data.dependencies?.filter(d => d.has_security_update)?.length || 0,
          lastScan: data.dependencies?.[0]?.updated_at || null,
          updateMode: data.settings?.update_mode || "conservative",
          autoUpdateEnabled: data.settings?.auto_update_enabled || false,
        })
        setSetupRequired(false)
      } catch (err) {
        console.error("Error fetching dependencies:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch dependencies")
        
        // Check if this is a setup issue
        if (err instanceof Error && err.message.includes("not set up")) {
          setSetupRequired(true)
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchDependencies()
  }, [refreshTrigger])
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }
  
  // Handle dependency scan completion
  const handleScanComplete = () => {
    toast({
      title: "Scan Complete",
      description: "Dependency scan completed successfully",
    })
    handleRefresh()
  }
  
  // Handle package added
  const handlePackageAdded = () => {
    toast({
      title: "Package Added",
      description: "Package added successfully to the project",
    })
    handleRefresh()
  }
  
  // Handle setup completion
  const handleSetupComplete = async () => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/dependencies/setup-tables", {
        method: "POST",
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || data.error || "Failed to set up dependency tables")
      }
      
      toast({
        title: "Setup Complete",
        description: "Dependency management system is now ready to use",
      })
      
      // Trigger a scan to populate the tables
      const scanResponse = await fetch("/api/dependencies/fallback-scan", {
        method: "POST",
      })
      
      if (!scanResponse.ok) {
        const scanData = await scanResponse.json()
        console.warn("Initial scan warning:", scanData.message || scanData.error)
      }
      
      setSetupRequired(false)
      handleRefresh()
    } catch (err) {
      console.error("Error setting up dependency system:", err)
      toast({
        title: "Setup Failed",
        description: err instanceof Error ? err.message : "Failed to set up dependency tables",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Setup required view
  if (setupRequired) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-yellow-500" />
              Dependency Management Setup Required
            </CardTitle>
            <CardDescription>
              The dependency management system needs to be initialized before you can use it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The dependency management database tables are not set up. Click the button below to initialize the system.
              </AlertDescription>
            </Alert>
            <p className="text-sm mb-4">
              This will create the necessary database tables to track and manage your project dependencies.
              Once set up, the system will automatically scan your package.json and populate the database.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSetupComplete} 
              disabled={loading}
              className="flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Initialize Dependency System
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  // Loading state
  if (loading && !dependencies.length) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Skeleton className="h-6 w-6 mr-2 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Error state
  if (error && !setupRequired) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Error Loading Dependencies
            </CardTitle>
            <CardDescription>
              There was a problem loading the dependency management system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    const date = new Date(dateString)
    return date.toLocaleString()
  }
  
  // Get security status
  const getSecurityStatus = () => {
    if (stats.vulnerabilities > 0) {
      return { icon: <ShieldAlert className="h-8 w-8 text-red-500" />, text: "Vulnerabilities Found", variant: "destructive" }
    }
    return { icon: <ShieldCheck className="h-8 w-8 text-green-500" />, text: "No Vulnerabilities", variant: "default" }
  }
  
  const securityStatus = getSecurityStatus()
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Package className="h-6 w-6 mr-2" />
            Dependency Management
          </h1>
          <p className="text-muted-foreground">
            Manage your project dependencies and keep them secure and up-to-date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddPackageDialog onPackageAdded={handlePackageAdded} />
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Quick Fix for Svix */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-500" />
                Fix Webhook Security
              </CardTitle>
              <CardDescription>
                Add the svix package to enable secure webhook signature verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Your webhook handler is currently using a fallback verification method because the svix package is not installed. 
                Adding this package will enable cryptographically secure webhook signature verification.
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  Security Enhancement
                </Badge>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Quick Fix
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <AddPackageDialog 
                defaultPackage="svix" 
                onPackageAdded={handlePackageAdded}
                triggerButton={
                  <Button className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Add Svix Package
                  </Button>
                }
              />
            </CardFooter>
          </Card>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <PackageOpen className="h-8 w-8 mr-3 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{stats.count}</div>
                    <p className="text-xs text-muted-foreground">Tracked packages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outdated Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-8 w-8 mr-3 text-amber-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.outdated}</div>
                    <p className="text-xs text-muted-foreground">Updates available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {securityStatus.icon}
                  <div className="ml-3">
                    <div className="text-2xl font-bold">{stats.vulnerabilities}</div>
                    <p className="text-xs text-muted-foreground">{securityStatus.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PackageCheck className="h-5 w-5 mr-2" />
                System Information
              </CardTitle>
              <CardDescription>
                Current status of your dependency management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Last Scan</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(stats.lastScan)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Update Mode</h3>
                    <div className="flex items-center">
                      <Badge variant="outline" className={
                        stats.updateMode === "aggressive" 
                          ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200" 
                          : stats.updateMode === "conservative"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : "bg-gray-100 dark:bg-gray-800"
                      }>
                        {stats.updateMode.charAt(0).toUpperCase() + stats.updateMode.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Auto-Update</h3>
                    <Badge variant={stats.autoUpdateEnabled ? "default" : "outline"}>
                      {stats.autoUpdateEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Database Status</h3>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleRefresh} className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <AddPackageDialog 
                onPackageAdded={handlePackageAdded}
                triggerButton={
                  <Button className="flex items-center">
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Add Package
                  </Button>
                }
              />
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="scanner" className="space-y-4">
          <DependencyScanner onScanComplete={handleScanComplete} />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Fallback Scanner
              </CardTitle>
              <CardDescription>
                Manually scan your package.json and populate the dependency database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                If the standard scanner isn't working, you can use this fallback method to read your 
                package.json file directly and add all dependencies to the database.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    setLoading(true)
                    const response = await fetch("/api/dependencies/fallback-scan", {
                      method: "POST",
                    })
                    
                    if (!response.ok) {
                      const data = await response.json()
                      throw new Error(data.message || data.error || "Fallback scan failed")
                    }
                    
                    const data = await response.json()
                    toast({
                      title: "Fallback Scan Complete",
                      description: data.message || "Scan completed successfully",
                    })
                    handleRefresh()
                  } catch (err) {
                    console.error("Error in fallback scan:", err)
                    toast({
                      title: "Scan Failed",
                      description: err instanceof Error ? err.message : "Failed to perform fallback scan",
                      variant: "destructive",
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Run Fallback Scan
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="packages" className="space-y-4">
          {dependencies.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Dependencies Found</CardTitle>
                <CardDescription>
                  No dependencies have been detected in your project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Run a dependency scan to detect and track your project's dependencies.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleRefresh} 
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Project Dependencies
                </CardTitle>
                <CardDescription>
                  Showing {dependencies.length} tracked dependencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Package</th>
                        <th className="text-left p-3 font-medium text-sm">Current</th>
                        <th className="text-left p-3 font-medium text-sm">Latest</th>
                        <th className="text-left p-3 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependencies.slice(0, 10).map((dep) => (
                        <tr key={dep.id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{dep.name}</div>
                            {dep.description && (
                              <div className="text-xs text-muted-foreground">{dep.description.slice(0, 60)}{dep.description.length > 60 ? '...' : ''}</div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-sm">{dep.current_version}</td>
                          <td className="p-3 font-mono text-sm">{dep.latest_version || 'unknown'}</td>
                          <td className="p-3">
                            {dep.has_security_update ? (
                              <Badge variant="destructive" className="flex items-center">
                                <ShieldAlert className="h-3 w-3 mr-1" />
                                Security Update
                              </Badge>
                            ) : dep.current_version !== dep.latest_version ? (
                              <Badge variant="secondary" className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Update Available
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Up to Date
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dependencies.length > 10 && (
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    Showing 10 of {dependencies.length} dependencies
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleRefresh} className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <AddPackageDialog onPackageAdded={handlePackageAdded} />
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
