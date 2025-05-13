import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// This endpoint can be called by a cron job (e.g., Vercel Cron)
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Find projects that are scheduled to be published and the scheduled date has passed
    const { data, error } = await supabase
      .from("projects")
      .update({ published: true })
      .eq("published", false)
      .lt("scheduled_publish_date", new Date().toISOString())
      .is("scheduled_publish_date", "not.null")
      .select("id, title")

    if (error) {
      console.error("Error publishing scheduled projects:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Published ${data.length} scheduled projects`,
      publishedProjects: data,
    })
  } catch (error: any) {
    console.error("Error in scheduled publishing:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
