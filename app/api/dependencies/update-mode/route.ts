import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { id, updateMode } = await request.json()

    if (!id || !updateMode) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "Both id and updateMode are required.",
        },
        { status: 400 },
      )
    }

    // Validate update mode
    const validModes = ["global", "off", "conservative", "aggressive"]
    if (!validModes.includes(updateMode)) {
      return NextResponse.json(
        {
          error: "Invalid update mode",
          message: `Update mode must be one of: ${validModes.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // In a database-backed system, this would update the dependency's update mode
    // Since we're not using a database, we'll just return a success message

    return NextResponse.json({
      success: true,
      message: `Update mode for ${id} has been set to ${updateMode}.`,
    })
  } catch (error) {
    console.error("Error updating dependency mode:", error)
    return NextResponse.json({
      error: "An unexpected error occurred",
      message: "There was an unexpected error updating the dependency mode.",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
