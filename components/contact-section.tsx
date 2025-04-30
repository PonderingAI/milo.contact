"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface ContactSettings {
  contact_heading?: string
  contact_text?: string
  contact_email?: string
  instagram_url?: string
}

export default function ContactSection() {
  const [settings, setSettings] = useState<ContactSettings>({
    contact_heading: "Get in Touch",
    contact_text: "Interested in working together? Let's talk about your project!",
    contact_email: "milo.presedo@mailbox.org",
    instagram_url: "https://instagram.com/milo.presedo",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["contact_heading", "contact_text", "contact_email", "instagram_url"])

        if (error) {
          console.error("Error loading contact settings:", error)
          return
        }

        if (data && data.length > 0) {
          const newSettings: ContactSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "contact_heading") newSettings.contact_heading = item.value
            if (item.key === "contact_text") newSettings.contact_text = item.value
            if (item.key === "contact_email") newSettings.contact_email = item.value
            if (item.key === "instagram_url") newSettings.instagram_url = item.value
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
    <section id="contact" className="py-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">{settings.contact_heading}</h2>
      <p className="text-lg text-gray-300 mb-8">{settings.contact_text}</p>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <h3 className="text-xl font-bold mb-4">Contact Information</h3>
          <ul className="space-y-4">
            <li className="flex items-center">
              <span className="mr-2">📧</span>
              <a href={`mailto:${settings.contact_email}`} className="hover:text-blue-400 transition-colors">
                {settings.contact_email}
              </a>
            </li>
            <li className="flex items-center">
              <span className="mr-2">📱</span>
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>

        <div className="w-full md:w-1/2">
          <h3 className="text-xl font-bold mb-4">Send a Message</h3>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
