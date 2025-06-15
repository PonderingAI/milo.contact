import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserRoles } from "@/lib/auth-server"

/**
 * API route to get user roles from Clerk metadata
 * 
 * This endpoint allows users to fetch the current roles assigned to a user
 * in Clerk's publicMetadata. Used for role management and debugging.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the requesting user is authenticated
    const { userId: requestingUserId } = auth()
    
    if (!requestingUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. You must be signed in to perform this action." 
      }, { status: 401 })
    }
    
    // Parse request body to get the target userId
    const body = await request.json()
    const { userId: targetUserId } = body
    
    // If no targetUserId provided, use the requesting user's ID
    const userIdToQuery = targetUserId || requestingUserId
    
    // For now, allow users to query their own roles
    // In production, you might want to add additional permission checks
    // for querying other users' roles
    
    // Get the roles from Clerk
    const roles = await getUserRoles(userIdToQuery)
    
    // Return the roles
    return NextResponse.json({
      success: true,
      userId: userIdToQuery,
      roles: roles || []
    })
    
  } catch (error) {
    console.error("Error fetching user roles:", error)
    
    return NextResponse.json({ 
      error: "Failed to fetch user roles",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  }
}