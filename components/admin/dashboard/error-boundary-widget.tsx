"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"

interface ErrorBoundaryWidgetProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ErrorBoundaryWidget({
  children,
  fallback = (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
      <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-sm font-medium mb-1">Widget Error</h3>
      <p className="text-xs text-gray-500">This widget encountered an error and couldn't be displayed.</p>
    </div>
  ),
}: ErrorBoundaryWidgetProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      event.preventDefault()
      setHasError(true)
      console.error("Widget error:", event.error)
    }

    window.addEventListener("error", errorHandler)
    return () => window.removeEventListener("error", errorHandler)
  }, [])

  if (hasError) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
