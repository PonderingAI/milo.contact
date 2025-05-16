import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

// Update a BTS image
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const imageId = params.id
    const { caption, category } = await request.json()

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Update the BTS image
    const { data, error } = await supabase.from("bts_images").update({ caption, category }).eq("id", imageId).select()

    if (error) {
      console.error("Error updating BTS image:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: "BTS image updated successfully",
    })
  } catch (error) {
    console.error("Unexpected error updating BTS image:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Delete a BTS image
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const imageId = params.id

    // Use the admin client to bypass RLS
    const supabase = createAdminClient()

    // Delete the BTS image
    const { error } = await supabase.from("bts_images").delete().eq("id", imageId)

    if (error) {
      console.error("Error deleting BTS image:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "BTS image deleted successfully",
    })
  } catch (error) {
    console.error("Unexpected error deleting BTS image:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
