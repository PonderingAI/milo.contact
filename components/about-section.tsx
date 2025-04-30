"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AboutSettings {
  about_heading?: string
  about_text?: string
  image_profile?: string
}

export default function AboutSection() {
  const [settings, setSettings] = useState<AboutSettings>({
    about_heading: "About Me",
    about_text:
      "I'm a filmmaker and photographer passionate about visual storytelling. With experience in directing, camera work, and production, I bring a comprehensive understanding to every project. My work spans short films, music videos, and commercial content, always with a focus on authentic narratives and compelling visuals.",
    image_profile: "/images/profile.jpg",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["about_heading", "about_text", "image_profile"])

        if (error) {
          console.error("Error loading about settings:", error)
          return
        }

        if (data && data.length > 0) {
          const newSettings: AboutSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "about_heading") newSettings.about_heading = item.value
            if (item.key === "about_text") newSettings.about_text = item.value
            if (item.key === "image_profile") newSettings.image_profile = item.value
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
    <section id="about" className="py-16">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/3">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <img
              src={settings.image_profile || "/images/profile.jpg"}
              alt="Milo Presedo"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
        <div className="w-full md:w-2/3">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif">{settings.about_heading}</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300">{settings.about_text}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
