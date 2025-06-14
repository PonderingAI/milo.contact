"use client"

import { useUser, useAuth } from "@clerk/nextjs"
import { useState } from "react"

export default function DebugPage() {
  const { isLoaded: isUserLoaded, user } = useUser()
  const { isLoaded: isAuthLoaded, userId, sessionId } = useAuth()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">Clerk Debug Page</h1>

      <div className="space-y-8">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
          {!isAuthLoaded ? (
            <p>Loading auth data...</p>
          ) : userId ? (
            <div className="space-y-2">
              <p className="text-green-500">✓ Authenticated</p>
              <p>
                <strong>User ID:</strong> {userId}
              </p>
              <p>
                <strong>Session ID:</strong> {sessionId}
              </p>
            </div>
          ) : (
            <p className="text-red-500">✗ Not authenticated</p>
          )}
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">User Data</h2>
          {!isUserLoaded ? (
            <p>Loading user data...</p>
          ) : user ? (
            <div className="space-y-2">
              <p>
                <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
              </p>
              <p>
                <strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Last Updated:</strong> {new Date(user.updatedAt).toLocaleString()}
              </p>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Raw User Data:</h3>
                <pre className="bg-gray-800 p-4 rounded overflow-auto max-h-60 text-xs">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p>No user data available</p>
          )}
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
          <p>
            <strong>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</strong>{" "}
            {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "✓ Set" : "✗ Not set"}
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Common Issues:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check that your Clerk keys are correctly set in environment variables</li>
              <li>Verify that your application domain is added to Clerk's allowed domains</li>
              <li>Ensure your browser allows cookies and JavaScript</li>
              <li>Try clearing your browser cache and cookies</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-4">
          <a href="/sign-in" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block">
            Go to Sign In
          </a>
          <a href="/sign-up" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block">
            Go to Sign Up
          </a>
          <a href="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
