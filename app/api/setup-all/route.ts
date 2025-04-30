import { createAdminClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Create site_settings table if it doesn't exist
    const { error: createTableError } = await supabase.rpc("create_site_settings_table").maybeSingle()

    if (createTableError && createTableError.code !== "42P01" && !createTableError.message.includes("already exists")) {
      console.error("Error creating site_settings table:", createTableError)
    }

    // 2. Create media table for unified media management
    const { error: createMediaTableError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        filesize INTEGER NOT NULL,
        filetype TEXT NOT NULL,
        public_url TEXT NOT NULL,
        thumbnail_url TEXT,
        tags TEXT[] DEFAULT '{}',
        metadata JSONB DEFAULT '{}'::jsonb,
        usage_locations JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    if (createMediaTableError) {
      console.error("Error creating media table:", createMediaTableError)
    }

    // 3. Create RLS policies for media table
    const { error: createPolicyError } = await supabase.query(`
      BEGIN;
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow authenticated read access" ON media;
      DROP POLICY IF EXISTS "Allow authenticated insert access" ON media;
      DROP POLICY IF EXISTS "Allow authenticated update access" ON media;
      DROP POLICY IF EXISTS "Allow authenticated delete access" ON media;
      
      -- Enable RLS on the table
      ALTER TABLE media ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Allow authenticated read access" 
        ON media FOR SELECT 
        USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow authenticated insert access" 
        ON media FOR INSERT 
        WITH CHECK (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow authenticated update access" 
        ON media FOR UPDATE 
        USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Allow authenticated delete access" 
        ON media FOR DELETE 
        USING (auth.role() = 'authenticated');
      COMMIT;
    `)

    if (createPolicyError) {
      console.error("Error creating RLS policies:", createPolicyError)
    }

    // 4. Create storage buckets
    const buckets = ["public", "media"]

    for (const bucket of buckets) {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets()
      const bucketExists = existingBuckets?.some((b) => b.name === bucket)

      if (!bucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        })

        if (createBucketError) {
          console.error(`Error creating ${bucket} bucket:`, createBucketError)
        }
      }

      // Set bucket policies
      const { error: policyError } = await supabase.storage.from(bucket).createSignedUploadUrl("test-policy")
      if (policyError && !policyError.message.includes("The resource already exists")) {
        console.error(`Error setting policy for ${bucket} bucket:`, policyError)
      }
    }

    // 5. Insert default settings if they don't exist
    const { data: existingSettings } = await supabase.from("site_settings").select("key")
    const existingKeys = new Set(existingSettings?.map((s) => s.key) || [])

    const defaultSettings = [
      { key: "hero_heading", value: "Film Production & Photography" },
      { key: "hero_subheading", value: "Director of Photography, Camera Assistant, Drone & Underwater Operator" },
      { key: "image_hero_bg", value: "/images/hero-bg.jpg" },
      { key: "about_heading", value: "About Me" },
      { key: "about_text1", value: "I'm Milo Presedo, an AI Solutions Architect and film production professional." },
      { key: "about_text2", value: "My journey combines a solid educational background with hands-on experience." },
      { key: "about_text3", value: "In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature." },
      { key: "image_profile", value: "/images/profile.jpg" },
      { key: "services_heading", value: "Services" },
      { key: "contact_heading", value: "Get in Touch" },
      { key: "contact_text", value: "Connect with me to discuss AI, VR, film production, or photography projects." },
      { key: "contact_email", value: "milo.presedo@mailbox.org" },
      { key: "contact_phone", value: "+41 77 422 68 03" },
      { key: "chatgpt_url", value: "https://chatgpt.com/g/g-vOF4lzRBG-milo" },
      { key: "footer_text", value: `© ${new Date().getFullYear()} Milo Presedo. All rights reserved.` },
    ]

    const missingSettings = defaultSettings.filter((setting) => !existingKeys.has(setting.key))

    if (missingSettings.length > 0) {
      const { error: insertError } = await supabase.from("site_settings").insert(missingSettings)

      if (insertError) {
        console.error("Error inserting default settings:", insertError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
    })
  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    )
  }
}
