import { NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { userId } = getAuth(req)

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/projects", "/sign-in", "/sign-up", "/media-hosting", "/backend-setup", "/setup-database"]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`),
  )

  // Check if the path is for static files or API routes
  const isStaticOrApi =
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.includes(".") ||
    req.nextUrl.pathname === "/favicon.ico"

  // If it's a public route or static/API, allow access
  if (isPublicRoute || isStaticOrApi) {
    return NextResponse.next()
  }

  // If it's an admin route and user is not authenticated, redirect to sign-in
  if (req.nextUrl.pathname.startsWith("/admin") && !userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // For all other routes, allow access if authenticated, otherwise redirect to sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
