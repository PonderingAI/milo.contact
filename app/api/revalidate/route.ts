import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase-server"
import { headers } from "next/headers"

/**
 * API route for cache revalidation
 *
 * This endpoint allows authorized users to revalidate specific paths or the entire site.
 * It's used to ensure content changes are immediately visible without requiring a full deployment.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { path } = body

    // Basic validation
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Invalid path parameter" }, { status: 400 })
    }

    // Security check - verify the request is coming from an authenticated admin user
    // This uses the supabase client to verify the session
    const headersList = headers()
    const authHeader = headersList.get("authorization")

    if (process.env.NODE_ENV === "production") {
      // Only perform auth check in production to avoid issues during development
      if (!authHeader) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      try {
        const supabase = createAdminClient()
        const token = authHeader.replace("Bearer ", "")

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token)

        if (error || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user has admin role
        const isAdmin = user.app_metadata?.role === "admin"

        if (!isAdmin) {
          return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
        }
      } catch (authError) {
        console.error("Auth verification error:", authError)
        return NextResponse.json({ error: "Authentication error" }, { status: 500 })
      }
    }

    // Revalidate the path
    revalidatePath(path)

    // Log the revalidation for monitoring
    console.log(`Cache revalidated for path: ${path}`)

    return NextResponse.json({ revalidated: true, path })
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ error: "Failed to revalidate cache" }, { status: 500 })
  }
}
