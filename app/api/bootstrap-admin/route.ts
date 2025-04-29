import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs"

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the secret from the request body
    const { secret } = await request.json()

    // Check if the secret is valid
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET

    if (!bootstrapSecret) {
      return NextResponse.json({ error: "Bootstrap secret not configured on the server" }, { status: 500 })
    }

    if (secret !== bootstrapSecret) {
      return NextResponse.json({ error: "Invalid bootstrap secret" }, { status: 403 })
    }

    // Get the user
    const user = await clerkClient.users.getUser(userId)

    // Check if user already has admin role
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    if (currentRoles.includes("admin")) {
      return NextResponse.json({ message: "User already has admin role" })
    }

    // Add admin role to user
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: [...currentRoles, "admin"],
      },
    })

    return NextResponse.json({ message: "Admin role assigned successfully" })
  } catch (error) {
    console.error("Error in bootstrap-admin:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
