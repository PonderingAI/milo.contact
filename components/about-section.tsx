"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function AboutSection() {
  const [settings, setSettings] = useState({
    about_heading: "About Me",
    about_text1:
      "I'm Milo Presedo, an AI Solutions Architect and film production professional. Fluent in German, Spanish and English, I love diving into the latest AI models, VR technologies, and complex problem-solving.",
    about_text2:
      "My journey combines a solid educational background with hands-on experience in computer science, graphic design, and film production. I work as a Director of Photography (DP), 1st and 2nd Assistant Camera (1AC & 2AC), as well as a drone and underwater operator.",
    about_text3:
      "In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature, which often inspires my landscape and product photography work.",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["about_heading", "about_text1", "about_text2", "about_text3"])

        if (error) {
          // If table doesn't exist, we'll use default values
          if (error.code === "42P01") {
            console.log("Site settings table doesn't exist yet. Using default values.")
          } else {
            console.error("Error loading about settings:", error)
          }
          return
        }

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "about_heading") newSettings.about_heading = item.value
            if (item.key === "about_text1") newSettings.about_text1 = item.value
            if (item.key === "about_text2") newSettings.about_text2 = item.value
            if (item.key === "about_text3") newSettings.about_text3 = item.value
          })
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  return (
    <section id="about" className="py-24">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-serif mb-8">{settings.about_heading}</h2>
        <p className="text-xl text-gray-300 mb-6">{settings.about_text1}</p>
        <p className="text-xl text-gray-300 mb-6">{settings.about_text2}</p>
        <p className="text-xl text-gray-300">{settings.about_text3}</p>
      </div>
    </section>
  )
}
