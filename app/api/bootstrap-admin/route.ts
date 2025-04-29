import { clerkClient } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// This is a special secret code that will be used to bootstrap the first admin
// In production, use a strong, randomly generated string stored in environment variables
const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET || "initial-setup-secret-change-me"

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get the request body
    const body = await request.json()
    const { secret } = body

    // Verify the bootstrap secret
    if (secret !== BOOTSTRAP_SECRET) {
      return NextResponse.json({ success: false, message: "Invalid secret" }, { status: 403 })
    }

    // Check if there are any admin users already
    const userList = await clerkClient.users.getUserList({
      limit: 10,
    })

    const adminExists = await userList.some(async (user) => {
      const roles = (user.publicMetadata.roles as string[]) || []
      return roles.includes("admin")
    })

    // If there's already an admin, only allow existing admins to create new ones
    if (adminExists) {
      const currentUser = await clerkClient.users.getUser(userId)
      const roles = (currentUser.publicMetadata.roles as string[]) || []

      if (!roles.includes("admin")) {
        return NextResponse.json(
          { success: false, message: "Only existing admins can create new admins" },
          { status: 403 },
        )
      }
    }

    // Make the current user an admin
    const user = await clerkClient.users.getUser(userId)
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    // If user already has admin role, return success
    if (currentRoles.includes("admin")) {
      return NextResponse.json({ success: true, message: "User is already an admin" })
    }

    // Add the admin role
    const updatedRoles = [...currentRoles, "admin"]

    // Update the user's metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: updatedRoles,
      },
    })

    return NextResponse.json({ success: true, message: "Admin role assigned successfully" })
  } catch (error) {
    console.error("Error bootstrapping admin:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error bootstrapping admin: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
