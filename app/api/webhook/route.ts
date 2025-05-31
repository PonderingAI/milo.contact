import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { syncUserRoles, syncClerkUserToSupabase, ensureUserHasRole } from "@/lib/auth-sync"

/**
 * Clerk webhook handler
 * 
 * Handles Clerk webhook events and synchronizes user data between Clerk and Supabase
 * - Creates users in Supabase when they're created in Clerk
 * - Syncs roles when users sign in or metadata changes
 * - Assigns admin role to superAdmin users automatically
 * 
 * Configure your Clerk webhook to send events to this endpoint:
 * - user.created
 * - user.updated
 * - session.created
 * - organization.membership.created (if using organizations)
 */
export async function POST(req: NextRequest) {
  try {
    // Get the webhook signature from the headers
    const headerPayload = headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there's no signature, return an error
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable")
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      )
    }

    // Get the raw body
    const payload = await req.text()
    
    let evt: WebhookEvent
    
    // Try to use svix for verification if available, otherwise fall back to basic verification
    try {
      // Attempt to dynamically import svix
      try {
        const { Webhook } = await import('svix')
        // Create a new Svix instance with the webhook secret
        const wh = new Webhook(webhookSecret)
        
        // Verify the webhook signature using svix
        evt = wh.verify(payload, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        }) as WebhookEvent
        
        console.log("Webhook verified using svix")
      } catch (importError) {
        // Svix is not available, use basic verification
        console.warn("SECURITY WARNING: svix package not available for proper webhook signature verification")
        console.warn("Using basic verification instead - this is less secure!")
        
        // Basic verification - parse the payload and trust the request
        // This is less secure but allows the webhook to function without svix
        evt = JSON.parse(payload) as WebhookEvent
        
        // Add minimal verification by checking if the secret appears in the signature
        // This is NOT cryptographically secure but provides minimal protection
        if (!svix_signature.includes(webhookSecret.substring(0, 8))) {
          console.error("Basic webhook verification failed - signature doesn't contain secret prefix")
          throw new Error("Invalid webhook signature (basic verification)")
        }
      }
    } catch (err) {
      console.error("Error verifying webhook:", err)
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      )
    }

    // Get the event type and data
    const { type, data } = evt
    
    // Log the event type for debugging
    console.log(`Webhook event received: ${type}`)

    // Handle different event types
    switch (type) {
      case "user.created": {
        // A new user was created in Clerk
        const { id: userId } = data
        
        // Create the user in Supabase with the same ID
        await syncClerkUserToSupabase(userId)
        
        // Check if user has superAdmin in metadata and assign admin role if needed
        if (data.public_metadata?.superAdmin === true) {
          await ensureUserHasRole(userId, 'admin')
        }
        
        // Sync any other roles from Clerk metadata
        if (Array.isArray(data.public_metadata?.roles)) {
          const roles = data.public_metadata.roles as string[]
          if (roles.includes('admin')) {
            await ensureUserHasRole(userId, 'admin')
          }
        }
        
        return NextResponse.json({ success: true, event: "user.created" })
      }
      
      case "user.updated": {
        // User data was updated in Clerk
        const { id: userId } = data
        
        // Check if public_metadata was changed
        const metadataChanged = data.public_metadata !== undefined
        
        if (metadataChanged) {
          // Sync all roles from Clerk to Supabase
          await syncUserRoles(userId)
          
          // Special handling for superAdmin
          if (data.public_metadata?.superAdmin === true) {
            await ensureUserHasRole(userId, 'admin')
          }
        }
        
        return NextResponse.json({ success: true, event: "user.updated" })
      }
      
      case "session.created": {
        // User signed in - sync their roles
        const { user_id: userId } = data
        
        if (userId) {
          await syncUserRoles(userId)
        }
        
        return NextResponse.json({ success: true, event: "session.created" })
      }
      
      case "organization.membership.created": {
        // Handle organization memberships if using Clerk Organizations
        // This is a placeholder for organization-based role assignment
        return NextResponse.json({ success: true, event: "organization.membership.created" })
      }
      
      // Add other event handlers as needed
      
      default: {
        // For any other events, just acknowledge receipt
        return NextResponse.json({ success: true, event: type })
      }
    }
  } catch (error) {
    console.error("Error handling webhook:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}
