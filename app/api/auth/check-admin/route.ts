import { NextRequest, NextResponse } from "next/server"
import { checkAdminPermission } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }
    
    const isAdmin = await checkAdminPermission(userId)
    
    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error("Error checking admin status:", error)
    return NextResponse.json({ error: "Failed to check admin status" }, { status: 500 })
  }
}