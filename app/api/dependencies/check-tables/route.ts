import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check if tables exist
    const tables = {
      dependencies: false,
      dependency_settings: false,
      security_audits: false,
      dependency_compatibility: false,
    }

    // Check dependencies table
    const { data: dependenciesData, error: dependenciesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "dependencies")
      .eq("table_schema", "public")

    if (!dependenciesError && dependenciesData && dependenciesData.length > 0) {
      tables.dependencies = true
    }

    // Check dependency_settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "dependency_settings")
      .eq("table_schema", "public")

    if (!settingsError && settingsData && settingsData.length > 0) {
      tables.dependency_settings = true
    }

    // Check security_audits table
    const { data: auditsData, error: auditsError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "security_audits")
      .eq("table_schema", "public")

    if (!auditsError && auditsData && auditsData.length > 0) {
      tables.security_audits = true
    }

    // Check dependency_compatibility table
    const { data: compatibilityData, error: compatibilityError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", "dependency_compatibility")
      .eq("table_schema", "public")

    if (!compatibilityError && compatibilityData && compatibilityData.length > 0) {
      tables.dependency_compatibility = true
    }

    return NextResponse.json({ tables })
  } catch (error) {
    console.error("Error checking tables:", error)
    return NextResponse.json(
      { error: "Failed to check tables: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
