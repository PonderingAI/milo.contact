import { authMiddleware } from "@clerk/nextjs"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  publicRoutes: [
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
    "/api/setup-media-table",
    "/api/setup-media-storage-policy",
    "/api/upload-app-icons",
    "/api/favicon",
    "/setup-database",
  ],
  ignoredRoutes: ["/api/webhook"],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
