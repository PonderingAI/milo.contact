import type React from "react"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import CustomCursor from "@/components/custom-cursor"
import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase-server"

export const metadata = {
  title: "Milo Presedo | Film Production & Photography",
  description: "Portfolio of Milo Presedo, Director of Photography, Camera Assistant, Drone & Underwater Operator",
    generator: 'v0.dev'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Try to get app icons from site_settings
  let icons = null
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("site_settings").select("key, value").like("key", "icon_%")

    if (!error && data && data.length > 0) {
      icons = data.reduce((acc: Record<string, string>, item) => {
        const key = item.key.replace("icon_", "")
        acc[key] = item.value
        return acc
      }, {})
    }
  } catch (err) {
    console.error("Error loading app icons:", err)
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Default favicon if custom ones aren't available */}
          {!icons && <link rel="icon" href="/favicon.ico" />}

          {/* Custom favicons if available */}
          {icons && icons["favicon_ico"] && <link rel="shortcut icon" href={icons["favicon_ico"]} />}
          {icons && icons["apple_icon_57x57_png"] && (
            <link rel="apple-touch-icon" sizes="57x57" href={icons["apple_icon_57x57_png"]} />
          )}
          {icons && icons["apple_icon_60x60_png"] && (
            <link rel="apple-touch-icon" sizes="60x60" href={icons["apple_icon_60x60_png"]} />
          )}
          {icons && icons["apple_icon_72x72_png"] && (
            <link rel="apple-touch-icon" sizes="72x72" href={icons["apple_icon_72x72_png"]} />
          )}
          {icons && icons["apple_icon_76x76_png"] && (
            <link rel="apple-touch-icon" sizes="76x76" href={icons["apple_icon_76x76_png"]} />
          )}
          {icons && icons["apple_icon_114x114_png"] && (
            <link rel="apple-touch-icon" sizes="114x114" href={icons["apple_icon_114x114_png"]} />
          )}
          {icons && icons["apple_icon_120x120_png"] && (
            <link rel="apple-touch-icon" sizes="120x120" href={icons["apple_icon_120x120_png"]} />
          )}
          {icons && icons["apple_icon_144x144_png"] && (
            <link rel="apple-touch-icon" sizes="144x144" href={icons["apple_icon_144x144_png"]} />
          )}
          {icons && icons["apple_icon_152x152_png"] && (
            <link rel="apple-touch-icon" sizes="152x152" href={icons["apple_icon_152x152_png"]} />
          )}
          {icons && icons["apple_icon_180x180_png"] && (
            <link rel="apple-touch-icon" sizes="180x180" href={icons["apple_icon_180x180_png"]} />
          )}
          {icons && icons["android_icon_192x192_png"] && (
            <link rel="icon" type="image/png" sizes="192x192" href={icons["android_icon_192x192_png"]} />
          )}
          {icons && icons["favicon_32x32_png"] && (
            <link rel="icon" type="image/png" sizes="32x32" href={icons["favicon_32x32_png"]} />
          )}
          {icons && icons["favicon_96x96_png"] && (
            <link rel="icon" type="image/png" sizes="96x96" href={icons["favicon_96x96_png"]} />
          )}
          {icons && icons["favicon_16x16_png"] && (
            <link rel="icon" type="image/png" sizes="16x16" href={icons["favicon_16x16_png"]} />
          )}
        </head>
        <body>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <Suspense fallback={null}>
              <CustomCursor />
            </Suspense>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
