import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuth } from "@clerk/nextjs/server"

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/projects",
  "/projects/(.*)",
  "/media-hosting",
  "/backend-setup",
  "/setup",
  "/api/setup-all",
  "/api/setup-database",
  "/api/seed-database",
  "/api/setup-storage",
  "/api/setup-bts-images-table",
  "/api/setup-site-settings",
  "/api/upload-app-icons",
  "/api/favicon",
  "/setup-database",
]

// Define routes to ignore middleware processing
const ignoredRoutes = ["/api/webhook"]

export async function middleware(request: NextRequest) {
  // Check if the route is in the ignored list
  if (ignoredRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.endsWith("(.*)")) {
      const baseRoute = route.replace("(.*)", "")
      return request.nextUrl.pathname.startsWith(baseRoute)
    }
    return request.nextUrl.pathname === route
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, check authentication
  const { userId } = getAuth(request)

  // If not authenticated, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect_url", request.url)
    return NextResponse.redirect(signInUrl)
  }

  // If authenticated, allow access
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
