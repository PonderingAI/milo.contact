"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function TroubleshootingGuide() {
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})

  const checkEnvironmentVariables = () => {
    const requiredVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "CLOUDFLARE_TURNSTILE_SITE_KEY",
      "CLOUDFLARE_TURNSTILE_SECRET_KEY",
    ]

    const results: Record<string, boolean> = {}
    let allPresent = true

    requiredVars.forEach((varName) => {
      const isPresent = !!process.env[varName]
      results[varName] = isPresent
      if (!isPresent) allPresent = false
    })

    setResults({
      ...results,
      environmentVars: {
        success: allPresent,
        details: results,
      },
    })

    setActiveStep("env")
  }

  const checkUserExists = async () => {
    try {
      const response = await fetch("/api/debug-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "me@milo.contact" }),
      })

      const data = await response.json()

      setResults({
        ...results,
        userExists: {
          success: data.success,
          details: data.user || data.message,
        },
      })
    } catch (error) {
      setResults({
        ...results,
        userExists: {
          success: false,
          details: error instanceof Error ? error.message : String(error),
        },
      })
    }

    setActiveStep("user")
  }

  const checkCaptcha = async () => {
    try {
      const keyResponse = await fetch("/api/get-turnstile-key")
      const keyData = await keyResponse.json()

      const verifyResponse = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "test_token" }),
      })

      const verifyData = await verifyResponse.json()

      setResults({
        ...results,
        captcha: {
          success: keyResponse.ok && verifyResponse.ok,
          details: {
            siteKey: keyData.siteKey ? "Available" : "Missing",
            verifyEndpoint: verifyResponse.ok ? "Working" : "Error",
            response: verifyData,
          },
        },
      })
    } catch (error) {
      setResults({
        ...results,
        captcha: {
          success: false,
          details: error instanceof Error ? error.message : String(error),
        },
      })
    }

    setActiveStep("captcha")
  }

  const checkSupabaseConnection = async () => {
    try {
      const response = await fetch("/api/test-supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "basic" }),
      })

      const data = await response.json()

      setResults({
        ...results,
        supabase: {
          success: data.success,
          details: data,
        },
      })
    } catch (error) {
      setResults({
        ...results,
        supabase: {
          success: false,
          details: error instanceof Error ? error.message : String(error),
        },
      })
    }

    setActiveStep("supabase")
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-4">Step-by-Step Troubleshooting Guide</h4>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="step1">
            <AccordionTrigger className="text-sm">
              Step 1: Check Environment Variables
              {results.environmentVars && (
                <span className="ml-2">
                  {results.environmentVars.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 inline" />
                  )}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-gray-400 mb-4">
                First, let's check if all required environment variables are properly set.
              </p>
              <Button onClick={checkEnvironmentVariables} variant="outline" size="sm" className="mb-4">
                Check Environment Variables
              </Button>

              {results.environmentVars && (
                <Alert
                  className={
                    results.environmentVars.success
                      ? "bg-green-900/20 border-green-800"
                      : "bg-red-900/20 border-red-800"
                  }
                >
                  {results.environmentVars.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {results.environmentVars.success
                      ? "All required environment variables are set."
                      : "Some environment variables are missing:"}
                    {!results.environmentVars.success && (
                      <ul className="mt-2 list-disc pl-5 space-y-1">
                        {Object.entries(results.environmentVars.details).map(
                          ([varName, isPresent]) =>
                            !isPresent && (
                              <li key={varName} className="text-red-400">
                                {varName}
                              </li>
                            ),
                        )}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step2">
            <AccordionTrigger className="text-sm">
              Step 2: Check User Account
              {results.userExists && (
                <span className="ml-2">
                  {results.userExists.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 inline" />
                  )}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-gray-400 mb-4">
                Let's check if the user account exists and is properly confirmed.
              </p>
              <Button onClick={checkUserExists} variant="outline" size="sm" className="mb-4">
                Check User Account
              </Button>

              {results.userExists && (
                <Alert
                  className={
                    results.userExists.success ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"
                  }
                >
                  {results.userExists.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {results.userExists.success ? (
                      <div>
                        <p>User account exists:</p>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                          <li>Email: {results.userExists.details.email}</li>
                          <li>
                            Email confirmed:{" "}
                            {results.userExists.details.emailConfirmed ? (
                              <span className="text-green-500">Yes</span>
                            ) : (
                              <span className="text-red-500">No</span>
                            )}
                          </li>
                          <li>User ID: {results.userExists.details.id}</li>
                        </ul>
                      </div>
                    ) : (
                      <p>
                        User account issue:{" "}
                        {typeof results.userExists.details === "string"
                          ? results.userExists.details
                          : JSON.stringify(results.userExists.details)}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step3">
            <AccordionTrigger className="text-sm">
              Step 3: Check Captcha Configuration
              {results.captcha && (
                <span className="ml-2">
                  {results.captcha.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 inline" />
                  )}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-gray-400 mb-4">
                Let's check if the Cloudflare Turnstile captcha is properly configured.
              </p>
              <Button onClick={checkCaptcha} variant="outline" size="sm" className="mb-4">
                Check Captcha Configuration
              </Button>

              {results.captcha && (
                <Alert
                  className={
                    results.captcha.success ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"
                  }
                >
                  {results.captcha.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {results.captcha.success ? (
                      <p>Captcha configuration is working correctly.</p>
                    ) : (
                      <p>Captcha configuration issue: {JSON.stringify(results.captcha.details)}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step4">
            <AccordionTrigger className="text-sm">
              Step 4: Check Supabase Connection
              {results.supabase && (
                <span className="ml-2">
                  {results.supabase.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500 inline" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 inline" />
                  )}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-gray-400 mb-4">
                Let's check if the connection to Supabase is working properly.
              </p>
              <Button onClick={checkSupabaseConnection} variant="outline" size="sm" className="mb-4">
                Check Supabase Connection
              </Button>

              {results.supabase && (
                <Alert
                  className={
                    results.supabase.success ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"
                  }
                >
                  {results.supabase.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {results.supabase.success ? (
                      <p>Supabase connection is working correctly.</p>
                    ) : (
                      <p>Supabase connection issue: {JSON.stringify(results.supabase.details)}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step5">
            <AccordionTrigger className="text-sm">Step 5: Recommended Actions</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Based on the troubleshooting results, here are the recommended actions:
                </p>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">If user account doesn't exist or isn't confirmed:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
                    <li>Use the "Force Create (Admin)" button in the Account Management tab</li>
                    <li>Or use the "Force Confirm User" button if the account exists but isn't confirmed</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">If captcha verification is failing:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
                    <li>Try using the "Emergency Bypass Login" in the Advanced tab</li>
                    <li>Check that your Cloudflare Turnstile keys are correctly configured</li>
                    <li>
                      Set <code>NEXT_PUBLIC_SKIP_CAPTCHA=true</code> in your environment variables to bypass captcha
                      temporarily
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">If Supabase connection is failing:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
                    <li>Verify your Supabase URL and API keys</li>
                    <li>Check if your Supabase project is active and not in maintenance mode</li>
                    <li>Ensure your IP is not blocked by Supabase</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
