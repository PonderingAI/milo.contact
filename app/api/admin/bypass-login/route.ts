import { createAdminClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    // Use the admin client for this operation
    const supabase = createAdminClient()

    // First, try to get the user by email
    const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError) {
      console.error("Error getting user:", userError)
      return NextResponse.json({ success: false, message: userError.message }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Create a new session for the user
    const { data: session, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: user.id,
      // Set a reasonable expiration time (e.g., 24 hours)
      expires_in: 60 * 60 * 24,
    })

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return NextResponse.json({ success: false, message: sessionError.message }, { status: 500 })
    }

    // Set the session cookie
    const cookieStore = cookies()
    cookieStore.set("sb-access-token", session.access_token, {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    cookieStore.set("sb-refresh-token", session.refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Error in bypass-login endpoint:", error)
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
