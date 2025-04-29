import { createServerClient } from "@/lib/supabase"
import { assignRole } from "@/lib/auth-utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Get the request body
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // Assign admin role to the user
    const success = await assignRole(userId, "admin")

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to assign admin role" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Admin role assigned successfully" })
  } catch (error) {
    console.error("Error assigning admin role:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error assigning admin role: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
