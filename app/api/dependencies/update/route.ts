import { NextResponse } from "next/server"
import { updateDependency } from "@/lib/dependency-utils"

export async function POST(request: Request) {
  try {
    const { name, version } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Package name is required" }, { status: 400 })
    }

    const result = await updateDependency(name, version)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to update dependency",
          details: result.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      name,
      newVersion: result.newVersion,
    })
  } catch (error) {
    console.error("Error updating dependency:", error)
    return NextResponse.json(
      {
        error: "Failed to update dependency",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
