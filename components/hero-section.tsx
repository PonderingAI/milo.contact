"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface HeroSettings {
  hero_heading?: string
  hero_subheading?: string
  image_hero_bg?: string
}

export default function HeroSection() {
  const [settings, setSettings] = useState<HeroSettings>({
    hero_heading: "Milo Presedo",
    hero_subheading: "Filmmaker & Photographer",
    image_hero_bg: "/images/hero-bg.jpg",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["hero_heading", "hero_subheading", "image_hero_bg"])

        if (error) {
          console.error("Error loading hero settings:", error)
          return
        }

        if (data && data.length > 0) {
          const newSettings: HeroSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "hero_heading") newSettings.hero_heading = item.value
            if (item.key === "hero_subheading") newSettings.hero_subheading = item.value
            if (item.key === "image_hero_bg") newSettings.image_hero_bg = item.value
          })
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
      }
    }

    loadSettings()
  }, [])

  return (
    <div
      className="relative h-screen flex items-center justify-center text-center"
      style={{
        backgroundImage: `url(${settings.image_hero_bg || "/images/hero-bg.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 font-serif">{settings.hero_heading}</h1>
        <p className="text-xl md:text-2xl">{settings.hero_subheading}</p>
      </div>
    </div>
  )
}
