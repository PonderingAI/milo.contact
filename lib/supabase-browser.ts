import { createClient } from "@supabase/supabase-js"

// For client-side usage
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (typeof window === "undefined") {
    // For SSR, create a non-persistent client
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // For client-side, use the singleton pattern
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "milo-portfolio-auth-v6",
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return browserClient
}

// Reset the browser client (useful for testing and debugging)
export function resetBrowserClient() {
  browserClient = null
}
