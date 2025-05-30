import type { WebhookEvent } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error: Missing svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()

  try {
    // Log the webhook event
    console.log(`Webhook received: ${payload.type}`)

    // Process the webhook based on the event type
    const event = payload as WebhookEvent

    switch (event.type) {
      case "user.created":
        console.log(`User created: ${event.data.id}`)
        // Add your logic here
        break
      case "user.updated":
        console.log(`User updated: ${event.data.id}`)
        // Add your logic here
        break
      case "user.deleted":
        console.log(`User deleted: ${event.data.id}`)
        // Add your logic here
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ success: false, error: "Error processing webhook" }, { status: 500 })
  }
}
