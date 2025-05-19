"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import ProjectSearchBar from "./project-search-bar"

interface HeroSectionProps {
  title?: string
  subtitle?: string
  backgroundImage?: string
}

export default function HeroSection({
  title = "Milo Presedo",
  subtitle = "Director of Photography, Camera Assistant, Drone & Underwater Operator",
  backgroundImage = "/images/hero-bg.jpg",
}: HeroSectionProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="relative h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{title}</h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">{subtitle}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative h-screen flex items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="text-center px-4 max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-white mb-4"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-8"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <ProjectSearchBar placeholder="Search projects by title, category, or role..." />
        </motion.div>
      </div>
    </div>
  )
}
