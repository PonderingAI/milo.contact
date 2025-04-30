import type React from "react"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import CustomCursor from "@/components/custom-cursor"
import DynamicFavicons from "@/components/dynamic-favicons"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Milo Presedo - Film Production & Photography",
  description: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <CustomCursor />
            <DynamicFavicons />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
