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

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            confirmed: !!existingUser.email_confirmed_at,
          },
        },
        { status: 400 },
      )
    }

    // Create the user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    })

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    // Assign admin role to the user
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/assign-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: data.user.id }),
      })
    } catch (roleError) {
      console.error("Error assigning admin role:", roleError)
      // Continue anyway, the user is created
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        confirmed: !!data.user.email_confirmed_at,
      },
    })
  } catch (error) {
    console.error("Error in create-user endpoint:", error)
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
