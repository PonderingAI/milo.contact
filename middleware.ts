import { authMiddleware } from "@clerk/nextjs"

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  publicRoutes: [
    "/",
    "/projects",
    "/projects/(.*)",
    "/api/setup-database",
    "/api/seed-database",
    "/api/setup-storage",
    "/api/setup-bts-images-table",
    "/api/setup-site-settings",
    "/api/setup-icons-bucket",
    "/api/favicon",
    "/setup-database",
    "/media-hosting",
    "/backend-setup",
    "/debug",
    "/debug-clerk",
    "/auth-test",
  ],
  ignoredRoutes: ["/api/webhook"],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
