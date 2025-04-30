"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

export default function ServicesSection() {
  const [settings, setSettings] = useState({
    services_heading: "Services",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase.from("site_settings").select("key, value").eq("key", "services_heading")

        if (!error && data && data.length > 0) {
          setSettings({
            ...settings,
            services_heading: data[0].value,
          })
        }
      } catch (err) {
        console.error("Error loading services settings:", err)
      }
    }

    loadSettings()
  }, [])

  return (
    <section id="services" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{settings.services_heading}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link href="/projects?type=directed" className="group">
            <div className="bg-gray-900 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <div className="h-48 overflow-hidden">
                <img
                  src="/images/project1.jpg"
                  alt="Directing"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Directing</h3>
                <p className="text-gray-400">Creative direction for films, commercials, and music videos.</p>
              </div>
            </div>
          </Link>

          <Link href="/projects?type=camera" className="group">
            <div className="bg-gray-900 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <div className="h-48 overflow-hidden">
                <img
                  src="/images/project2.jpg"
                  alt="Camera Work"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Camera Work</h3>
                <p className="text-gray-400">Professional camera operation and cinematography services.</p>
              </div>
            </div>
          </Link>

          <Link href="/projects?type=production" className="group">
            <div className="bg-gray-900 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <div className="h-48 overflow-hidden">
                <img
                  src="/images/project3.jpg"
                  alt="Production"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Production</h3>
                <p className="text-gray-400">End-to-end production services for various media projects.</p>
              </div>
            </div>
          </Link>

          <Link href="/projects?type=photography" className="group">
            <div className="bg-gray-900 rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <div className="h-48 overflow-hidden">
                <img
                  src="/images/project4.jpg"
                  alt="Photography"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Photography</h3>
                <p className="text-gray-400">Professional photography for various subjects and occasions.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
