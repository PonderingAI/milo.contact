import { currentUser } from "@clerk/nextjs/server"
import { createServerClient } from "@/lib/supabase"
import DebugClient from "./debug-client"

export default async function DebugPage() {
  const user = await currentUser()

  // Get user data from Supabase if user exists
  let profileExists = false
  let userRoles: string[] = []

  if (user) {
    const supabase = createServerClient()
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profileExists = !!profile

    const { data: roles } = await supabase.from("user_roles").select("role_id").eq("user_id", user.id)
    userRoles = roles?.map((r) => r.role_id) || []
  }

  // Get environment variable status (without exposing values)
  const envVars = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: !!process.env.CLERK_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  return (
    <DebugClient
      user={
        user
          ? {
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress || "",
              createdAt: user.createdAt,
            }
          : null
      }
      profileExists={profileExists}
      userRoles={userRoles}
      envVars={envVars}
    />
  )
}
