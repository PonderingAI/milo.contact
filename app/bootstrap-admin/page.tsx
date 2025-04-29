"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"

export default function BootstrapAdminPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [secret, setSecret] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
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
        setError(data.error || "Something went wrong")
      } else {
        setSuccess(data.message || "Admin role assigned successfully")
        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
          router.push("/admin")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return <div className="p-4">Loading...</div>
  }

  if (!isSignedIn) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-4">You need to sign in before accessing this page.</p>
        <Link
          href={`/sign-in?redirect_url=${encodeURIComponent("/bootstrap-admin")}`}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Bootstrap Admin Access</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p>
          Signed in as: <strong>{user.primaryEmailAddress?.emailAddress}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
            Bootstrap Secret
          </label>
          <input
            type="password"
            id="secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Assign Admin Role"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Website
        </Link>
      </div>
    </div>
  )
}
