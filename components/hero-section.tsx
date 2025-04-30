"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { extractVideoInfo } from "@/lib/project-data"

export default function HeroSection() {
  const [settings, setSettings] = useState({
    hero_heading: "Film Production & Photography",
    hero_subheading: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
    image_hero_bg: "/images/hero-bg.jpg",
  })
  const [isVimeoBackground, setIsVimeoBackground] = useState(false)
  const [vimeoId, setVimeoId] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["hero_heading", "hero_subheading", "image_hero_bg"])

        if (!error && data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            // @ts-ignore
            if (newSettings.hasOwnProperty(item.key)) {
              // @ts-ignore
              newSettings[item.key] = item.value
            }
          })
          setSettings(newSettings)

          // Check if background is a Vimeo URL
          if (newSettings.image_hero_bg.includes("vimeo.com")) {
            setIsVimeoBackground(true)
            const videoInfo = extractVideoInfo(newSettings.image_hero_bg)
            if (videoInfo && videoInfo.platform === "vimeo") {
              setVimeoId(videoInfo.id)
            }
          } else {
            setIsVimeoBackground(false)
            setVimeoId(null)
          }
        }
      } catch (err) {
        console.error("Error loading hero settings:", err)
      }
    }

    loadSettings()
  }, [])

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      {isVimeoBackground && vimeoId ? (
        <div className="absolute inset-0 w-full h-full">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Background Video"
          ></iframe>
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.image_hero_bg})` }}
        ></div>
      )}

      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">{settings.hero_heading}</h1>
        <p className="text-xl md:text-2xl text-gray-200">{settings.hero_subheading}</p>
      </div>
    </section>
  )
}
