import { NextRequest, NextResponse } from "next/server"
import { getAllProjectsForAdmin } from "@/lib/project-data-server"
import { requireAdmin } from "@/lib/auth-server"

export async function GET(req: NextRequest) {
  // Check admin permission
  const adminCheck = await requireAdmin(req)
  if (adminCheck) {
    return adminCheck // Return error response
  }

  try {
    const projects = await getAllProjectsForAdmin()
    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching admin projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}