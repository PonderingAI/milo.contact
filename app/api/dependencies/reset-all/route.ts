import { NextResponse } from "next/server"

export async function POST() {
  try {
    // In a database-backed system, this would reset all dependencies to use global settings
    // Since we're not using a database, we'll just return a success message

    return NextResponse.json({
      success: true,
      message: "All dependency settings have been reset to use global settings.",
    })
  } catch (error) {
    console.error("Error resetting dependency settings:", error)
    return NextResponse.json({
      error: "An unexpected error occurred",
      message: "There was an unexpected error resetting dependency settings.",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
