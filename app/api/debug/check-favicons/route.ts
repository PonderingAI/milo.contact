import { NextResponse } from "next/server"

export async function GET() {
  try {
    const favicons = ["/favicon.ico", "/favicon-16x16.png", "/favicon-32x32.png", "/apple-touch-icon.png"]

    const results = {}

    // Check each favicon
    for (const favicon of favicons) {
      try {
        const response = await fetch(new URL(favicon, process.env.NEXT_PUBLIC_SITE_URL || "https://milo.contact"), {
          method: "HEAD",
        })

        results[favicon] = {
          exists: response.ok,
          status: response.status,
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
        }
      } catch (error) {
        results[favicon] = {
          exists: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }

    return NextResponse.json({
      success: true,
      favicons: results,
      message: "Favicon check completed",
      solution: Object.values(results).some((r: any) => !r.exists)
        ? "Upload missing favicons to your public directory or use the favicon uploader in the admin settings."
        : undefined,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Failed to check favicons",
    })
  }
}
