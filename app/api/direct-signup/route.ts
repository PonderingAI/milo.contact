import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Create a Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase environment variables" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email)

    if (existingUser) {
      return NextResponse.json({ message: "User already exists, please sign in" }, { status: 200 })
    }

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Make the user an admin
    const { error: insertError } = await supabase.from("user_roles").insert([{ user_id: data.user.id, role: "admin" }])

    if (insertError) {
      console.error("Error assigning admin role:", insertError)
      // Continue anyway, the user is created
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
    })
  } catch (error) {
    console.error("Error in direct signup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
