"use client"

import type React from "react"

import { useState, useEffect, type FormEvent } from "react"
import { Mail, Phone, MessageSquare, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ContactTableSetupGuide from "@/components/admin/contact-table-setup-guide"

export default function ContactSection() {
  const [settings, setSettings] = useState({
    contact_heading: "Get in Touch",
    contact_text:
      "Connect with me to discuss AI, VR, film production, or photography projects. I'm always open to new collaborations and opportunities.",
    contact_email: "milo.presedo@mailbox.org",
    contact_phone: "+41 77 422 68 03",
    chatgpt_url: "https://chatgpt.com/g/g-vOF4lzRBG-milo",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Check if user is admin
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .single()

          setIsAdmin(!!roles)
        }

        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["contact_heading", "contact_text", "contact_email", "contact_phone", "chatgpt_url"])

        if (error) {
          // If table doesn't exist, we'll use default values
          if (error.code === "42P01") {
            console.log("Site settings table doesn't exist yet. Using default values.")
          } else {
            console.error("Error loading contact settings:", error)
          }
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
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      // Basic validation
      if (!formData.name || !formData.email || !formData.message) {
        setSubmitError("Please fill in all fields")
        setIsSubmitting(false)
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setSubmitError("Please enter a valid email address")
        setIsSubmitting(false)
        return
      }

      // Submit the form data
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Show success message
      setSuccessMessage(data.message || "Thank you for your message! I will get back to you soon.")
      setSubmitSuccess(true)

      // Reset form
      setFormData({
        name: "",
        email: "",
        message: "",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitError(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-24">
      {isAdmin && <ContactTableSetupGuide />}

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

          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="bg-green-900/20 rounded-full p-3 mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h4 className="text-xl font-medium text-green-500 mb-2">Message Sent!</h4>
              <p className="text-center text-gray-300">{successMessage}</p>
              <Button onClick={() => setSubmitSuccess(false)} className="mt-6 bg-white text-black hover:bg-gray-200">
                Send Another Message
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {submitError && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-300">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-gray-400">
                  Name
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="bg-gray-800 border-gray-700 focus:border-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-gray-400">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  className="bg-gray-800 border-gray-700 focus:border-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-gray-400">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message"
                  rows={5}
                  className="bg-gray-800 border-gray-700 focus:border-white"
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
