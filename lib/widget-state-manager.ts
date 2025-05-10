import { createClient } from "@/lib/supabase-browser"

export interface WidgetState {
  id: string
  x: number
  y: number
  width: number
  height: number
  isCollapsed: boolean
}

export interface DashboardState {
  id: string
  widgets: WidgetState[]
  updateMode?: string
}

// Save dashboard state to localStorage
export const saveDashboardState = (dashboardId: string, state: DashboardState): void => {
  try {
    localStorage.setItem(`dashboard_${dashboardId}`, JSON.stringify(state))
  } catch (error) {
    console.error("Error saving dashboard state to localStorage:", error)
  }
}

// Load dashboard state from localStorage
export const loadDashboardState = (dashboardId: string): DashboardState | null => {
  try {
    const savedState = localStorage.getItem(`dashboard_${dashboardId}`)
    if (savedState) {
      return JSON.parse(savedState)
    }
  } catch (error) {
    console.error("Error loading dashboard state from localStorage:", error)
  }
  return null
}

// Save dashboard state to database
export const saveDashboardStateToDatabase = async (
  userId: string,
  dashboardId: string,
  state: DashboardState,
): Promise<boolean> => {
  try {
    const supabase = createClient()

    // Check if the dashboard_states table exists
    const { data: tableExists, error: tableCheckError } = await supabase.from("dashboard_states").select("id").limit(1)

    if (tableCheckError && tableCheckError.code !== "PGRST116") {
      // Create the table if it doesn't exist
      await supabase.rpc("create_dashboard_states_table")
    }

    // Check if a state already exists for this user and dashboard
    const { data: existingState, error: fetchError } = await supabase
      .from("dashboard_states")
      .select("id")
      .eq("user_id", userId)
      .eq("dashboard_id", dashboardId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching dashboard state:", fetchError)
      return false
    }

    if (existingState) {
      // Update existing state
      const { error: updateError } = await supabase
        .from("dashboard_states")
        .update({ state: state })
        .eq("id", existingState.id)

      if (updateError) {
        console.error("Error updating dashboard state:", updateError)
        return false
      }
    } else {
      // Insert new state
      const { error: insertError } = await supabase.from("dashboard_states").insert([
        {
          user_id: userId,
          dashboard_id: dashboardId,
          state: state,
        },
      ])

      if (insertError) {
        console.error("Error inserting dashboard state:", insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error saving dashboard state to database:", error)
    return false
  }
}

// Load dashboard state from database
export const loadDashboardStateFromDatabase = async (
  userId: string,
  dashboardId: string,
): Promise<DashboardState | null> => {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("dashboard_states")
      .select("state")
      .eq("user_id", userId)
      .eq("dashboard_id", dashboardId)
      .single()

    if (error) {
      if (error.code !== "PGRST116") {
        // Not found is okay
        console.error("Error loading dashboard state from database:", error)
      }
      return null
    }

    return data?.state as DashboardState
  } catch (error) {
    console.error("Error loading dashboard state from database:", error)
    return null
  }
}

// Save update mode preference
export const saveUpdateModePreference = async (userId: string, mode: string): Promise<boolean> => {
  try {
    const supabase = createClient()

    // Check if the user_preferences table exists
    const { data: tableExists, error: tableCheckError } = await supabase.from("user_preferences").select("id").limit(1)

    if (tableCheckError && tableCheckError.code !== "PGRST116") {
      // Create the table if it doesn't exist
      await supabase.rpc("create_user_preferences_table")
    }

    // Check if preferences already exist for this user
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user preferences:", fetchError)
      return false
    }

    if (existingPrefs) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from("user_preferences")
        .update({ update_mode: mode })
        .eq("id", existingPrefs.id)

      if (updateError) {
        console.error("Error updating user preferences:", updateError)
        return false
      }
    } else {
      // Insert new preferences
      const { error: insertError } = await supabase.from("user_preferences").insert([
        {
          user_id: userId,
          update_mode: mode,
        },
      ])

      if (insertError) {
        console.error("Error inserting user preferences:", insertError)
        return false
      }
    }

    // Also save to localStorage for offline access
    localStorage.setItem("update_mode_preference", mode)

    return true
  } catch (error) {
    console.error("Error saving update mode preference:", error)
    return false
  }
}

// Load update mode preference
export const loadUpdateModePreference = async (userId: string): Promise<string | null> => {
  try {
    // Try to get from localStorage first for faster access
    const localPref = localStorage.getItem("update_mode_preference")
    if (localPref) {
      return localPref
    }

    const supabase = createClient()

    const { data, error } = await supabase.from("user_preferences").select("update_mode").eq("user_id", userId).single()

    if (error) {
      if (error.code !== "PGRST116") {
        // Not found is okay
        console.error("Error loading update mode preference:", error)
      }
      return null
    }

    // Save to localStorage for future fast access
    if (data?.update_mode) {
      localStorage.setItem("update_mode_preference", data.update_mode)
    }

    return data?.update_mode || null
  } catch (error) {
    console.error("Error loading update mode preference:", error)
    return null
  }
}
