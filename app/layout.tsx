import type React from "react"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
// Removed: import CustomCursor from "@/components/custom-cursor"
import CustomCursorLoader from '@/components/custom-cursor-loader' // Added import for the new loader
import DynamicFavicons from "@/components/dynamic-favicons"
import SetupTablesPopup from "@/components/setup-tables-popup"
import CookieConsent from "@/components/cookie-consent"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"
import { initErrorTracking } from "@/lib/error-tracking"
import { createAdminClient } from "@/lib/supabase-server"
import { Toaster } from "@/components/ui/sonner"

// Removed: import dynamic from 'next/dynamic'
// Removed: const DynamicCustomCursor = dynamic(() => import('@/components/custom-cursor'), { ssr: false })

// Use system fonts to avoid Google Fonts firewall issues
const fontClasses = "font-['system-ui','Segoe_UI',Roboto,Arial,sans-serif]"

// Add this ErrorBoundary component
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  try {
    return <>{children}</>
  } catch (error) {
    console.error("Error in component:", error)
    return <>{fallback}</>
  }
}

export const metadata = {
  title: "Milo Presedo - Film Production & Photography",
  description: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
  manifest: "/manifest", // Points to app/manifest/route.ts
  generator: 'v0.dev'
}

async function getBackgroundColor() {
  try {
    // Use createAdminClient instead of cookies-based client
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "background_color").single()

    if (error) {
      console.error("Error fetching background color:", error)
      return "#000000" // Default black
    }

    if (data && data.value) {
      // Ensure the color has a # prefix
      const color = data.value.startsWith("#") ? data.value : `#${data.value}`
      return color
    }

    return "#000000" // Default black
  } catch (error) {
    console.error("Error in getBackgroundColor:", error)
    return "#000000" // Default black
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Initialize error tracking
  initErrorTracking()

  // Get background color
  const backgroundColor = await getBackgroundColor()

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Default favicons that will be overridden by DynamicFavicons if available */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        </head>
        <body className={fontClasses} style={{ backgroundColor }}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <CustomCursorLoader />
            <DynamicFavicons />
            <Suspense>{children}</Suspense>
            <Analytics />
            <CookieConsent />
            <Toaster />
          </ThemeProvider>
          {/* Database setup popup - wrapped in error handling */}
          <ErrorBoundary fallback={<div className="hidden">Database setup error</div>}>
            <SetupTablesPopup />
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
