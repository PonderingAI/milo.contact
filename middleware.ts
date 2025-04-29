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
    "/setup-database",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhook",
    "/api/setup-database",
    "/api/setup-storage",
    "/api/seed-database",
    "/api/create-tables",
    "/api/check-environment",
    "/api/fix-environment",
  ],
  ignoredRoutes: ["/((?!api|trpc))(_next|.+\\.[\\w]+$)", "/favicon.ico"],
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
