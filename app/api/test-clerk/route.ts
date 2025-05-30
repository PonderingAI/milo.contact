import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = auth()
    const user = await currentUser()

    return NextResponse.json({
      success: true,
      authenticated: !!userId,
      userId,
      user: user
        ? {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
          }
        : null,
    })
  } catch (error) {
    console.error("Error in test-clerk API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
