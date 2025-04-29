import { authMiddleware } from "@clerk/nextjs/server"

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/projects(.*)",
  "/media-hosting",
  "/backend-setup",
  "/setup-database",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook",
]

export default authMiddleware({
  publicRoutes,
  ignoredRoutes: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
