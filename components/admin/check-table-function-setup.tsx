"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function CheckTableFunctionSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
  } | null>(null)

  const setupFunction = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/create-check-table-function")
      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Function created successfully",
        })
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to create function",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Function Setup</CardTitle>
        <CardDescription>Create the check_table_exists function required for dependency management</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          The dependency management system requires a special database function to check if tables exist. Click the
          button below to create this function in your Supabase database.
        </p>

        {result && (
          <Alert className={result.success ? "bg-green-50" : "bg-red-50"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message || result.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={setupFunction} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up function...
            </>
          ) : (
            "Create check_table_exists Function"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
