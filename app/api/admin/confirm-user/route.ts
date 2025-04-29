import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get the user by email
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError || !user) {
      return NextResponse.json({ success: false, message: userError?.message || "User not found" }, { status: 404 })
    }

    // Check if user is already confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: "User is already confirmed",
        confirmed: true,
      })
    }

    // Update the user to confirm their email
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (error) {
      console.error("Error confirming user:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "User confirmed successfully",
    })
  } catch (error) {
    console.error("Error in confirm-user endpoint:", error)
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
