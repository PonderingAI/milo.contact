import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if the user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user has admin role
    const { data: userRoles } = await supabase.from("user_roles").select("*").eq("user_id", user.id).single()

    if (!userRoles || !userRoles.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create the BTS images table
    await supabase.rpc("create_bts_images_table")

    return NextResponse.json({ success: true, message: "BTS images table created successfully" })
  } catch (error: any) {
    console.error("Error creating BTS images table:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
