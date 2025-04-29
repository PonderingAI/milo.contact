import { authMiddleware } from "@clerk/nextjs/server"

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/projects",
    "/projects/(.*)",
    "/media-hosting",
    "/backend-setup",
    "/setup-database",
    "/api/webhook",
    "/setup-admin",
  ],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
