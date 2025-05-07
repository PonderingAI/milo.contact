import { NextResponse } from "next/server"
import { initializeScheduledTasks } from "@/lib/scheduled-tasks"

let initialized = false

export async function GET() {
  try {
    if (!initialized) {
      initializeScheduledTasks()
      initialized = true
    }

    return NextResponse.json({
      success: true,
      message: "Dependency management system initialized",
    })
  } catch (error) {
    console.error("Error initializing dependency management system:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize dependency management system",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
