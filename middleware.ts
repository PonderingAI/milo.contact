import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simplified middleware that just passes through all requests
export async function middleware(req: NextRequest) {
  // Simply pass through all requests without any authentication checks
  return NextResponse.next()
}

// Only run middleware on admin routes
export const config = {
  matcher: ["/admin/:path*"],
}
