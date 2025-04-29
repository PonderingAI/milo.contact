import { createClient } from "@supabase/supabase-js"

// Debug flag - set to true to see client creation logs
const DEBUG = true

// Track client creation for debugging
const logClientCreation = (context: string) => {
  if (DEBUG) {
    console.log(`Creating Supabase client for: ${context}`)
  }
}

// Completely isolated client for server components
export const createServerClient = () => {
  logClientCreation("server")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

// Singleton browser client
let browserClientInstance: ReturnType<typeof createClient> | null = null

// Get the browser client with singleton pattern
export const getSupabaseBrowserClient = () => {
  // For server-side rendering, create a non-persistent client
  if (typeof window === "undefined") {
    logClientCreation("ssr")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  // For client-side, use the singleton pattern
  if (!browserClientInstance) {
    logClientCreation("browser-singleton")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }

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
  browserClientInstance = null
}
