import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // SQL to create the site_settings table and set up policies
    const sql = `
      -- 1. Create the site_settings table
      CREATE TABLE IF NOT EXISTS public.site_settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 2. Insert default values
      INSERT INTO public.site_settings (key, value)
      VALUES
        ('site_title', 'Milo Presedo Portfolio'),
        ('site_description', 'Filmmaker and Cinematographer Portfolio'),
        ('hero_title', 'Milo Presedo'),
        ('hero_subtitle', 'Filmmaker & Cinematographer'),
        ('hero_background', '/images/hero-bg.jpg'),
        ('about_title', 'About Me'),
        ('about_content', 'I am a filmmaker and cinematographer based in San Francisco, California.'),
        ('profile_image', '/images/profile.jpg'),
        ('contact_email', 'contact@example.com'),
        ('contact_phone', '+1 (555) 123-4567'),
        ('social_instagram', 'https://instagram.com/username'),
        ('social_vimeo', 'https://vimeo.com/username'),
        ('social_linkedin', 'https://linkedin.com/in/username'),
        ('footer_text', '© 2023 Milo Presedo. All rights reserved.')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

      -- 3. Enable Row Level Security
      ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

      -- 4. Create policies for site_settings table
      -- Allow authenticated users to select
      CREATE POLICY IF NOT EXISTS "Allow authenticated users to select site_settings"
        ON public.site_settings
        FOR SELECT
        TO authenticated
        USING (true);

      -- Allow public to select
      CREATE POLICY IF NOT EXISTS "Allow public to select site_settings"
        ON public.site_settings
        FOR SELECT
        TO anon
        USING (true);

      -- Allow authenticated users with admin role to insert/update/delete
      CREATE POLICY IF NOT EXISTS "Allow admins to insert site_settings"
        ON public.site_settings
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
          )
        );

      CREATE POLICY IF NOT EXISTS "Allow admins to update site_settings"
        ON public.site_settings
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
          )
        );

      CREATE POLICY IF NOT EXISTS "Allow admins to delete site_settings"
        ON public.site_settings
        FOR DELETE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
          )
        );
    `

    // Try to execute the SQL directly
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error creating site_settings table:", error)

      // Try a different approach - direct SQL execution
      try {
        // Create table
        await supabase.from("site_settings").insert([{ key: "site_title", value: "Milo Presedo Portfolio" }])

        return NextResponse.json({ success: true })
      } catch (err) {
        console.error("Fallback also failed:", err)
        return NextResponse.json({ error: "Failed to create site_settings table" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in create-site-settings-table route:", error)
    return NextResponse.json({ error: "Failed to create site_settings table" }, { status: 500 })
  }
}
