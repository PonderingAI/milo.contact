import { clerkMiddleware } from "@clerk/nextjs/server"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
const publicRoutes = [
  "/",
  "/projects",
  "/projects/(.*)",
  "/media-hosting",
  "/backend-setup",
  "/setup",
  "/api/setup-all",
  "/api/setup/unified",
  "/api/database/diagnostics",
  "/api/batch",
  "/api/setup-database",
  "/api/seed-database",
  "/api/setup-storage",
  "/api/setup-bts-images-table",
  "/api/setup-site-settings",
  "/api/setup-media-table",
  "/api/setup-media-storage-policy",
  "/api/upload-app-icons",
  "/api/favicon",
  "/api/ping",
  "/api/youtube-title",
  "/api/contact",
  "/setup-database",
  // Add dependency API routes to public routes
  "/api/dependencies",
  "/api/dependencies/(.*)",
  "/api/setup-dependencies-tables",
  // Add media operations for public access (with internal auth checks)
  "/api/media/operations",
]

export default clerkMiddleware({
  publicRoutes: publicRoutes,
  ignoredRoutes: ["/api/webhook"],
})

export const config = {
  // Simplified but effective matcher to reduce middleware invocations
  matcher: [
    // Exclude Next.js internals and static files
    "/((?!_next/static|_next/image|favicon|manifest|robots|sitemap).*)",
    // Exclude common static file extensions but allow dynamic routes
    "/((?!.*\\.ico$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$|.*\\.css$|.*\\.js$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.eot$).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
}
