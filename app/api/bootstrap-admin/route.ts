import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { assignRole } from "@/lib/auth-utils"

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

    // Assign the admin role to the user
    const success = await assignRole(userId, "admin")

    if (!success) {
      return NextResponse.json({ error: "Failed to assign admin role" }, { status: 500 })
    }

    return NextResponse.json({ message: "Admin role assigned successfully" })
  } catch (error) {
    console.error("Error in bootstrap-admin:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
