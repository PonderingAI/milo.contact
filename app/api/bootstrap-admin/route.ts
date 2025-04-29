import { clerkClient } from "@clerk/nextjs"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { secret } = await request.json()

    // Check if the bootstrap secret is correct
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET

    if (!bootstrapSecret) {
      return NextResponse.json({ message: "Bootstrap secret not configured on the server" }, { status: 500 })
    }

    if (secret !== bootstrapSecret) {
      return NextResponse.json({ message: "Invalid bootstrap secret" }, { status: 403 })
    }

    // Get the user
    const user = await clerkClient.users.getUser(userId)

    // Check if user already has admin role
    const currentRoles = (user.publicMetadata.roles as string[]) || []

    if (currentRoles.includes("admin")) {
      return NextResponse.json({ message: "User already has admin role" }, { status: 200 })
    }

    // Add admin role to user
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        roles: [...currentRoles, "admin"],
      },
    })

    return NextResponse.json({ message: "Admin role assigned successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in bootstrap-admin:", error)
    return NextResponse.json({ message: "An error occurred while processing your request" }, { status: 500 })
  }
}
