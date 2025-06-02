import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Add this function to check if a column exists in a table
async function columnExists(supabase: any, table: string, column: string) {
  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      query: `SELECT column_name FROM information_schema.columns 
              WHERE table_name = '${table}' AND column_name = '${column}'`,
    })

    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    console.error(`Error checking if column ${column} exists in ${table}:`, error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const req = await request.json()
    const { projectId, images, replaceExisting, skipSortOrder } = req

    const supabase = createRouteHandlerClient({ cookies })

    if (!projectId || !images || !Array.isArray(images)) {
      return NextResponse.json({ error: "Project ID and images are required" }, { status: 400 })
    }

    // Check if sort_order column exists
    const hasSortOrder = skipSortOrder ? false : await columnExists(supabase, "bts_images", "sort_order")

    if (replaceExisting) {
      const { error: deleteError } = await supabase.from("bts_images").delete().eq("project_id", projectId)

      if (deleteError) {
        console.error("Error deleting existing BTS images:", deleteError)
        return NextResponse.json({ error: "Error deleting existing BTS images" }, { status: 500 })
      }
    }

    const btsImageData = images.map((image, index) => {
      const baseData = {
        project_id: projectId,
        image_url: image,
      }

      // Only add sort_order if the column exists
      return hasSortOrder ? { ...baseData, sort_order: index } : baseData
    })

    const { data, error } = await supabase.from("bts_images").insert(btsImageData).select()

    if (error) {
      console.error("Error inserting BTS images:", error)
      return NextResponse.json({ error: "Error inserting BTS images" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
