"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import Head from "next/head"

export default function DynamicFavicons() {
  const [icons, setIcons] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadIcons() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.from("site_settings").select("key, value").like("key", "icon_%")

        if (!error && data && data.length > 0) {
          const iconData = data.reduce((acc: Record<string, string>, item) => {
            const key = item.key.replace("icon_", "")
            acc[key] = item.value
            return acc
          }, {})
          setIcons(iconData)
        }
      } catch (err) {
        console.error("Error loading app icons:", err)
      } finally {
        setLoading(false)
      }
    }

    loadIcons()
  }, [])

  if (loading || !icons) return null

  return (
    <Head>
      {icons["favicon_ico"] && <link rel="shortcut icon" href={icons["favicon_ico"]} />}
      {icons["apple_icon_57x57_png"] && (
        <link rel="apple-touch-icon" sizes="57x57" href={icons["apple_icon_57x57_png"]} />
      )}
      {icons["apple_icon_60x60_png"] && (
        <link rel="apple-touch-icon" sizes="60x60" href={icons["apple_icon_60x60_png"]} />
      )}
      {icons["apple_icon_72x72_png"] && (
        <link rel="apple-touch-icon" sizes="72x72" href={icons["apple_icon_72x72_png"]} />
      )}
      {icons["apple_icon_76x76_png"] && (
        <link rel="apple-touch-icon" sizes="76x76" href={icons["apple_icon_76x76_png"]} />
      )}
      {icons["apple_icon_114x114_png"] && (
        <link rel="apple-touch-icon" sizes="114x114" href={icons["apple_icon_114x114_png"]} />
      )}
      {icons["apple_icon_120x120_png"] && (
        <link rel="apple-touch-icon" sizes="120x120" href={icons["apple_icon_120x120_png"]} />
      )}
      {icons["apple_icon_144x144_png"] && (
        <link rel="apple-touch-icon" sizes="144x144" href={icons["apple_icon_144x144_png"]} />
      )}
      {icons["apple_icon_152x152_png"] && (
        <link rel="apple-touch-icon" sizes="152x152" href={icons["apple_icon_152x152_png"]} />
      )}
      {icons["apple_icon_180x180_png"] && (
        <link rel="apple-touch-icon" sizes="180x180" href={icons["apple_icon_180x180_png"]} />
      )}
      {icons["android_icon_192x192_png"] && (
        <link rel="icon" type="image/png" sizes="192x192" href={icons["android_icon_192x192_png"]} />
      )}
      {icons["favicon_32x32_png"] && (
        <link rel="icon" type="image/png" sizes="32x32" href={icons["favicon_32x32_png"]} />
      )}
      {icons["favicon_96x96_png"] && (
        <link rel="icon" type="image/png" sizes="96x96" href={icons["favicon_96x96_png"]} />
      )}
      {icons["favicon_16x16_png"] && (
        <link rel="icon" type="image/png" sizes="16x16" href={icons["favicon_16x16_png"]} />
      )}
    </Head>
  )
}
