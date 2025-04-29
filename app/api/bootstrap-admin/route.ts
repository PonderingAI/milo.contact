import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { assignRole } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    // Get the current user
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }

    // Get the secret from the request
    const { secret } = await request.json()

    // Check if the secret matches
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET

    if (!bootstrapSecret) {
      return NextResponse.json({ message: "Bootstrap secret not configured on the server" }, { status: 500 })
    }

    if (secret !== bootstrapSecret) {
      return NextResponse.json({ message: "Invalid bootstrap secret" }, { status: 403 })
    }

    // Assign the admin role to the user
    const success = await assignRole(userId, "admin")

    if (!success) {
      return NextResponse.json({ message: "Failed to assign admin role" }, { status: 500 })
    }

    return NextResponse.json({ message: "Admin role assigned successfully" })
  } catch (error) {
    console.error("Error in bootstrap-admin:", error)
    return NextResponse.json({ message: "An error occurred while processing your request" }, { status: 500 })
  }
}
