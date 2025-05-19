import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, AlertTriangle, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LogsDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">System Logs</h1>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Log Viewer</AlertTitle>
        <AlertDescription>
          View and analyze system logs to diagnose issues. Logs are refreshed automatically every 30 seconds.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Logs</h2>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Logs
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All System Logs</CardTitle>
              <CardDescription>Showing all log entries from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <LogEntry
                  type="error"
                  message="Error checking tables: TypeError: NetworkError when attempting to fetch resource."
                  source="/api/check-tables"
                  time="12 minutes ago"
                />
                <LogEntry
                  type="error"
                  message="Could not find the function public.get_all_media without parameters in the schema cache"
                  source="/components/admin/unified-media-library.tsx"
                  time="12 minutes ago"
                />
                <LogEntry
                  type="warning"
                  message="Image loading failed for resource at: /storage/v1/object/public/media/uploads/image.webp"
                  source="/components/admin/unified-media-library.tsx"
                  time="15 minutes ago"
                />
                <LogEntry
                  type="info"
                  message="User authenticated successfully"
                  source="/api/auth"
                  time="20 minutes ago"
                />
                <LogEntry
                  type="info"
                  message="Media library initialized"
                  source="/components/admin/unified-media-library.tsx"
                  time="22 minutes ago"
                />
                <LogEntry
                  type="success"
                  message="Database connection established"
                  source="/lib/supabase-server.ts"
                  time="25 minutes ago"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
              <CardDescription>Showing error logs from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <LogEntry
                  type="error"
                  message="Error checking tables: TypeError: NetworkError when attempting to fetch resource."
                  source="/api/check-tables"
                  time="12 minutes ago"
                />
                <LogEntry
                  type="error"
                  message="Could not find the function public.get_all_media without parameters in the schema cache"
                  source="/components/admin/unified-media-library.tsx"
                  time="12 minutes ago"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warnings">
          <Card>
            <CardHeader>
              <CardTitle>Warning Logs</CardTitle>
              <CardDescription>Showing warning logs from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <LogEntry
                  type="warning"
                  message="Image loading failed for resource at: /storage/v1/object/public/media/uploads/image.webp"
                  source="/components/admin/unified-media-library.tsx"
                  time="15 minutes ago"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Info Logs</CardTitle>
              <CardDescription>Showing info logs from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <LogEntry
                  type="info"
                  message="User authenticated successfully"
                  source="/api/auth"
                  time="20 minutes ago"
                />
                <LogEntry
                  type="info"
                  message="Media library initialized"
                  source="/components/admin/unified-media-library.tsx"
                  time="22 minutes ago"
                />
                <LogEntry
                  type="success"
                  message="Database connection established"
                  source="/lib/supabase-server.ts"
                  time="25 minutes ago"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LogEntry({ type, message, source, time }) {
  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <InfoIcon className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <InfoIcon className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="p-3 border border-gray-700 rounded-md">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          <div className="flex justify-between mt-1 text-sm text-gray-400">
            <span>{source}</span>
            <span>{time}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
