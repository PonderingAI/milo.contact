import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const { secret } = await request.json()
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET || "initial-setup-secret-change-me"

    if (secret !== bootstrapSecret) {
      return NextResponse.json({ success: false, message: "Invalid bootstrap secret" }, { status: 400 })
    }

    // Get the user
    const user = await clerkClient.users.getUser(userId)

    // Check if user already has admin role
    const currentRoles = (user.publicMetadata.roles as string[]) || []
    if (currentRoles.includes("admin")) {
      return NextResponse.json({ success: true, message: "You already have admin privileges" }, { status: 200 })
    }

    // Add admin role
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: [...currentRoles, "admin"],
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Admin privileges granted successfully! Redirecting to admin dashboard...",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error setting up admin:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while setting up admin access" },
      { status: 500 },
    )
  }
}
