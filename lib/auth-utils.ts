import { createServerClient } from "./supabase"

export interface UserRole {
  id: string
  name: string
  description: string
}

// Get all roles for a user
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles (
          id,
          name,
          description
        )
      `)
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching user roles:", error)
      return []
    }

    // Extract the roles from the nested structure
    return data.map((item) => item.roles) || []
  } catch (error) {
    console.error("Error in getUserRoles:", error)
    return []
  }
}

// Check if a user has a specific role
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        roles!inner (
          name
        )
      `)
      .eq("user_id", userId)
      .eq("roles.name", roleName)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No matching row found - user doesn't have this role
        return false
      }
      console.error("Error checking user role:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in hasRole:", error)
    return false
  }
}

// Check if a user has admin role
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, "admin")
}

// Assign a role to a user
export async function assignRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const supabase = createServerClient()

    // First, get the role ID
    const { data: roleData, error: roleError } = await supabase.from("roles").select("id").eq("name", roleName).single()

    if (roleError || !roleData) {
      console.error("Error finding role:", roleError)
      return false
    }

    // Then assign the role to the user
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role_id: roleData.id,
      })
      .onConflict(["user_id", "role_id"])
      .ignore() // If the role is already assigned, just ignore

    if (error) {
      console.error("Error assigning role:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in assignRole:", error)
    return false
  }
}

// Remove a role from a user
export async function removeRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const supabase = createServerClient()

    // First, get the role ID
    const { data: roleData, error: roleError } = await supabase.from("roles").select("id").eq("name", roleName).single()

    if (roleError || !roleData) {
      console.error("Error finding role:", roleError)
      return false
    }

    // Then remove the role from the user
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleData.id)

    if (error) {
      console.error("Error removing role:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in removeRole:", error)
    return false
  }
}
