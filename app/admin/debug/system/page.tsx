import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, Server, Database, Globe } from "lucide-react"

export default function SystemDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">System Information</h1>

      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>System Debug</AlertTitle>
        <AlertDescription>This page displays system information and configuration details.</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Runtime Information
            </CardTitle>
            <CardDescription>Details about the server environment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Node.js Version:</span>
                <span className="text-gray-500">v18.x (Next.js Runtime)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Platform:</span>
                <span className="text-gray-500">Vercel</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Environment:</span>
                <span className="text-gray-500">Production</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Information
            </CardTitle>
            <CardDescription>Database connection details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Database Type:</span>
                <span className="text-gray-500">PostgreSQL (Supabase)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Connection Status:</span>
                <span className="text-green-500">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Network Information
            </CardTitle>
            <CardDescription>Network configuration and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">API Endpoints:</span>
                <span className="text-gray-500">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">CORS Configuration:</span>
                <span className="text-gray-500">Configured for production</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">External Services:</span>
                <span className="text-gray-500">Supabase, Clerk</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
