import { Suspense } from "react"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ServicesSection from "@/components/services-section"
import ContactSection from "@/components/contact-section"
import { getProjects, isDatabaseSetup } from "@/lib/project-data"
import DatabaseSetupAlert from "@/components/database-setup-alert"

export default async function Home() {
  // Check if database is set up
  const dbSetup = await isDatabaseSetup()

  // Get projects - this will return mock data if the database isn't set up
  const projects = await getProjects()

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
            <p className="text-gray-400">© {new Date().getFullYear()} Milo Presedo. All rights reserved.</p>
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
