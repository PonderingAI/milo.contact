"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

/**
 * DynamicFavicons Component
 *
 * This component loads custom favicons from Supabase storage.
 * It falls back to default favicons if custom ones aren't available.
 */
export default function DynamicFavicons() {
  const [favicons, setFavicons] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFavicons() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Try to get favicon settings from site_settings table
        const { data, error } = await supabase.from("site_settings").select("key, value").like("key", "icon_%")

        if (error) {
          // If the table doesn't exist, this is expected during initial setup
          if (error.code === "42P01") {
            console.log("Site settings table doesn't exist yet. Using default favicons.")
            return
          }

          // Log other errors but don't throw
          console.error("Error loading favicon settings:", error)
          setError("Failed to load custom favicons")
          return
        }

        if (!data || data.length === 0) {
          // No custom favicons found, use defaults
          return
        }

        // Convert array of {key, value} to object
        const iconSettings: Record<string, string> = {}
        data.forEach((item) => {
          iconSettings[item.key] = item.value
        })

        setFavicons(iconSettings)
      } catch (err) {
        console.error("Error in loadFavicons:", err)
        setError("An unexpected error occurred loading favicons")
      } finally {
        setLoading(false)
      }
    }

    loadFavicons()
  }, [])

  // If loading or error, return null (default favicons will be used)
  if (loading || error || Object.keys(favicons).length === 0) {
    return null
  }

  return (
    <Head>
      {favicons["icon_favicon"] && <link rel="icon" href={favicons["icon_favicon"]} />}
      {favicons["icon_16"] && <link rel="icon" type="image/png" sizes="16x16" href={favicons["icon_16"]} />}
      {favicons["icon_32"] && <link rel="icon" type="image/png" sizes="32x32" href={favicons["icon_32"]} />}
      {favicons["icon_apple"] && <link rel="apple-touch-icon" href={favicons["icon_apple"]} />}
    </Head>
  )
}
