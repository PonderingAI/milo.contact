// Widget state manager

// Types
interface DashboardState {
  id: string
  widgets: any[]
  updateMode?: string
}

// Load dashboard state from localStorage
export function loadDashboardState(dashboardId: string): DashboardState | null {
  if (typeof window === "undefined") return null

  try {
    const savedState = localStorage.getItem(`dashboard-${dashboardId}`)
    if (savedState) {
      return JSON.parse(savedState)
    }
  } catch (error) {
    console.error("Error loading dashboard state:", error)
  }

  return null
}

// Save dashboard state to localStorage
export function saveDashboardState(dashboardId: string, state: DashboardState): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(`dashboard-${dashboardId}`, JSON.stringify(state))
  } catch (error) {
    console.error("Error saving dashboard state:", error)
  }
}

// Load update mode preference
export async function loadUpdateModePreference(userId: string): Promise<string | null> {
  try {
    // In a real app, you would fetch this from your API
    // For now, we'll use localStorage as a placeholder
    if (typeof window === "undefined") return null

    const savedMode = localStorage.getItem(`update-mode-${userId}`)
    return savedMode
  } catch (error) {
    console.error("Error loading update mode preference:", error)
    return null
  }
}

// Save update mode preference
export async function saveUpdateModePreference(userId: string, mode: string): Promise<void> {
  try {
    // In a real app, you would save this to your API
    // For now, we'll use localStorage as a placeholder
    if (typeof window === "undefined") return

    localStorage.setItem(`update-mode-${userId}`, mode)

    // Also make an API call to save the preference
    await fetch("/api/dependencies/update-mode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, updateMode: mode }),
    })
  } catch (error) {
    console.error("Error saving update mode preference:", error)
  }
}
