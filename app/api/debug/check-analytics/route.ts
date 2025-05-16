import { NextResponse } from "next/server"

export async function GET() {
  try {
    const analyticsUrl = "/_vercel/insights/script.js"

    // Try to fetch the analytics script
    const response = await fetch(new URL(analyticsUrl, process.env.NEXT_PUBLIC_SITE_URL || "https://milo.contact"))

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: analyticsUrl,
      message: response.ok
        ? "Vercel Web Analytics script is available"
        : "Vercel Web Analytics script is not available",
      solution: !response.ok
        ? "Make sure Web Analytics is enabled in your Vercel project settings and redeploy your application."
        : undefined,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to check Vercel Web Analytics script",
      solution: "Make sure Web Analytics is enabled in your Vercel project settings and redeploy your application.",
    })
  }
}
