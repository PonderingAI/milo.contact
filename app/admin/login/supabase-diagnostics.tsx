"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SupabaseDiagnostics() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("basic")

  const runTest = async (testType: string) => {
    setLoading((prev) => ({ ...prev, [testType]: true }))

    try {
      const response = await fetch("/api/test-supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: testType }),
      })

      const data = await response.json()
      setResults((prev) => ({ ...prev, [testType]: data }))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [testType]: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [testType]: false }))
    }
  }

  const formatResult = (result: any) => {
    if (!result) return "No result"

    return <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
  }

  return (
    <div className="mt-8 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Supabase Diagnostics</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-900 mb-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Button
              onClick={() => runTest("basic")}
              disabled={loading.basic}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              {loading.basic ? "Testing..." : "Test Basic Connection"}
            </Button>

            {results.basic && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${results.basic.success ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>{results.basic.success ? "Connection Successful" : "Connection Failed"}</span>
                </div>
                {formatResult(results.basic)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <div>
            <Button
              onClick={() => runTest("auth")}
              disabled={loading.auth}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              {loading.auth ? "Testing..." : "Test Auth Configuration"}
            </Button>

            {results.auth && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${results.auth.success ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>{results.auth.success ? "Auth Configuration OK" : "Auth Configuration Error"}</span>
                </div>
                {formatResult(results.auth)}
              </div>
            )}
          </div>

          <div>
            <Button
              onClick={() => runTest("users")}
              disabled={loading.users}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              {loading.users ? "Testing..." : "Test Users Access"}
            </Button>

            {results.users && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${results.users.success ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>{results.users.success ? "Users Access OK" : "Users Access Error"}</span>
                </div>
                {formatResult(results.users)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <div>
            <Button
              onClick={() => runTest("roles")}
              disabled={loading.roles}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              {loading.roles ? "Testing..." : "Test Roles Table Access"}
            </Button>

            {results.roles && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${results.roles.success ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>{results.roles.success ? "Roles Table Access OK" : "Roles Table Access Error"}</span>
                </div>
                {formatResult(results.roles)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div>
            <Button
              onClick={() => runTest("storage")}
              disabled={loading.storage}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              {loading.storage ? "Testing..." : "Test Storage Access"}
            </Button>

            {results.storage && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${results.storage.success ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>{results.storage.success ? "Storage Access OK" : "Storage Access Error"}</span>
                </div>
                {formatResult(results.storage)}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-gray-400 mt-4">
        <p>These tests check various aspects of your Supabase configuration:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>Basic: Tests basic connectivity to your Supabase instance</li>
          <li>Auth: Tests authentication configuration and session management</li>
          <li>Data: Tests database access permissions for tables</li>
          <li>Storage: Tests access to storage buckets and files</li>
        </ul>
      </div>
    </div>
  )
}
