import type React from "react"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import CustomCursor from "@/components/custom-cursor"
import DynamicFavicons from "@/components/dynamic-favicons"
import SetupTablesPopup from "@/components/setup-tables-popup"
import CookieConsent from "@/components/cookie-consent"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"
import { initErrorTracking } from "@/lib/error-tracking"
import { createAdminClient } from "@/lib/supabase-server"

const inter = Inter({ subsets: ["latin"] })

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
    generator: 'v0.dev'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Initialize error tracking
  initErrorTracking()

  // Fetch background color from site settings
  let backgroundColor = "#000000" // Default black
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "background_color").single()

    if (error) {
      console.error("Error fetching background color:", error)
    } else if (data && data.value) {
      backgroundColor = data.value.startsWith("#") ? data.value : `#${data.value}`
    }
  } catch (error) {
    console.error("Error fetching background color:", error)
  }

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
        <body className={inter.className} style={{ backgroundColor }}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <CustomCursor />
            <DynamicFavicons />
            <Suspense>{children}</Suspense>
            <Analytics />
            <CookieConsent />
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
