import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and has admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Error fetching user roles" }, { status: 500 })
    }

    const isAdmin = userRoles.some((r) => r.role === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 })
    }

    // Fetch settings
    const { data, error } = await supabase.from("site_settings").select("*")

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Error fetching settings" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and has admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError)
      return NextResponse.json({ error: "Error fetching user roles" }, { status: 500 })
    }

    const isAdmin = userRoles.some((r) => r.role === "admin")

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin role required" }, { status: 403 })
    }

    // Get settings from request body
    const settings = await request.json()

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 })
    }

    // Log the settings being saved
    console.log("Saving settings:", settings)

    // Update settings
    for (const setting of settings) {
      const { key, value } = setting

      // Check if setting exists
      const { data: existingSetting, error: checkError } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", key)
        .maybeSingle()

      if (checkError) {
        console.error(`Error checking setting ${key}:`, checkError)
        continue
      }

      if (existingSetting) {
        // Update existing setting
        const { error: updateError } = await supabase.from("site_settings").update({ value }).eq("key", key)

        if (updateError) {
          console.error(`Error updating setting ${key}:`, updateError)
        }
      } else {
        // Insert new setting
        const { error: insertError } = await supabase.from("site_settings").insert({ key, value })

        if (insertError) {
          console.error(`Error inserting setting ${key}:`, insertError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
