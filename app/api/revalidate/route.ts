import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

// Track revalidation requests to prevent abuse
const revalidationRequests: Record<string, { count: number; lastReset: number }> = {}
const MAX_REQUESTS_PER_MINUTE = 10
const RESET_INTERVAL = 60000 // 1 minute

/**
 * API route for cache revalidation
 *
 * This endpoint allows authorized users to revalidate specific paths or the entire site.
 * It's used to ensure content changes are immediately visible without requiring a full deployment.
 * Includes rate limiting to prevent abuse.
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

    // Get client IP for rate limiting
    const clientIp = request.ip || "unknown"

    // Rate limiting
    const now = Date.now()
    if (!revalidationRequests[clientIp]) {
      revalidationRequests[clientIp] = { count: 0, lastReset: now }
    }

    // Reset counter if it's been more than a minute
    if (now - revalidationRequests[clientIp].lastReset > RESET_INTERVAL) {
      revalidationRequests[clientIp] = { count: 0, lastReset: now }
    }

    // Check if rate limit exceeded
    if (revalidationRequests[clientIp].count >= MAX_REQUESTS_PER_MINUTE) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 })
    }

    // Increment request counter
    revalidationRequests[clientIp].count++

    // In development, skip auth check
    if (process.env.NODE_ENV !== "production") {
      // Revalidate the path
      revalidatePath(path)
      console.log(`[DEV] Cache revalidated for path: ${path}`)
      return NextResponse.json({ revalidated: true, path })
    }

    // In production, verify user is authenticated
    try {
      // Get the user's session from cookies
      const cookieStore = cookies()
      const supabase = createServerClient()

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error("Session error:", sessionError)
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Check if user has admin role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single()

      if (userError) {
        console.error("User role check error:", userError)
        return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 })
      }

      const isAdmin = userData?.role === "admin"

      if (!isAdmin) {
        return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
      }

      // Revalidate the path
      revalidatePath(path)
      console.log(`Cache revalidated for path: ${path} by user: ${session.user.id}`)
      return NextResponse.json({ revalidated: true, path })
    } catch (authError) {
      console.error("Auth verification error:", authError)
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Revalidation error:", error)
    return NextResponse.json({ error: "Failed to revalidate cache" }, { status: 500 })
  }
}
