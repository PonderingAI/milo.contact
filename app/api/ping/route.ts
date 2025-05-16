import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: "Server is responding",
  })
}
