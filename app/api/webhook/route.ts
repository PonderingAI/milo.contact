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
  const body = JSON.stringify(payload)

  // Create a new Webhook instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return new NextResponse("Error: Missing webhook secret", {
      status: 500,
    })
  }

  // This is a simple logging mechanism to see the event
  console.log(`Webhook with ID: ${svix_id}`)
  console.log(`Webhook body: ${body}`)

  try {
    // Handle the webhook
    const event = payload as WebhookEvent

    // Process the event based on the type
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
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error processing webhook:", err)
    return new NextResponse("Error processing webhook", {
      status: 400,
    })
  }
}
