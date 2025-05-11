"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Processing authentication...")
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(`[Auth Callback] ${message}`)
    setLogs((prev) => [...prev, message])
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        addLog("Auth callback triggered")
        addLog(`URL: ${window.location.href}`)

        // Log all search params for debugging
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })
        addLog(`URL params: ${JSON.stringify(params)}`)

        const supabase = getSupabaseBrowserClient()
        addLog("Supabase client initialized")

        // Check if this is a password reset
        const isPasswordReset = searchParams.get("type") === "recovery"
        if (isPasswordReset) {
          addLog("This is a password reset flow")
          setMessage("Processing password reset...")
        }

        // Check if this is a signup confirmation
        const isSignup = searchParams.get("type") === "signup"
        if (isSignup) {
          addLog("This is a signup confirmation flow")
          setMessage("Confirming your account...")
        }

        // Exchange the code for a session
        const code = searchParams.get("code")

        if (code) {
          addLog(`Found code parameter: ${code.substring(0, 5)}...`)

          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            addLog(`Code exchange error: ${exchangeError.message}`)
            throw new Error(exchangeError.message)
          }

          if (data.session) {
            addLog("Session established successfully")
            addLog(`User ID: ${data.session.user.id}`)
            setMessage("Authentication successful! Redirecting...")

            // Redirect to admin dashboard
            setTimeout(() => router.replace("/admin"), 1000)
            return
          }
        } else {
          addLog("No code parameter found in URL")
        }

        // Fallback to checking the session
        addLog("Checking for existing session...")
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData.session) {
          addLog("Existing session found")
          setMessage("Authentication successful! Redirecting...")
          setTimeout(() => router.replace("/admin"), 1000)
        } else {
          addLog("No session established")
          setError("Authentication process completed but no session was created")
          setTimeout(() => router.replace("/admin/login?error=no-session"), 2000)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
        addLog(`Error in auth callback: ${errorMessage}`)
        setError(errorMessage)
        setTimeout(
          () => router.replace(`/admin/login?error=callback&message=${encodeURIComponent(errorMessage)}`),
          2000,
        )
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 bg-gray-900 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-serif mb-4">Authentication</h1>

        {error ? (
          <div className="text-red-400 mb-4">
            <p>Error: {error}</p>
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">{message}</div>
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}

        {/* Debug information */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-xs text-left">
          <h3 className="font-medium mb-2">Debug Information</h3>
          <div className="max-h-40 overflow-y-auto">
            {logs.length > 0 ? (
              <ul className="space-y-1 text-gray-400">
                {logs.map((info, index) => (
                  <li key={index}>{info}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No debug information available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
