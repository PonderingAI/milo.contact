import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Check if the site_settings table exists
    const { error: checkError } = await supabase.from("site_settings").select("key").limit(1)

    if (checkError && checkError.message.includes("relation") && checkError.message.includes("does not exist")) {
      // Create the site_settings table
      const { error: createError } = await supabase.rpc("create_site_settings_table")

      if (createError) {
        console.error("Error creating site_settings table:", createError)
        return NextResponse.json({ success: false, error: createError.message }, { status: 500 })
      }

      // Insert default settings
      const defaultSettings = [
        { key: "site_title", value: "Milo Presedo" },
        { key: "site_description", value: "Filmmaker & Photographer" },
        { key: "contact_email", value: "milo.presedo@mailbox.org" },
        { key: "instagram_url", value: "https://instagram.com/milo.presedo" },
        { key: "hero_heading", value: "Milo Presedo" },
        { key: "hero_subheading", value: "Filmmaker & Photographer" },
        { key: "about_heading", value: "About Me" },
        {
          key: "about_text",
          value:
            "I'm a filmmaker and photographer passionate about visual storytelling. With experience in directing, camera work, and production, I bring a comprehensive understanding to every project.",
        },
        { key: "services_heading", value: "My Work" },
        { key: "services_text", value: "Explore my portfolio of projects across different roles and categories." },
        { key: "contact_heading", value: "Get in Touch" },
        { key: "contact_text", value: "Interested in working together? Let's talk about your project!" },
        { key: "footer_text", value: `© ${new Date().getFullYear()} Milo Presedo. All rights reserved.` },
      ]

      const { error: insertError } = await supabase.from("site_settings").insert(defaultSettings)

      if (insertError) {
        console.error("Error inserting default settings:", insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Site settings table created and initialized" })
    }

    return NextResponse.json({ success: true, message: "Site settings table already exists" })
  } catch (error: any) {
    console.error("Error in setup-site-settings:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
