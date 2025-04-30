"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Mail, Phone, MessageSquare } from "lucide-react"

export default function ContactSection() {
  const [settings, setSettings] = useState({
    contact_heading: "Get in Touch",
    contact_text:
      "Connect with me to discuss AI, VR, film production, or photography projects. I'm always open to new collaborations and opportunities.",
    contact_email: "milo.presedo@mailbox.org",
    contact_phone: "+41 77 422 68 03",
    chatgpt_url: "https://chatgpt.com/g/g-vOF4lzRBG-milo",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["contact_heading", "contact_text", "contact_email", "contact_phone", "chatgpt_url"])

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
        console.error("Error loading contact settings:", err)
      }
    }

    loadSettings()
  }, [])

  return (
    <section id="contact" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">{settings.contact_heading}</h2>
        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12">{settings.contact_text}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <a
            href={`mailto:${settings.contact_email}`}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors duration-300"
          >
            <Mail className="w-10 h-10 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Email</h3>
            <p className="text-gray-400">{settings.contact_email}</p>
          </a>

          <a
            href={`tel:${settings.contact_phone}`}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors duration-300"
          >
            <Phone className="w-10 h-10 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Phone</h3>
            <p className="text-gray-400">{settings.contact_phone}</p>
          </a>

          <a
            href={settings.chatgpt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg text-center transition-colors duration-300"
          >
            <MessageSquare className="w-10 h-10 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">ChatGPT</h3>
            <p className="text-gray-400">Chat with my AI assistant</p>
          </a>
        </div>
      </div>
    </section>
  )
}
