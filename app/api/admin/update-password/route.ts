import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get the user by email
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError || !user) {
      return NextResponse.json({ success: false, message: userError?.message || "User not found" }, { status: 404 })
    }

    // Update the user's password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
    })

    if (error) {
      console.error("Error updating password:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Error in update-password endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
