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
  "/api/setup-database",
  "/api/seed-database",
  "/api/setup-storage",
  "/api/setup-bts-images-table",
  "/api/setup-site-settings",
  "/api/setup-media-table",
  "/api/setup-media-storage-policy",
  "/api/upload-app-icons",
  "/api/favicon",
  "/setup-database",
  // Add dependency API routes to public routes
  "/api/dependencies",
  "/api/dependencies/(.*)",
  "/api/setup-dependencies-tables",
]

export default clerkMiddleware({
  publicRoutes: publicRoutes,
  ignoredRoutes: ["/api/webhook"],
})

export const config = {
  // Exclude static files, _next, manifest files, favicons, and other assets
  matcher: [
    "/((?!.+\\.[\\w]+$|_next|favicon|manifest|robots|sitemap|apple-icon|icon-).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
}
