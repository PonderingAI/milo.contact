import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { assignRole, removeRole } from "@/lib/server-auth-utils"

export async function POST(request: Request) {
  try {
    console.log("[toggle-role] API called")
    
    // Check if user is authenticated
    const { userId } = auth()
    if (!userId) {
      console.log("[toggle-role] No authenticated user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[toggle-role] Authenticated user: ${userId}`)

    // Parse request body
    const body = await request.json()
    const { userId: targetUserId, role, action } = body

    console.log(`[toggle-role] Request body:`, { targetUserId, role, action })

    if (!targetUserId || !role || !action) {
      console.log("[toggle-role] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user is a super admin
    const { getUser } = await import("@clerk/nextjs/server")
    const user = await getUser(userId)

    console.log(`[toggle-role] User metadata:`, {
      id: user?.id,
      publicMetadata: user?.publicMetadata,
      isSuperAdmin: user?.publicMetadata?.superAdmin === true
    })

    if (!user || user.publicMetadata?.superAdmin !== true) {
      console.log("[toggle-role] User is not superAdmin")
      return NextResponse.json({ error: "Only super admins can modify roles" }, { status: 403 })
    }

    // Update the role
    console.log(`[toggle-role] Attempting to ${action} role ${role} for user ${targetUserId}`)
    let success = false
    if (action === "add") {
      success = await assignRole(targetUserId, role)
    } else if (action === "remove") {
      success = await removeRole(targetUserId, role)
    } else {
      console.log("[toggle-role] Invalid action")
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log(`[toggle-role] Role update success: ${success}`)

    if (!success) {
      console.log("[toggle-role] Failed to update role")
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
    }

    console.log("[toggle-role] Role updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[toggle-role] Error in toggle-role API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
