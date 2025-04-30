import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ServicesSection from "@/components/services-section"
import ContactSection from "@/components/contact-section"
import { createServerClient } from "@/lib/supabase"

export default async function Home() {
  // Get footer text from settings
  let footerText = "© 2023 Milo Presedo. All rights reserved."

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "footer_text").single()

    if (!error && data) {
      footerText = data.value
    }
  } catch (err) {
    console.error("Error loading footer text:", err)
  }

  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <ContactSection />

      <footer className="py-6 bg-black text-center text-gray-400 text-sm">{footerText}</footer>
    </main>
  )
}
