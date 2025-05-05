import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || "",
  },
})

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

    // Send email notification
    try {
      await sendEmailNotification(name, email, message)
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError)
      // Continue execution even if email fails
    }

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

async function sendEmailNotification(name: string, email: string, message: string) {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("Email credentials not configured. Skipping email notification.")
    return
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || "Portfolio Contact Form <noreply@example.com>",
    to: "me@milo.contact",
    subject: `New Contact Form Submission from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <h3 style="color: #555;">Message:</h3>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${message.replace(/\n/g, "<br>")}
        </div>
        <p style="color: #777; margin-top: 20px; font-size: 12px;">
          This email was sent from your portfolio website contact form.
        </p>
      </div>
    `,
    text: `
      New Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      
      Message:
      ${message}
      
      This email was sent from your portfolio website contact form.
    `,
  }

  await transporter.sendMail(mailOptions)
}
