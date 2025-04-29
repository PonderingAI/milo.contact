"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function AccountTools() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const createAccount = async () => {
    if (!email || !password) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Try to create a new account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(`Error: ${error.message}`)
      } else if (data.user) {
        setResult(
          `Account creation initiated for ${email}. User ID: ${data.user.id}. ${
            data.user.email_confirmed_at
              ? "Email is already confirmed."
              : "Please check your email to confirm your account."
          }`,
        )
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const forceCreateAccount = async () => {
    if (!email || !password) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Use the admin API to create an account
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Error: ${data.message || "Failed to create account"}`)
      } else {
        setResult(`Account created successfully! User ID: ${data.user?.id}`)
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    if (!email || !password) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Use the admin API to update password
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Error: ${data.message || "Failed to update password"}`)
      } else {
        setResult(`Password updated successfully for ${email}!`)
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const confirmUser = async () => {
    if (!email) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Use the admin API to confirm a user
      const response = await fetch("/api/admin/confirm-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Error: ${data.message || "Failed to confirm user"}`)
      } else {
        setResult(`User ${email} confirmed successfully!`)
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-4">Account Management</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-gray-900 border-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={createAccount} disabled={loading || !email || !password} variant="outline" size="sm">
              {loading ? "Creating..." : "Create Account"}
            </Button>
            <Button onClick={forceCreateAccount} disabled={loading || !email || !password} variant="outline" size="sm">
              {loading ? "Creating..." : "Force Create (Admin)"}
            </Button>
            <Button onClick={updatePassword} disabled={loading || !email || !password} variant="outline" size="sm">
              {loading ? "Updating..." : "Update Password"}
            </Button>
            <Button onClick={confirmUser} disabled={loading || !email} variant="outline" size="sm">
              {loading ? "Confirming..." : "Force Confirm User"}
            </Button>
          </div>

          {error && (
            <Alert className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-green-900/20 border-green-800">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>{result}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400">
        <p>Account Management Tips:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>
            <strong>Create Account</strong>: Normal signup process that sends a confirmation email
          </li>
          <li>
            <strong>Force Create</strong>: Creates an account using admin API, bypassing email confirmation
          </li>
          <li>
            <strong>Update Password</strong>: Directly updates a user's password using admin API
          </li>
          <li>
            <strong>Force Confirm</strong>: Marks a user as confirmed without requiring email verification
          </li>
        </ul>
      </div>
    </div>
  )
}
