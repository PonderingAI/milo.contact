"use client"

import { useEffect, useState } from "react"
import Head from "next/head"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

/**
 * DynamicFavicons Component
 *
 * This component loads custom favicons from Supabase storage.
 * It falls back to default favicons if custom ones aren't available.
 *
 * The favicons are stored in the site_settings table with keys prefixed with "icon_"
 * and will persist across deployments since they're stored in the database.
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
          console.log("Error in loadFavicons:", error)
          return
        }

        if (!data || data.length === 0) {
          // No custom favicons found, use defaults
          console.log("No custom favicons found, using defaults")
          return
        }

        // Convert array of {key, value} to object
        const iconSettings: Record<string, string> = {}
        data.forEach((item) => {
          // Extract the filename part from the key (remove "icon_" prefix)
          const iconKey = item.key.replace("icon_", "")
          iconSettings[iconKey] = item.value
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
      {/* Basic favicons */}
      {favicons["favicon_ico"] && <link rel="shortcut icon" href={favicons["favicon_ico"]} />}
      {favicons["favicon_16x16_png"] && (
        <link rel="icon" type="image/png" sizes="16x16" href={favicons["favicon_16x16_png"]} />
      )}
      {favicons["favicon_32x32_png"] && (
        <link rel="icon" type="image/png" sizes="32x32" href={favicons["favicon_32x32_png"]} />
      )}
      {favicons["favicon_96x96_png"] && (
        <link rel="icon" type="image/png" sizes="96x96" href={favicons["favicon_96x96_png"]} />
      )}

      {/* Apple touch icons */}
      {/* Generic Apple Touch Icon (should come before specific sizes) */}
      {favicons["apple_touch_icon_png"] && (
        <link rel="apple-touch-icon" href={favicons["apple_touch_icon_png"]} />
      )}
      {favicons["apple_icon_57x57_png"] && (
        <link rel="apple-touch-icon" sizes="57x57" href={favicons["apple_icon_57x57_png"]} />
      )}
      {favicons["apple_icon_60x60_png"] && (
        <link rel="apple-touch-icon" sizes="60x60" href={favicons["apple_icon_60x60_png"]} />
      )}
      {favicons["apple_icon_72x72_png"] && (
        <link rel="apple-touch-icon" sizes="72x72" href={favicons["apple_icon_72x72_png"]} />
      )}
      {favicons["apple_icon_76x76_png"] && (
        <link rel="apple-touch-icon" sizes="76x76" href={favicons["apple_icon_76x76_png"]} />
      )}
      {favicons["apple_icon_114x114_png"] && (
        <link rel="apple-touch-icon" sizes="114x114" href={favicons["apple_icon_114x114_png"]} />
      )}
      {favicons["apple_icon_120x120_png"] && (
        <link rel="apple-touch-icon" sizes="120x120" href={favicons["apple_icon_120x120_png"]} />
      )}
      {favicons["apple_icon_144x144_png"] && (
        <link rel="apple-touch-icon" sizes="144x144" href={favicons["apple_icon_144x144_png"]} />
      )}
      {favicons["apple_icon_152x152_png"] && (
        <link rel="apple-touch-icon" sizes="152x152" href={favicons["apple_icon_152x152_png"]} />
      )}
      {favicons["apple_icon_180x180_png"] && (
        <link rel="apple-touch-icon" sizes="180x180" href={favicons["apple_icon_180x180_png"]} />
      )}

      {/* Android icons */}
      {favicons["android_icon_192x192_png"] && (
        <link rel="icon" type="image/png" sizes="192x192" href={favicons["android_icon_192x192_png"]} />
      )}

      {/* Microsoft icons */}
      {favicons["ms_icon_144x144_png"] && (
        <meta name="msapplication-TileImage" content={favicons["ms_icon_144x144_png"]} />
      )}
      {favicons["ms_icon_70x70_png"] && (
        <meta name="msapplication-square70x70logo" content={favicons["ms_icon_70x70_png"]} />
      )}
      {favicons["ms_icon_150x150_png"] && (
        <meta name="msapplication-square150x150logo" content={favicons["ms_icon_150x150_png"]} />
      )}
      {favicons["ms_icon_310x310_png"] && (
        <meta name="msapplication-square310x310logo" content={favicons["ms_icon_310x310_png"]} />
      )}
    </Head>
  )
}
