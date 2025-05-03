import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Create the site_settings table directly with SQL
    const { error: createTableError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS site_settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (createTableError) {
      console.error("Error creating site_settings table:", createTableError)

      // Try an alternative approach if the RPC method fails
      try {
        // Use the query builder approach as a fallback
        const { error: queryError } = await supabase.from("site_settings").select("*").limit(1)

        if (queryError && queryError.code === "42P01") {
          // Table doesn't exist, so we need to create it
          // Use the REST API to create the table
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              query: `
                CREATE TABLE IF NOT EXISTS site_settings (
                  id SERIAL PRIMARY KEY,
                  key TEXT UNIQUE NOT NULL,
                  value TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
              `,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Failed to create table via REST API: ${JSON.stringify(errorData)}`)
          }
        } else if (queryError) {
          throw new Error(`Error checking table existence: ${queryError.message}`)
        }
      } catch (fallbackError: any) {
        console.error("Fallback approach failed:", fallbackError)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create site_settings table: ${createTableError.message}. Fallback also failed: ${fallbackError.message}`,
          },
          { status: 500 },
        )
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
