import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json()

    // Validate form data
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Initialize Supabase client with service role key to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Store the message in a contact_messages table
    // If the table doesn't exist, we'll just log the message
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      message,
      created_at: new Date().toISOString(),
    })

    if (error && error.code !== "42P01") {
      console.error("Error saving contact message:", error)
      // If it's not a "table doesn't exist" error, return an error
      if (error.code !== "42P01") {
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
      }
    }

    // For now, we'll just log the message
    console.log("Contact form submission:", { name, email, message })

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Thank you for your message! I will get back to you soon.",
    })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Failed to process your request" }, { status: 500 })
  }
}
