import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Direct SQL approach using PostgreSQL client
    const { data, error } = await supabase
      .from("_pgsql")
      .select("*")
      .rpc("query", {
        query: `
        CREATE TABLE IF NOT EXISTS site_settings (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings if they don't exist
        INSERT INTO site_settings (key, value)
        VALUES 
          ('hero_heading', 'Film Production & Photography'),
          ('hero_subheading', 'Director of Photography, Camera Assistant, Drone & Underwater Operator'),
          ('image_hero_bg', '/images/hero-bg.jpg'),
          ('about_heading', 'About Me'),
          ('about_text1', 'I''m Milo Presedo, an AI Solutions Architect and film production professional. Fluent in German, Spanish and English, I love diving into the latest AI models, VR technologies, and complex problem-solving.'),
          ('about_text2', 'My journey combines a solid educational background with hands-on experience in computer science, graphic design, and film production. I work as a Director of Photography (DP), 1st and 2nd Assistant Camera (1AC & 2AC), as well as a drone and underwater operator.'),
          ('about_text3', 'In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature, which often inspires my landscape and product photography work.'),
          ('image_profile', '/images/profile.jpg'),
          ('services_heading', 'Services'),
          ('contact_heading', 'Get in Touch'),
          ('contact_text', 'Connect with me to discuss AI, VR, film production, or photography projects. I''m always open to new collaborations and opportunities.'),
          ('contact_email', 'milo.presedo@mailbox.org'),
          ('contact_phone', '+41 77 422 68 03'),
          ('chatgpt_url', 'https://chatgpt.com/g/g-vOF4lzRBG-milo'),
          ('footer_text', '© 2023 Milo Presedo. All rights reserved.'),
          ('icon_favicon_ico', '/favicon.ico'),
          ('icon_favicon_16x16_png', '/favicon-16x16.png'),
          ('icon_favicon_32x32_png', '/favicon-32x32.png'),
          ('icon_apple_touch_icon', '/apple-touch-icon.png')
        ON CONFLICT (key) DO NOTHING;
      `,
      })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Site settings table created and populated with defaults",
    })
  } catch (error: any) {
    console.error("Error in create-site-settings-table:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
