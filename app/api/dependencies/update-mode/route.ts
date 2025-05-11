import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get the request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate the request body
    if (!body || !body.mode) {
      return NextResponse.json({ error: "Missing required parameter: mode" }, { status: 400 })
    }

    const { mode } = body

    // Validate the mode value
    const validModes = ["manual", "prompt", "auto-minor", "auto-all"]
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode value. Must be one of: " + validModes.join(", ") },
        { status: 400 },
      )
    }

    // For now, just return success
    // In a real implementation, this would save to a database
    return NextResponse.json({
      success: true,
      updateMode: mode,
    })
  } catch (error) {
    console.error("Error in update-mode:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
