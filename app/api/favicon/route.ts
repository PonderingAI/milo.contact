import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get favicon URL from settings
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "favicon").single()

    if (error || !data) {
      // Return default favicon
      return NextResponse.redirect(new URL("/favicon.ico", process.env.NEXT_PUBLIC_SITE_URL))
    }

    // Redirect to the favicon URL
    return NextResponse.redirect(data.value)
  } catch (error) {
    console.error("Error serving favicon:", error)
    // Return default favicon
    return NextResponse.redirect(new URL("/favicon.ico", process.env.NEXT_PUBLIC_SITE_URL))
  }
}
