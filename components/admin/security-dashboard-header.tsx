"use client"
import { Shield, RefreshCw, Settings, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SecurityDashboardHeaderProps {
  onRefresh?: () => void
  onSaveLayout?: () => void
  onSettings?: () => void
  isLayoutChanged?: boolean
  isLoading?: boolean
}

export default function SecurityDashboardHeader({
  onRefresh,
  onSaveLayout,
  onSettings,
  isLayoutChanged = false,
  isLoading = false,
}: SecurityDashboardHeaderProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="h-6 w-6 mr-2 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          </div>

          <div className="flex space-x-2">
            {isLayoutChanged && onSaveLayout && (
              <Button onClick={onSaveLayout} variant="outline" size="sm" className="border-gray-700">
                <Save className="mr-2 h-4 w-4" />
                Save Layout
              </Button>
            )}

            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm" className="border-gray-700" disabled={isLoading}>
                {isLoading ? (
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
            )}

            {onSettings && (
              <Button onClick={onSettings} variant="outline" size="sm" className="border-gray-700">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
