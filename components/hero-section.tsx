"use client"

import { useEffect, useState } from "react"
import { ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function HeroSection() {
  const [scrolled, setScrolled] = useState(false)
  const [settings, setSettings] = useState({
    hero_heading: "Film Production & Photography",
    hero_subheading: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
    image_hero_bg: "/images/hero-bg.jpg",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["hero_heading", "hero_subheading", "image_hero_bg"])

        if (error) {
          console.error("Error loading hero settings:", error)
          return
        }

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "hero_heading") newSettings.hero_heading = item.value
            if (item.key === "hero_subheading") newSettings.hero_subheading = item.value
            if (item.key === "image_hero_bg") newSettings.image_hero_bg = item.value
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-gradient-to-b from-black/70 to-black"
        style={{
          backgroundImage: `url(${settings.image_hero_bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
        }}
      />

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "py-4 bg-black/90 backdrop-blur-sm" : "py-6",
        )}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a href="#" className="text-2xl font-serif">
            Milo Presedo
          </a>
          <nav className="hidden md:block">
            <ul className="flex gap-8">
              <li>
                <a href="#about" className="hover:text-gray-300 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-gray-300 transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#work" className="hover:text-gray-300 transition-colors">
                  Work
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-gray-300 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </nav>
          <button className="md:hidden">Menu</button>
        </div>
      </header>

      <div className="container mx-auto px-4 relative z-10">
        <h1 className="text-6xl md:text-9xl font-serif leading-tight max-w-4xl">
          <span className="block">{settings.hero_heading.split(" & ")[0]}</span>
          <span className="block">& {settings.hero_heading.split(" & ")[1] || "Photography"}</span>
        </h1>
        <p className="mt-6 text-xl md:text-2xl max-w-xl text-gray-300">{settings.hero_subheading}</p>
      </div>

      <a
        href="#about"
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-sm gap-2 animate-pulse"
      >
        <span>Scroll Down</span>
        <ArrowDown className="w-4 h-4" />
      </a>
    </section>
  )
}
