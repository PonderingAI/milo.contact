import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// GET: Retrieve tag order
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get all tag orders
    const { data, error } = await supabase.from("tag_order").select("*").order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching tag order:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in GET /api/tag-order:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}

// POST: Update tag order
export async function POST(request: NextRequest) {
  try {
    const { tagType, tags } = await request.json()

    if (!tagType || !Array.isArray(tags)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // First, delete existing entries for this tag type
    const { error: deleteError } = await supabase.from("tag_order").delete().eq("tag_type", tagType)

    if (deleteError) {
      console.error(`Error deleting existing ${tagType} tag order:`, deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Then insert the new order
    const tagsToInsert = tags.map((tag, index) => ({
      tag_type: tagType,
      tag_name: tag,
      display_order: index,
    }))

    const { error: insertError } = await supabase.from("tag_order").insert(tagsToInsert)

    if (insertError) {
      console.error(`Error inserting ${tagType} tag order:`, insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in POST /api/tag-order:", error)
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 })
  }
}
