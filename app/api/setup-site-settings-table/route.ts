import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Create the site_settings table if it doesn't exist
    const { error: createTableError } = await supabase.rpc("create_site_settings_table")

    if (createTableError) {
      console.error("Error creating site_settings table:", createTableError)

      // If the function doesn't exist, create the table directly
      if (createTableError.message.includes("does not exist")) {
        const { error: sqlError } = await supabase
          .from("_exec_sql")
          .select("*")
          .eq(
            "query",
            `
          CREATE TABLE IF NOT EXISTS site_settings (
            id SERIAL PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
          )
          .single()

        if (sqlError) {
          console.error("Error creating table directly:", sqlError)
          return NextResponse.json({ success: false, error: sqlError.message }, { status: 500 })
        }
      } else {
        return NextResponse.json({ success: false, error: createTableError.message }, { status: 500 })
      }
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
      // Add default favicon entries
      { key: "icon_favicon_ico", value: "/favicon.ico" },
      { key: "icon_favicon_16x16_png", value: "/favicon-16x16.png" },
      { key: "icon_favicon_32x32_png", value: "/favicon-32x32.png" },
      { key: "icon_apple_touch_icon", value: "/apple-touch-icon.png" },
    ]

    // Use upsert to insert or update settings
    const { error: insertError } = await supabase.from("site_settings").upsert(defaultSettings, {
      onConflict: "key",
    })

    if (insertError) {
      console.error("Error inserting default settings:", insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Site settings table created and populated with defaults" })
  } catch (error: any) {
    console.error("Error in setup-site-settings-table:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
