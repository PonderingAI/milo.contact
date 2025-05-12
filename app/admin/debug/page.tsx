import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Bug, AlertTriangle, Terminal, Server } from "lucide-react"

export default function DebugPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bug className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Debug Tools</h1>
      </div>

      <p className="text-gray-400 mb-6">
        These tools are designed to help diagnose and troubleshoot issues with your application.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/debug/database" className="block">
          <Card className="h-full transition-all hover:bg-gray-800/50">
            <CardHeader>
              <Database className="h-8 w-8 mb-2 text-blue-500" />
              <CardTitle>Database Diagnostics</CardTitle>
              <CardDescription>Test database connections and check table structures</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Run diagnostics on your Supabase connection, check tables, and view database structure.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/debug-client" className="block">
          <Card className="h-full transition-all hover:bg-gray-800/50">
            <CardHeader>
              <Terminal className="h-8 w-8 mb-2 text-green-500" />
              <CardTitle>Client Debug</CardTitle>
              <CardDescription>Debug client-side issues and environment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Check client-side environment variables, browser information, and runtime details.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/debug/system" className="block">
          <Card className="h-full transition-all hover:bg-gray-800/50">
            <CardHeader>
              <Server className="h-8 w-8 mb-2 text-purple-500" />
              <CardTitle>System Information</CardTitle>
              <CardDescription>View system and environment details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Check server information, runtime environment, and deployment details.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/debug/logs" className="block">
          <Card className="h-full transition-all hover:bg-gray-800/50">
            <CardHeader>
              <AlertTriangle className="h-8 w-8 mb-2 text-yellow-500" />
              <CardTitle>Error Logs</CardTitle>
              <CardDescription>View application error logs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Browse and search through application error logs to diagnose issues.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
