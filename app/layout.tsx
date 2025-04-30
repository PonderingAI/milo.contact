import type React from "react"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase"

export const metadata: Metadata = {
  title: "Milo Presedo | Filmmaker & Photographer",
  description: "Portfolio of Milo Presedo, a filmmaker and photographer specializing in visual storytelling.",
    generator: 'v0.dev'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Try to get app icons from site_settings
  let appIcons = null
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("site_settings").select("key, value").like("key", "icon_%")

    if (!error && data && data.length > 0) {
      appIcons = data.reduce((acc: Record<string, string>, item) => {
        const key = item.key.replace("icon_", "")
        acc[key] = item.value
        return acc
      }, {})
    }
  } catch (err) {
    console.error("Error loading app icons:", err)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Standard favicon */}
        <link rel="icon" type="image/x-icon" href={appIcons?.favicon_ico || "/favicon.ico"} />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href={appIcons?.apple_icon_57x57_png || "/apple-icon-57x57.png"} />
        <link rel="apple-touch-icon" sizes="60x60" href={appIcons?.apple_icon_60x60_png || "/apple-icon-60x60.png"} />
        <link rel="apple-touch-icon" sizes="72x72" href={appIcons?.apple_icon_72x72_png || "/apple-icon-72x72.png"} />
        <link rel="apple-touch-icon" sizes="76x76" href={appIcons?.apple_icon_76x76_png || "/apple-icon-76x76.png"} />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href={appIcons?.apple_icon_114x114_png || "/apple-icon-114x114.png"}
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href={appIcons?.apple_icon_120x120_png || "/apple-icon-120x120.png"}
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href={appIcons?.apple_icon_144x144_png || "/apple-icon-144x144.png"}
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href={appIcons?.apple_icon_152x152_png || "/apple-icon-152x152.png"}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={appIcons?.apple_icon_180x180_png || "/apple-icon-180x180.png"}
        />

        {/* Android Icons */}
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href={appIcons?.android_icon_192x192_png || "/android-icon-192x192.png"}
        />

        {/* Favicon PNG variants */}
        <link rel="icon" type="image/png" sizes="32x32" href={appIcons?.favicon_32x32_png || "/favicon-32x32.png"} />
        <link rel="icon" type="image/png" sizes="96x96" href={appIcons?.favicon_96x96_png || "/favicon-96x96.png"} />
        <link rel="icon" type="image/png" sizes="16x16" href={appIcons?.favicon_16x16_png || "/favicon-16x16.png"} />

        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content={appIcons?.ms_icon_144x144_png || "/ms-icon-144x144.png"} />

        {/* Theme Color */}
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
