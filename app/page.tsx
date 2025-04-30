"use client"

import { Suspense, useState, useEffect } from "react"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ServicesSection from "@/components/services-section"
import ContactSection from "@/components/contact-section"
import { getProjects, isDatabaseSetup } from "@/lib/project-data"
import DatabaseSetupAlert from "@/components/database-setup-alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function Home() {
  const [dbSetup, setDbSetup] = useState(false)
  const [projects, setProjects] = useState([])
  const [footerText, setFooterText] = useState(`© ${new Date().getFullYear()} Milo Presedo. All rights reserved.`)
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Check if database is set up
        const isSetup = await isDatabaseSetup()
        setDbSetup(isSetup)

        // Get projects
        const projectsData = await getProjects()
        setProjects(projectsData)

        // Get footer text
        const { data, error } = await supabase.from("site_settings").select("value").eq("key", "footer_text").single()

        if (!error && data) {
          setFooterText(data.value)
        }
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <HeroSection />

      <div className="container mx-auto px-4 py-24">
        <DatabaseSetupAlert isSetup={dbSetup} />

        <AboutSection />
        <Suspense fallback={<div>Loading services...</div>}>
          <ServicesSection projects={projects} />
        </Suspense>
        <ContactSection />
      </div>

      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">{footerText}</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="https://instagram.com/milo.presedo" className="text-gray-400 hover:text-white">
                Instagram
              </a>
              <a href="https://chatgpt.com/g/g-vOF4lzRBG-milo" className="text-gray-400 hover:text-white">
                ChatGPT
              </a>
              <a href="mailto:milo.presedo@mailbox.org" className="text-gray-400 hover:text-white">
                Email
              </a>
              <a href="/admin" className="text-gray-400 hover:text-white">
                Admin
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
