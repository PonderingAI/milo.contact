"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function Footer() {
  const [settings, setSettings] = useState({
    footer_text: "© 2023 Milo Presedo. All rights reserved.",
    contact_email: "milo.presedo@mailbox.org", // fallback
    chatgpt_url: "https://chatgpt.com/g/g-vOF4lzRBG-milo",
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = getSupabaseBrowserClient()

        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["footer_text", "contact_email", "chatgpt_url"])

        if (error) {
          // If table doesn't exist, we'll use default values
          if (error.code === "42P01") {
            console.log("Site settings table doesn't exist yet. Using default values.")
          } else {
            console.error("Error loading footer settings:", error)
          }
          return
        }

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "footer_text") newSettings.footer_text = item.value
            if (item.key === "contact_email") newSettings.contact_email = item.value
            if (item.key === "chatgpt_url") newSettings.chatgpt_url = item.value
          })
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
      }
    }

    loadSettings()
  }, [])

  // Get current year for copyright
  const currentYear = new Date().getFullYear()
  const footerText = settings.footer_text.replace(/©\s*\d{4}/, `© ${currentYear}`)

  return (
    <footer className="border-t border-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">{footerText}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="https://instagram.com/milo.presedo" className="text-gray-400 hover:text-white">
              Instagram
            </a>
            <a href={settings.chatgpt_url} className="text-gray-400 hover:text-white">
              ChatGPT
            </a>
            <a href={`mailto:${settings.contact_email}`} className="text-gray-400 hover:text-white">
              Email
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}