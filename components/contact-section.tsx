"use client"

import { useState, useEffect } from "react"
import { Mail, Phone, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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

        if (error) {
          console.error("Error loading contact settings:", error)
          return
        }

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "contact_heading") newSettings.contact_heading = item.value
            if (item.key === "contact_text") newSettings.contact_text = item.value
            if (item.key === "contact_email") newSettings.contact_email = item.value
            if (item.key === "contact_phone") newSettings.contact_phone = item.value
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

  return (
    <section id="contact" className="py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-5xl md:text-7xl font-serif mb-8">{settings.contact_heading}</h2>
          <p className="text-xl text-gray-300 mb-12">{settings.contact_text}</p>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-400">Call me on Signal or WhatsApp</p>
                <a href={`tel:${settings.contact_phone}`} className="text-xl hover:underline">
                  {settings.contact_phone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-400">Email me at</p>
                <a href={`mailto:${settings.contact_email}`} className="text-xl hover:underline">
                  {settings.contact_email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-400">Chat with me on</p>
                <a href={settings.chatgpt_url} className="text-xl hover:underline">
                  ChatGPT
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-8">
          <h3 className="text-2xl font-serif mb-6">Send me a message</h3>
          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-gray-400">
                Name
              </label>
              <Input id="name" placeholder="Your name" className="bg-gray-800 border-gray-700 focus:border-white" />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-gray-400">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                className="bg-gray-800 border-gray-700 focus:border-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-gray-400">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Your message"
                rows={5}
                className="bg-gray-800 border-gray-700 focus:border-white"
              />
            </div>

            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
