import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { assignRole, removeRole } from "@/lib/server-auth-utils"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { userId: targetUserId, role, action } = body

    if (!targetUserId || !role || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user is a super admin
    const { getUser } = await import("@clerk/nextjs/server")
    const user = await getUser(userId)

    if (!user || user.publicMetadata?.superAdmin !== true) {
      return NextResponse.json({ error: "Only super admins can modify roles" }, { status: 403 })
    }

    // Update the role
    let success = false
    if (action === "add") {
      success = await assignRole(targetUserId, role)
    } else if (action === "remove") {
      success = await removeRole(targetUserId, role)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in toggle-role API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
