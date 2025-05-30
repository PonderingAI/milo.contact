"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem("cookie-consent")
    if (!hasAccepted) {
      // Show banner after a short delay to avoid layout shifts during page load
      const timer = setTimeout(() => {
        setShowConsent(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/80 backdrop-blur-sm border-t border-gray-800">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300">
          This website uses cookies to enhance your experience. By continuing to use this site, you accept our use of
          cookies.
        </p>
        <Button onClick={acceptCookies} className="whitespace-nowrap">
          Accept
        </Button>
      </div>
    </div>
  )
}
