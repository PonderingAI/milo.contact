"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DatabaseSetupPopup from "@/components/admin/database-setup-popup"
import EnhancedDatabaseManager from "@/components/admin/enhanced-database-manager"

export default function DatabaseClientPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"enhanced" | "legacy">("enhanced")

  useEffect(() => {
    // Force localStorage to not remember the database setup completion
    // This ensures the database management page always shows tables
    try {
      localStorage.removeItem("database_setup_completed")
    } catch (e) {
      console.error("Could not access localStorage", e)
    }

    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "enhanced" | "legacy")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="enhanced">Enhanced Manager</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Manager</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings className="h-4 w-4" />
            Database Management System
          </div>
        </div>

        <TabsContent value="enhanced" className="mt-6">
          <EnhancedDatabaseManager />
        </TabsContent>

        <TabsContent value="legacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Legacy Database Management
              </CardTitle>
              <CardContent>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is the legacy database management interface. 
                    We recommend using the Enhanced Manager for better functionality.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </CardHeader>
            <CardContent>
              {/* Use the DatabaseSetupPopup component directly in stationary mode */}
              <div className="mt-4">
                <DatabaseSetupPopup
                  requiredSections={["all"]}
                  adminOnly={false}
                  title="Database Tables Management"
                  description="View, create, and manage database tables for your application."
                  isStationary={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
