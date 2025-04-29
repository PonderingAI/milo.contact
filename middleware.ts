import { authMiddleware } from "@clerk/nextjs/server"

export default authMiddleware({
  // Routes that can be accessed while signed out
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
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
