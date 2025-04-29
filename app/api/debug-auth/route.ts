import { createAdminClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()

    // Get the request body
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    // Check if the user exists
    try {
      const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email)

      if (userError) {
        return NextResponse.json(
          {
            success: false,
            message: `Error checking user: ${userError.message}`,
            error: userError,
          },
          { status: 500 },
        )
      }

      if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
      }

      // Return user info (without sensitive data)
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at !== null,
          lastSignIn: user.last_sign_in_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          factors: user.factors ? user.factors.length : 0,
        },
      })
    } catch (error) {
      console.error("Error in getUserByEmail:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Error checking user: ${error instanceof Error ? error.message : String(error)}`,
          details: "This may be due to missing or invalid SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error debugging auth:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error debugging auth: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
