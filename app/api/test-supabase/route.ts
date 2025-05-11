import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { query } = body

    let result: any = null
    let error: any = null

    // Run different test queries based on the requested test
    switch (query) {
      case "auth":
        // Test auth configuration
        const { data: authSettings } = await supabase.auth.getSession()
        result = {
          sessionExists: !!authSettings.session,
          provider: "supabase",
        }
        break

      case "roles":
        // Test roles table access
        const { data: roles, error: rolesError } = await supabase.from("roles").select("id, name").limit(5)
        if (rolesError) {
          error = rolesError
        } else {
          result = { roles }
        }
        break

      case "users":
        // Test users access (admin only)
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
        if (usersError) {
          error = usersError
        } else {
          result = {
            userCount: users.users.length,
            firstUser:
              users.users.length > 0
                ? {
                    id: users.users[0].id,
                    email: users.users[0].email,
                    confirmed: !!users.users[0].email_confirmed_at,
                  }
                : null,
          }
        }
        break

      case "storage":
        // Test storage access
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        if (bucketsError) {
          error = bucketsError
        } else {
          result = { buckets }
        }
        break

      default:
        // Basic connectivity test
        const { data, error: testError } = await supabase
          .from("roles")
          .select("count()", { count: "exact", head: true })
        if (testError) {
          error = testError
        } else {
          result = { connected: true, count: data }
        }
    }

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in test-supabase endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
