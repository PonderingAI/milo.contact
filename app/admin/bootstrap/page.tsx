"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function BootstrapAdmin() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [secret, setSecret] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/bootstrap-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to bootstrap admin")
      }

      setSuccess(data.message || "Admin role assigned successfully")

      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        router.push("/admin")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg text-white">
          <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
          <p className="mb-4">You need to sign in to set up the admin account.</p>
          <Link
            href="/sign-in?redirect_url=/admin/bootstrap"
            className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Bootstrap Admin Access</h1>

        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <p className="text-sm mb-2">You are signed in as:</p>
          <p className="font-medium">{user.emailAddresses[0].emailAddress}</p>
        </div>

        <p className="mb-4 text-sm text-gray-400">
          This page allows you to set up the first admin user. You will need the bootstrap secret to proceed.
        </p>

        {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm">{error}</div>}

        {success && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-md text-sm">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="secret" className="block text-sm font-medium mb-1">
              Bootstrap Secret
            </label>
            <input
              type="password"
              id="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Set as Admin"}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>If you don't know the bootstrap secret, please contact the site owner.</p>
        </div>
      </div>
    </div>
  )
}
