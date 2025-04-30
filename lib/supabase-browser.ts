import { createClient } from "@supabase/supabase-js"

// For client-side usage - using singleton pattern
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    // For SSR, return a temporary client that won't be stored
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  // For client-side, use the singleton pattern
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "milo-portfolio-auth",
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return browserClient
}
