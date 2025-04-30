"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AboutSection() {
  const [settings, setSettings] = useState({
    about_heading: "About Me",
    about_text1:
      "I'm Milo Presedo, an AI Solutions Architect and film production professional. Fluent in German, Spanish and English, I love diving into the latest AI models, VR technologies, and complex problem-solving.",
    about_text2:
      "My journey combines a solid educational background with hands-on experience in computer science, graphic design, and film production. I work as a Director of Photography (DP), 1st and 2nd Assistant Camera (1AC & 2AC), as well as a drone and underwater operator.",
    about_text3:
      "In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature, which often inspires my landscape and product photography work.",
    image_profile: "/images/profile.jpg",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["about_heading", "about_text1", "about_text2", "about_text3", "image_profile"])

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
        }
      } catch (err) {
        console.error("Error loading about settings:", err)
      }
    }

    loadSettings()
  }, [])

  return (
    <section id="about" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{settings.about_heading}</h2>

        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-full md:w-1/3">
            <div className="relative aspect-square overflow-hidden rounded-xl">
              <img
                src={settings.image_profile || "/placeholder.svg"}
                alt="Milo Presedo"
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            <p className="text-gray-300">{settings.about_text1}</p>
            <p className="text-gray-300">{settings.about_text2}</p>
            <p className="text-gray-300">{settings.about_text3}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
