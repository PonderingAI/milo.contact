import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider" // Assuming this sets 'dark' class

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const fontPlayfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair-display",
})

export const metadata: Metadata = {
  title: "Cinematic Prompt Manager",
  description: "Manage your creative prompts with cinematic flair.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-brand-background font-sans antialiased dark", // Force dark theme
          fontInter.variable,
          fontPlayfairDisplay.variable,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
