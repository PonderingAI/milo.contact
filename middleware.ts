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
  "/manifest",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap.txt",
  // API endpoints that don't require authentication
  "/api/setup-all",
  "/api/setup/unified",
  "/api/database/diagnostics",
  "/api/system/status",
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
  "/api/revalidate",
  "/setup-database",
  // Diagnostic and system endpoints
  "/api/check-database-setup",
  "/api/check-media-table",
  "/api/check-projects-schema",
  "/api/check-table-exists",
  "/api/direct-table-check",
  "/api/list-tables-simple",
  "/api/supabase-diagnostic",
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
  // Optimized matcher to significantly reduce middleware invocations
  matcher: [
    // Exclude Next.js internals and static files
    "/((?!_next/static|_next/image|favicon|manifest|robots|sitemap|apple-icon|android-icon|icon-|mstile-).*)",
    // Exclude all static file extensions and common system files
    "/((?!.*\\.ico$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$|.*\\.css$|.*\\.js$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.eot$|.*\\.otf$|.*\\.txt$|.*\\.xml$|.*\\.json$|.*\\.pdf$|.*\\.mp4$|.*\\.mp3$|.*\\.wav$|.*\\.ogg$|.*\\.avi$|.*\\.mov$|.*\\.wmv$|.*\\.flv$|.*\\.webm$).*)",
    // Exclude common web manifest and system files
    "/((?!browserconfig\\.xml|site\\.webmanifest|humans\\.txt|ads\\.txt|security\\.txt|\\.well-known/).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
}
