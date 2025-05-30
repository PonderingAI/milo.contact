import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { packageName, locked } = await request.json()

    // In a real implementation, this would update a database record
    // For now, we'll just return success

    return NextResponse.json({ success: true, packageName, locked })
  } catch (error) {
    console.error("Error in lock dependency API:", error)
    return NextResponse.json({ error: "Failed to lock/unlock dependency" }, { status: 500 })
  }
}
