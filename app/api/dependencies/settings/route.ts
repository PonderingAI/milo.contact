import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { updateMode } = await request.json()

    if (!updateMode) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "updateMode is required.",
        },
        { status: 400 },
      )
    }

    // In a database-backed system, this would update the global update mode
    // Since we're not using a database, we'll just return a success message

    return NextResponse.json({
      success: true,
      message: `Global update mode has been set to ${updateMode}.`,
    })
  } catch (error) {
    console.error("Error updating global settings:", error)
    return NextResponse.json({
      error: "An unexpected error occurred",
      message: "There was an unexpected error updating the global settings.",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
