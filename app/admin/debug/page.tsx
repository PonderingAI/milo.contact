import Link from "next/link"
import { Database, Server, FileText, AlertTriangle, Bug, FileImage, Camera } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Debug Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database Debug Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Diagnostics
            </CardTitle>
            <CardDescription>Inspect database tables, run queries, and diagnose connection issues</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              View database structure, check table existence, and run diagnostic queries to troubleshoot database
              issues.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/debug/database" className="w-full">
              <Button variant="default" className="w-full">
                Open Database Debug
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Client Debug Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Client Debug
            </CardTitle>
            <CardDescription>Debug client-side issues and browser-specific problems</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Inspect client-side state, check browser compatibility, and diagnose rendering issues.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/debug-client" className="w-full">
              <Button variant="default" className="w-full">
                Open Client Debug
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* System Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>View system status, environment variables, and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Check system health, environment configuration, and runtime information.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/debug/system" className="w-full">
              <Button variant="default" className="w-full">
                View System Info
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Error Logs Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Error Logs
            </CardTitle>
            <CardDescription>View application error logs and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Browse recent errors, warnings, and system messages to diagnose issues.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/debug/logs" className="w-full">
              <Button variant="default" className="w-full">
                View Logs
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Project Media Debugger Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Project Media Debugger
            </CardTitle>
            <CardDescription>Debug video and BTS image issues</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Diagnose issues with project videos and BTS images, check field values and data structure.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/debug/project-media" className="w-full">
              <Button variant="default" className="w-full">
                Open Media Debugger
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* RPC Functions Debug Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              RPC Functions
            </CardTitle>
            <CardDescription>Manage and debug database RPC functions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Create, test, and troubleshoot database RPC functions used by the application.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/api/setup-rpc-functions" className="w-full">
              <Button variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
                Fix RPC Functions
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* BTS Images Debug Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              BTS Images Debugger
            </CardTitle>
            <CardDescription>Debug behind-the-scenes image functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Comprehensive testing tool for BTS images creation, API calls, and database operations. Includes step-by-step debugging and error analysis.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/debug/bts" className="w-full">
              <Button variant="default" className="w-full">
                Open BTS Debugger
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
