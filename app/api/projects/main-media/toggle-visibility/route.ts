import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkAdminPermission } from "@/lib/auth-server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and has admin role
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get authenticated Supabase client with service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Parse request body
    const { mediaId, isHidden } = await request.json()

    if (!mediaId || typeof isHidden !== 'boolean') {
      return NextResponse.json({ 
        error: "Media ID and visibility state are required" 
      }, { status: 400 })
    }

    // Check if user has admin role
    const hasAdminPermission = await checkAdminPermission(userId)
    
    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: "Permission denied. Admin role required." 
      }, { status: 403 })
    }

    // Update the thumbnail visibility
    const { data, error } = await supabase
      .from("main_media")
      .update({ is_thumbnail_hidden: isHidden })
      .eq("id", mediaId)
      .select()

    if (error) {
      console.error("Error updating thumbnail visibility:", error)
      return NextResponse.json({ 
        error: "Error updating thumbnail visibility",
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
      message: `Thumbnail ${isHidden ? 'hidden' : 'shown'} successfully`
    })
  } catch (error) {
    console.error("Error in toggle-visibility API:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 