"use client"

import { useEffect, useState } from "react"
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
        
        // Apply the favicons to the document
        applyFaviconsToDocument(iconSettings)
      } catch (err) {
        console.error("Error in loadFavicons:", err)
        setError("An unexpected error occurred loading favicons")
      } finally {
        setLoading(false)
      }
    }

    loadFavicons()
  }, [])

  // Function to apply favicons to the document head
  const applyFaviconsToDocument = (iconSettings: Record<string, string>) => {
    const head = document.head

    // Remove existing dynamic favicon links (but keep the defaults from layout)
    const existingDynamicFavicons = head.querySelectorAll('link[data-dynamic-favicon]')
    existingDynamicFavicons.forEach(link => link.remove())

    // Add dynamic favicon links
    const faviconMappings = [
      { key: "favicon_ico", rel: "shortcut icon", href: iconSettings["favicon_ico"] },
      { key: "favicon_16x16_png", rel: "icon", type: "image/png", sizes: "16x16", href: iconSettings["favicon_16x16_png"] },
      { key: "favicon_32x32_png", rel: "icon", type: "image/png", sizes: "32x32", href: iconSettings["favicon_32x32_png"] },
      { key: "favicon_96x96_png", rel: "icon", type: "image/png", sizes: "96x96", href: iconSettings["favicon_96x96_png"] },
      { key: "apple_touch_icon_png", rel: "apple-touch-icon", href: iconSettings["apple_touch_icon_png"] },
      { key: "apple_icon_57x57_png", rel: "apple-touch-icon", sizes: "57x57", href: iconSettings["apple_icon_57x57_png"] },
      { key: "apple_icon_60x60_png", rel: "apple-touch-icon", sizes: "60x60", href: iconSettings["apple_icon_60x60_png"] },
      { key: "apple_icon_72x72_png", rel: "apple-touch-icon", sizes: "72x72", href: iconSettings["apple_icon_72x72_png"] },
      { key: "apple_icon_76x76_png", rel: "apple-touch-icon", sizes: "76x76", href: iconSettings["apple_icon_76x76_png"] },
      { key: "apple_icon_114x114_png", rel: "apple-touch-icon", sizes: "114x114", href: iconSettings["apple_icon_114x114_png"] },
      { key: "apple_icon_120x120_png", rel: "apple-touch-icon", sizes: "120x120", href: iconSettings["apple_icon_120x120_png"] },
      { key: "apple_icon_144x144_png", rel: "apple-touch-icon", sizes: "144x144", href: iconSettings["apple_icon_144x144_png"] },
      { key: "apple_icon_152x152_png", rel: "apple-touch-icon", sizes: "152x152", href: iconSettings["apple_icon_152x152_png"] },
      { key: "apple_icon_180x180_png", rel: "apple-touch-icon", sizes: "180x180", href: iconSettings["apple_icon_180x180_png"] },
      { key: "android_icon_192x192_png", rel: "icon", type: "image/png", sizes: "192x192", href: iconSettings["android_icon_192x192_png"] },
    ]

    faviconMappings.forEach(({ key, rel, type, sizes, href }) => {
      if (href) {
        const link = document.createElement('link')
        link.rel = rel
        if (type) link.type = type
        if (sizes) link.setAttribute('sizes', sizes)
        link.href = href
        link.setAttribute('data-dynamic-favicon', 'true')
        head.appendChild(link)
      }
    })

    // Add Microsoft meta tags
    const metaMappings = [
      { name: "msapplication-TileImage", content: iconSettings["ms_icon_144x144_png"] },
      { name: "msapplication-square70x70logo", content: iconSettings["ms_icon_70x70_png"] },
      { name: "msapplication-square150x150logo", content: iconSettings["ms_icon_150x150_png"] },
      { name: "msapplication-square310x310logo", content: iconSettings["ms_icon_310x310_png"] },
    ]

    metaMappings.forEach(({ name, content }) => {
      if (content) {
        const meta = document.createElement('meta')
        meta.name = name
        meta.content = content
        meta.setAttribute('data-dynamic-favicon', 'true')
        head.appendChild(meta)
      }
    })
  }

  // If loading or error, return null (default favicons will be used)
  if (loading || error) {
    return null
  }

  // Return null since we're applying favicons directly to the document
  return null
}
