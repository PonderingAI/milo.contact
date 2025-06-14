import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get favicon URL from settings
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "favicon").single()

    if (error || !data) {
      // Return default favicon with caching
      const response = NextResponse.redirect(new URL("/favicon.ico", process.env.NEXT_PUBLIC_SITE_URL))
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      return response
    }

    // Redirect to the favicon URL with caching
    const response = NextResponse.redirect(data.value)
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    return response
  } catch (error) {
    console.error("Error serving favicon:", error)
    // Return default favicon with caching
    const response = NextResponse.redirect(new URL("/favicon.ico", process.env.NEXT_PUBLIC_SITE_URL))
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    return response
  }
}
