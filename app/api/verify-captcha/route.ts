import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the token from the request body
    const { token } = await request.json()

    if (!token) {
      console.error("Missing captcha token in request")
      return NextResponse.json({ success: false, error: "Missing captcha token" }, { status: 400 })
    }

    // Get the secret key from environment variables
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY

    if (!secretKey) {
      console.error("Missing CLOUDFLARE_TURNSTILE_SECRET_KEY environment variable")
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    console.log(`Verifying captcha token: ${token.substring(0, 10)}...`)

    // Verify the token with Cloudflare Turnstile
    const formData = new URLSearchParams()
    formData.append("secret", secretKey)
    formData.append("response", token)
    formData.append("remoteip", request.headers.get("x-forwarded-for") || "")

    const verificationResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const verificationData = await verificationResponse.json()

    // Log verification response for debugging
    console.log("Turnstile verification response:", verificationData)

    // Return the verification result
    if (verificationData.success) {
      console.log("Captcha verification successful")
      return NextResponse.json({ success: true })
    } else {
      console.error("Captcha verification failed:", verificationData["error-codes"])
      return NextResponse.json(
        {
          success: false,
          error: "Captcha verification failed",
          details: verificationData["error-codes"],
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error verifying captcha:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
