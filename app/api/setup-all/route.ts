/**
 * Comprehensive Setup API
 *
 * This endpoint initializes all necessary database tables and storage buckets.
 * It's designed to be a one-click setup solution for the portfolio.
 */

import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()
    const results = {
      database: { success: false, message: "" },
      siteSettings: { success: false, message: "" },
      storage: { success: false, message: "" },
      mediaTable: { success: false, message: "" },
    }

    // 1. Check if site_settings table exists
    const { error: settingsCheckError } = await supabase.from("site_settings").select("key").limit(1).maybeSingle()

    if (settingsCheckError && settingsCheckError.code === "42P01") {
      // Create site_settings table
      const { error: createTableError } = await supabase.rpc("create_site_settings_table")

      if (createTableError) {
        results.siteSettings = {
          success: false,
          message: `Error creating site_settings table: ${createTableError.message}`,
        }
      } else {
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
          results.siteSettings = {
            success: false,
            message: `Error inserting default settings: ${insertError.message}`,
          }
        } else {
          results.siteSettings = {
            success: true,
            message: "Site settings table created and populated with defaults",
          }
        }
      }
    } else {
      results.siteSettings = {
        success: true,
        message: "Site settings table already exists",
      }
    }

    // 2. Check if projects table exists
    const { error: projectsCheckError } = await supabase.from("projects").select("id").limit(1).maybeSingle()

    if (projectsCheckError && projectsCheckError.code === "42P01") {
      // Create projects table using RPC
      const { error: createProjectsError } = await supabase.rpc("create_projects_table")

      if (createProjectsError) {
        results.database = {
          success: false,
          message: `Error creating projects table: ${createProjectsError.message}`,
        }
      } else {
        results.database = {
          success: true,
          message: "Projects table created successfully",
        }
      }
    } else {
      results.database = {
        success: true,
        message: "Projects table already exists",
      }
    }

    // 3. Check if media table exists
    const { error: mediaCheckError } = await supabase.from("media").select("id").limit(1).maybeSingle()

    if (mediaCheckError && mediaCheckError.code === "42P01") {
      // Create media table
      const { error: createMediaError } = await supabase.rpc("create_media_table")

      if (createMediaError) {
        // If the RPC doesn't exist, create the table directly
        const { error: directCreateError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS media (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            filesize INTEGER NOT NULL,
            filetype TEXT NOT NULL,
            public_url TEXT NOT NULL,
            thumbnail_url TEXT,
            tags TEXT[] DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            usage_locations JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)

        if (directCreateError) {
          results.mediaTable = {
            success: false,
            message: `Error creating media table: ${directCreateError.message}`,
          }
        } else {
          results.mediaTable = {
            success: true,
            message: "Media table created successfully via direct SQL",
          }
        }
      } else {
        results.mediaTable = {
          success: true,
          message: "Media table created successfully via RPC",
        }
      }
    } else {
      results.mediaTable = {
        success: true,
        message: "Media table already exists",
      }
    }

    // 4. Create storage buckets
    try {
      // Check existing buckets
      const { data: buckets } = await supabase.storage.listBuckets()
      const existingBuckets = new Set(buckets?.map((b) => b.name) || [])

      // Create required buckets if they don't exist
      const requiredBuckets = [
        { name: "projects", public: true, fileSizeLimit: 10485760 }, // 10MB
        { name: "icons", public: true, fileSizeLimit: 1048576 }, // 1MB
        { name: "media", public: true, fileSizeLimit: 52428800 }, // 50MB
        { name: "public", public: true, fileSizeLimit: 10485760 }, // 10MB
      ]

      for (const bucket of requiredBuckets) {
        if (!existingBuckets.has(bucket.name)) {
          const { error } = await supabase.storage.createBucket(bucket.name, {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
          })

          if (error && !error.message.includes("already exists")) {
            throw error
          }
        }
      }

      results.storage = {
        success: true,
        message: "Storage buckets created or verified successfully",
      }
    } catch (storageError: any) {
      results.storage = {
        success: false,
        message: `Error with storage buckets: ${storageError.message}`,
      }
    }

    return NextResponse.json({
      success:
        results.database.success &&
        results.siteSettings.success &&
        results.storage.success &&
        results.mediaTable.success,
      results,
    })
  } catch (error: any) {
    console.error("Error in setup-all:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
