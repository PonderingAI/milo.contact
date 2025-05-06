import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Mock data for now - in a real implementation, this would read from package.json
    // and check for updates using npm registry API
    const dependencies = [
      {
        name: "next",
        currentVersion: "14.0.3",
        latestVersion: "14.0.4",
        outdated: true,
        locked: false,
        description: "The React Framework",
        hasSecurityIssue: false,
      },
      {
        name: "react",
        currentVersion: "18.2.0",
        latestVersion: "18.2.0",
        outdated: false,
        locked: false,
        description: "React is a JavaScript library for building user interfaces",
        hasSecurityIssue: false,
      },
      {
        name: "postcss",
        currentVersion: "8.4.29",
        latestVersion: "8.4.31",
        outdated: true,
        locked: false,
        description: "Tool for transforming styles with JS plugins",
        hasSecurityIssue: true,
      },
      {
        name: "tailwindcss",
        currentVersion: "3.3.3",
        latestVersion: "3.3.5",
        outdated: true,
        locked: true,
        description: "A utility-first CSS framework for rapidly building custom user interfaces",
        hasSecurityIssue: false,
      },
      {
        name: "typescript",
        currentVersion: "5.2.2",
        latestVersion: "5.3.2",
        outdated: true,
        locked: false,
        description: "TypeScript is a language for application-scale JavaScript",
        hasSecurityIssue: false,
      },
      {
        name: "nodemailer",
        currentVersion: "6.9.7",
        latestVersion: "6.9.7",
        outdated: false,
        locked: false,
        description: "Easy as cake e-mail sending from your Node.js applications",
        hasSecurityIssue: false,
      },
    ]

    // Get settings from database
    const { data: settings, error } = await supabase.from("dependency_settings").select("*").limit(1).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching dependency settings:", error)
    }

    return NextResponse.json({
      dependencies,
      autoUpdateEnabled: settings?.auto_update_enabled || false,
      conservativeMode: settings?.conservative_mode || true,
    })
  } catch (error) {
    console.error("Error in dependencies API:", error)
    return NextResponse.json({ error: "Failed to fetch dependencies" }, { status: 500 })
  }
}
