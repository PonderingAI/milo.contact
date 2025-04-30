import { authMiddleware } from "@clerk/nextjs"

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
    "/api/upload-app-icons",
    "/api/favicon",
    "/setup-database",
  ],
  ignoredRoutes: ["/api/webhook"],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
