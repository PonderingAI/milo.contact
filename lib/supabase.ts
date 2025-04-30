import { createClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Debug flag - set to true to see client creation logs
const DEBUG = true

// Track client creation for debugging
const logClientCreation = (context: string) => {
  if (DEBUG) {
    console.log(`Creating Supabase client for: ${context}`)
  }
}

// For server-side usage with service role (admin privileges)
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  logClientCreation("server")

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

// For client-side usage
export const getSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // For server-side rendering, create a non-persistent client
  if (typeof window === "undefined") {
    logClientCreation("ssr")

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  // For client-side, use the singleton pattern
  let browserClientInstance: ReturnType<typeof createClient> | null = null

  if (!browserClientInstance) {
    logClientCreation("browser-singleton")

    // Create the singleton instance with a unique storage key
    browserClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "milo-portfolio-auth-v5", // Updated version to force new session
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } else if (DEBUG) {
    console.log("Reusing existing browser client instance")
  }

  return browserClientInstance
}

// For server components with user auth
export const getSupabaseServerClient = () => {
  return createServerComponentClient({ cookies })
}

// Create a dedicated admin client for server operations
export const createAdminClient = () => {
  logClientCreation("admin")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

// Reset the browser client (useful for testing and debugging)
export const resetBrowserClient = () => {
  let browserClientInstance: ReturnType<typeof createClient> | null = null
  browserClientInstance = null
}
