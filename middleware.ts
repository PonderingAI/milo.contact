import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"

// Public routes that don't require authentication
const publicPaths = [
  "/",
  "/projects",
  "/media-hosting",
  "/backend-setup",
  "/setup-database",
  "/sign-in",
  "/sign-up",
  "/bootstrap-admin",
]

export default async function middleware(req: NextRequest) {
  // Get the pathname of the request
  const path = req.nextUrl.pathname

  // If it's a public path, allow access
  if (publicPaths.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`))) {
    return NextResponse.next()
  }

  // If it's an API route for bootstrap, allow access
  if (path === "/api/bootstrap-admin") {
    return NextResponse.next()
  }

  // Get the user from the request
  const { userId } = auth()

  // If the user is not authenticated, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Allow access to all other routes for authenticated users
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
