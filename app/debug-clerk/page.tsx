"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { useState } from "react"

export default function DebugClerk() {
  const { isLoaded: isAuthLoaded, userId, sessionId } = useAuth()
  const { isLoaded: isUserLoaded, user } = useUser()
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testClerk = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-clerk")
      const data = await response.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Clerk Debug Page</h1>

      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
        <p>Auth Loaded: {isAuthLoaded ? "Yes" : "No"}</p>
        <p>User Loaded: {isUserLoaded ? "Yes" : "No"}</p>
        <p>User ID: {userId || "Not authenticated"}</p>
        <p>Session ID: {sessionId || "No active session"}</p>
      </div>

      {isUserLoaded && user && (
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">User Information</h2>
          <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
          <p>
            Name: {user.firstName} {user.lastName}
          </p>
          <p>Created: {new Date(user.createdAt).toLocaleString()}</p>
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">Test Clerk API</h2>
        <button
          onClick={testClerk}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test Clerk Connection"}
        </button>
        {testResult && <pre className="mt-4 p-4 bg-gray-900 rounded overflow-auto max-h-60">{testResult}</pre>}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Make sure your Clerk environment variables are correctly set</li>
          <li>Check that your domain is added to the allowed domains in your Clerk dashboard</li>
          <li>Clear your browser cache and cookies</li>
          <li>Check the browser console for any CSP or CORS errors</li>
          <li>Verify that your Clerk webhook is properly configured</li>
        </ul>
      </div>
    </div>
  )
}
