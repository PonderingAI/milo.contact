import type React from "react"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import CustomCursor from "@/components/custom-cursor"
import { Suspense } from "react"
import DynamicFavicons from "@/components/dynamic-favicons"

export const metadata = {
  title: "Milo Presedo | Film Production & Photography",
  description: "Portfolio of Milo Presedo, Director of Photography, Camera Assistant, Drone & Underwater Operator",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Default favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

          {/* Dynamic favicons will be loaded client-side */}
          <Suspense fallback={null}>
            <DynamicFavicons />
          </Suspense>
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
