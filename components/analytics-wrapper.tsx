"use client"

import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/react"

export function AnalyticsWrapper() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    // Check if analytics script is available
    const checkAnalytics = () => {
      try {
        // Only enable analytics if we're in production and the script is likely to load
        if (
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1" &&
          !window.location.hostname.includes(".vercel.app")
        ) {
          setAnalyticsEnabled(true)
        }
      } catch (e) {
        // Silently fail - analytics is non-critical
      }
    }

    checkAnalytics()
  }, [])

  if (!analyticsEnabled) return null

  // Only render Analytics when enabled
  return <Analytics />
}
