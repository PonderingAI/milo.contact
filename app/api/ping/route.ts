import { NextResponse } from "next/server"

export async function GET() {
  const response = NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: "Server is responding",
  })
  
  // Add short cache for ping endpoint to reduce redundant requests
  response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')
  
  return response
}
