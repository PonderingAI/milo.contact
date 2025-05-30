import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ authenticated: false, message: "Not authenticated" }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    userId,
    message: "Authentication successful",
  })
}
