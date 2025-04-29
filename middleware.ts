import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isAdmin } from "./lib/auth-utils"

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/projects",
  "/projects/(.*)",
  "/media-hosting",
  "/backend-setup",
  "/setup-database",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook",
  "/admin/permission-denied",
])

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(["/admin(.*)"])

// Define special admin routes that require authentication but not admin role
const isSpecialAdminRoute = createRouteMatcher(["/admin/bootstrap", "/api/bootstrap-admin"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth

  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!userId) {
    // Redirect to sign-in for admin routes
    if (isAdminRoute(req)) {
      const signInUrl = new URL("/sign-in", req.url)
      signInUrl.searchParams.set("redirect_url", req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Protect other non-public routes
    await auth.protect()
    return NextResponse.next()
  }

  // For special admin routes, only require authentication (not admin role)
  if (isSpecialAdminRoute(req)) {
    return NextResponse.next()
  }

  // For admin routes, check if user has admin role
  if (isAdminRoute(req) && !req.url.includes("/admin/permission-denied")) {
    const isUserAdmin = await isAdmin(userId)

    if (!isUserAdmin) {
      // Redirect to permission denied page
      return NextResponse.redirect(new URL("/admin/permission-denied", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
