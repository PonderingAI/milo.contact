import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { action } = await req.json()

    switch (action) {
      case "test-signup":
        // Just test that we can access Clerk API
        const users = await clerkClient.users.getUserList({
          limit: 1,
        })

        return NextResponse.json({
          message: "Successfully connected to Clerk API",
          userCount: users.length,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Clerk API test error:", error)
    return NextResponse.json({ error: error.message || "An error occurred with the Clerk API" }, { status: 500 })
  }
}
