import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if the site_settings table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("site_settings")
      .select("key")
      .limit(1)
      .maybeSingle()

    if (tableCheckError && tableCheckError.code === "42P01") {
      // Table doesn't exist, create it
      const { error: createTableError } = await supabase.rpc("create_site_settings_table")

      if (createTableError) {
        console.error("Error creating site_settings table:", createTableError)
        return NextResponse.json({ success: false, error: createTableError.message }, { status: 500 })
      }

      // Insert default settings
      const defaultSettings = [
        { key: "hero_heading", value: "Film Production & Photography" },
        { key: "hero_subheading", value: "Director of Photography, Camera Assistant, Drone & Underwater Operator" },
        { key: "image_hero_bg", value: "/images/hero-bg.jpg" },
        { key: "about_heading", value: "About Me" },
        {
          key: "about_text1",
          value:
            "I'm Milo Presedo, an AI Solutions Architect and film production professional. Fluent in German, Spanish and English, I love diving into the latest AI models, VR technologies, and complex problem-solving.",
        },
        {
          key: "about_text2",
          value:
            "My journey combines a solid educational background with hands-on experience in computer science, graphic design, and film production. I work as a Director of Photography (DP), 1st and 2nd Assistant Camera (1AC & 2AC), as well as a drone and underwater operator.",
        },
        {
          key: "about_text3",
          value:
            "In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature, which often inspires my landscape and product photography work.",
        },
        { key: "image_profile", value: "/images/profile.jpg" },
        { key: "services_heading", value: "Services" },
        { key: "contact_heading", value: "Get in Touch" },
        {
          key: "contact_text",
          value:
            "Connect with me to discuss AI, VR, film production, or photography projects. I'm always open to new collaborations and opportunities.",
        },
        { key: "contact_email", value: "milo.presedo@mailbox.org" },
        { key: "contact_phone", value: "+41 77 422 68 03" },
        { key: "chatgpt_url", value: "https://chatgpt.com/g/g-vOF4lzRBG-milo" },
        { key: "footer_text", value: `© ${new Date().getFullYear()} Milo Presedo. All rights reserved.` },
      ]

      const { error: insertError } = await supabase.from("site_settings").insert(defaultSettings)

      if (insertError) {
        console.error("Error inserting default settings:", insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Site settings table created and populated with defaults" })
    } else {
      // Table exists, check if we need to add any missing default settings
      const { data: existingSettings, error: fetchError } = await supabase.from("site_settings").select("key, value")

      if (fetchError) {
        console.error("Error fetching existing settings:", fetchError)
        return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
      }

      // Create a map of existing settings
      const existingKeys = new Set(existingSettings?.map((setting) => setting.key) || [])

      // Define default settings that should exist
      const defaultSettings = [
        { key: "hero_heading", value: "Film Production & Photography" },
        { key: "hero_subheading", value: "Director of Photography, Camera Assistant, Drone & Underwater Operator" },
        { key: "image_hero_bg", value: "/images/hero-bg.jpg" },
        { key: "about_heading", value: "About Me" },
        {
          key: "about_text1",
          value:
            "I'm Milo Presedo, an AI Solutions Architect and film production professional. Fluent in German, Spanish and English, I love diving into the latest AI models, VR technologies, and complex problem-solving.",
        },
        {
          key: "about_text2",
          value:
            "My journey combines a solid educational background with hands-on experience in computer science, graphic design, and film production. I work as a Director of Photography (DP), 1st and 2nd Assistant Camera (1AC & 2AC), as well as a drone and underwater operator.",
        },
        {
          key: "about_text3",
          value:
            "In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature, which often inspires my landscape and product photography work.",
        },
        { key: "image_profile", value: "/images/profile.jpg" },
        { key: "services_heading", value: "Services" },
        { key: "contact_heading", value: "Get in Touch" },
        {
          key: "contact_text",
          value:
            "Connect with me to discuss AI, VR, film production, or photography projects. I'm always open to new collaborations and opportunities.",
        },
        { key: "contact_email", value: "milo.presedo@mailbox.org" },
        { key: "contact_phone", value: "+41 77 422 68 03" },
        { key: "chatgpt_url", value: "https://chatgpt.com/g/g-vOF4lzRBG-milo" },
        { key: "footer_text", value: `© ${new Date().getFullYear()} Milo Presedo. All rights reserved.` },
      ]

      // Filter out settings that already exist
      const missingSettings = defaultSettings.filter((setting) => !existingKeys.has(setting.key))

      // Insert any missing settings
      if (missingSettings.length > 0) {
        const { error: insertError } = await supabase.from("site_settings").insert(missingSettings)

        if (insertError) {
          console.error("Error inserting missing settings:", insertError)
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: `Site settings table exists, added ${missingSettings.length} missing default settings`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Site settings table already exists with all required settings",
    })
  } catch (error: any) {
    console.error("Error in setup-site-settings:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
