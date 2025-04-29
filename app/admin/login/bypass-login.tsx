"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BypassLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const bypassLogin = async () => {
    if (!email || !password) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Use the admin API to bypass login
      const response = await fetch("/api/admin/bypass-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`Error: ${data.message || "Login failed"}`)
      } else {
        setResult("Login successful! Redirecting...")
        setTimeout(() => {
          router.push("/admin")
          router.refresh()
        }, 1000)
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
        <h4 className="text-sm font-medium mb-4">Emergency Bypass Login</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bypass-email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <Input
                id="bypass-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="bg-gray-900 border-gray-700"
              />
            </div>
            <div>
              <label htmlFor="bypass-password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <Input
                id="bypass-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="bg-gray-900 border-gray-700"
              />
            </div>
          </div>

          <Button onClick={bypassLogin} disabled={loading || !email || !password} variant="outline" size="sm">
            {loading ? "Logging in..." : "Emergency Bypass Login"}
          </Button>

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
        <p>
          <strong>Warning:</strong> This is an emergency bypass that skips the normal authentication flow. Use only when
          regular login methods fail.
        </p>
      </div>
    </div>
  )
}
