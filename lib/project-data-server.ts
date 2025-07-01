/**
 * Server-only Project Data Utilities
 *
 * This file contains server-side functions for working with project data.
 * It handles fetching projects from Supabase with proper authentication.
 */

import "server-only"
import { createServerClient } from "./supabase-server"
import { mockProjects, mockBtsImages, type Project, type BtsImage, type MainMedia } from "./mock-data"
import { extractVideoInfo, extractTagsFromRole, isValidUUID } from "./project-data"
import { currentUser } from "@clerk/nextjs/server"
import { checkAdminPermission } from "@/lib/auth-server"

/**
 * Check if the database is set up by testing if the projects table exists
 */
export async function isDatabaseSetup(): Promise<boolean> {
  try {
    const supabase = createServerClient()

    // Try a simple query to check if the table exists
    const { error } = await supabase.from("projects").select("id").limit(1)

    // If there's an error about the relation not existing, the table doesn't exist
    if (error && error.message && error.message.includes('relation "public.projects" does not exist')) {
      return false
    }

    // If there's some other error, log it and assume the database is not set up
    if (error) {
      console.error("Error checking database setup:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in isDatabaseSetup:", error)
    return false
  }
}

// Helper function to check if a user has admin role
async function checkUserIsAdmin(userId: string): Promise<boolean> {
  try {
    // Use the checkAdminPermission function directly for proper Clerk integration
    return await checkAdminPermission(userId)
  } catch (error) {
    console.error("Error in checkUserIsAdmin:", error)
    return false
  }
}

/**
 * Get all projects from the database or fallback to mock data
 * For public-facing pages - always filters out private projects
 */
export async function getProjects(): Promise<Project[]> {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()
    if (!isDbSetup) {
      console.log("Database not set up, returning mock data")
      return mockProjects
    }

    const supabase = createServerClient()

    // For public pages, only show projects that are public 
    // A project is public if:
    // 1. is_public is not explicitly false AND
    // 2. project_date is today or in the past (or null)
    const now = new Date().toISOString().split('T')[0] // Get just the date part
    let query = supabase
      .from("projects")
      .select("*")
      .neq("is_public", false) // Only exclude projects explicitly marked as private
      .order("project_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    // Also filter by project_date if it exists - show projects with no date or date <= today
    const { data, error } = await query.or(`project_date.is.null,project_date.lte.${now}`)

    if (error) {
      console.error("Error fetching projects:", error)
      return mockProjects
    }

    // Process projects to extract tags from categories and roles
    const processedProjects = data.map((project) => {
      // Extract tags from role field
      const roleTags = extractTagsFromRole(project.role)

      // If project has type but no category, use type as category (for backward compatibility)
      if (project.type && !project.category) {
        project.category = project.type
      }

      // If project has thumbnail_url but no video_platform/video_id, extract them
      if (project.thumbnail_url && (!project.video_platform || !project.video_id)) {
        const videoInfo = extractVideoInfo(project.thumbnail_url)
        if (videoInfo) {
          project.video_platform = videoInfo.platform
          project.video_id = videoInfo.id
        }
      }

      return {
        ...project,
        tags: [project.category, ...roleTags].filter(Boolean),
      }
    })

    // Only return mock projects if no real projects exist
    return processedProjects.length > 0 ? processedProjects : mockProjects
  } catch (error) {
    console.error("Error in getProjects:", error)
    return mockProjects
  }
}

/**
 * Get all projects from the database for admin use - shows both public and private projects
 * Requires user to be authenticated as admin
 */
export async function getAllProjectsForAdmin(): Promise<Project[]> {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()
    if (!isDbSetup) {
      console.log("Database not set up, returning mock data")
      return mockProjects
    }

    const supabase = createServerClient()

    // Check if user is authenticated and has admin role using Clerk
    const user = await currentUser()
    const isAdmin = user ? await checkUserIsAdmin(user.id) : false

    if (!isAdmin) {
      throw new Error("Admin access required")
    }

    // For admin pages, show all projects including private ones
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("project_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects for admin:", error)
      return mockProjects
    }

    // Process projects to extract tags from categories and roles
    const processedProjects = data.map((project) => {
      // Extract tags from role field
      const roleTags = extractTagsFromRole(project.role)

      // If project has type but no category, use type as category (for backward compatibility)
      if (project.type && !project.category) {
        project.category = project.type
      }

      // If project has thumbnail_url but no video_platform/video_id, extract them
      if (project.thumbnail_url && (!project.video_platform || !project.video_id)) {
        const videoInfo = extractVideoInfo(project.thumbnail_url)
        if (videoInfo) {
          project.video_platform = videoInfo.platform
          project.video_id = videoInfo.id
        }
      }

      return {
        ...project,
        tags: [project.category, ...roleTags].filter(Boolean),
      }
    })

    // Only return mock projects if no real projects exist
    return processedProjects.length > 0 ? processedProjects : mockProjects
  } catch (error) {
    console.error("Error in getAllProjectsForAdmin:", error)
    return mockProjects
  }
}

/**
 * Get a project by ID with its BTS images and main media
 */
export async function getProjectById(id: string): Promise<(Project & { bts_images: BtsImage[], main_media: MainMedia[] }) | null> {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()

    // Check if the ID is a mock ID (not a UUID)
    const isMockId = !isValidUUID(id)

    // If database isn't set up or we have a mock ID, use mock data
    if (!isDbSetup || isMockId) {
      console.log(`Using mock data for project ID: ${id} (${isMockId ? "non-UUID format" : "database not set up"})`)
      const mockProject = mockProjects.find((p) => p.id === id)
      if (mockProject) {
        // Process video URL if present
        if (mockProject.thumbnail_url && (!mockProject.video_platform || !mockProject.video_id)) {
          const videoInfo = extractVideoInfo(mockProject.thumbnail_url)
          if (videoInfo) {
            mockProject.video_platform = videoInfo.platform
            mockProject.video_id = videoInfo.id
          }
        }

        return {
          ...mockProject,
          bts_images: mockBtsImages.filter((img) => img.project_id === id),
          main_media: [], // Mock projects don't have main media for now
        }
      }
      return null
    }

    // Only try to fetch from database if ID is a valid UUID
    if (!isValidUUID(id)) {
      console.warn(`Invalid UUID format for project ID: ${id}, falling back to mock data`)
      const mockProject = mockProjects.find((p) => p.id === id)
      if (mockProject) {
        return {
          ...mockProject,
          bts_images: mockBtsImages.filter((img) => img.project_id === id),
          main_media: [], // Mock projects don't have main media for now
        }
      }
      return null
    }

    const supabase = createServerClient()
    const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

    if (projectError) {
      console.error("Error fetching project:", projectError)
      const mockProject = mockProjects.find((p) => p.id === id)
      if (mockProject) {
        // Process video URL if present
        if (mockProject.thumbnail_url && (!mockProject.video_platform || !mockProject.video_id)) {
          const videoInfo = extractVideoInfo(mockProject.thumbnail_url)
          if (videoInfo) {
            mockProject.video_platform = videoInfo.platform
            mockProject.video_id = videoInfo.id
          }
        }

        return {
          ...mockProject,
          bts_images: mockBtsImages.filter((img) => img.project_id === id),
          main_media: [], // Mock projects don't have main media for now
        }
      }
      return null
    }

    // Process video URL if present (from thumbnail_url)
    if (project.thumbnail_url && (!project.video_platform || !project.video_id)) {
      const videoInfo = extractVideoInfo(project.thumbnail_url)
      if (videoInfo) {
        project.video_platform = videoInfo.platform
        project.video_id = videoInfo.id
      }
    }

    // Get BTS images for the project
    const { data: btsImages, error: btsError } = await supabase
      .from("bts_images")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true })

    if (btsError) {
      console.error("Error fetching BTS images:", btsError)
    }

    // Get main media for the project
    const { data: mainMedia, error: mainMediaError } = await supabase
      .from("main_media")
      .select("*")
      .eq("project_id", id)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (mainMediaError) {
      console.error("Error fetching main media:", mainMediaError)
    }

    // Extract tags from role field
    const roleTags = extractTagsFromRole(project.role)

    // If project has type but no category, use type as category (for backward compatibility)
    if (project.type && !project.category) {
      project.category = project.type
    }

    return {
      ...project,
      tags: [project.category, ...roleTags].filter(Boolean),
      bts_images: btsImages || [],
      main_media: mainMedia || [],
    } as Project & { bts_images: BtsImage[], main_media: MainMedia[] }
  } catch (error) {
    console.error("Error in getProjectById:", error)
    const mockProject = mockProjects.find((p) => p.id === id)
    if (mockProject) {
      // Process video URL if present
      if (mockProject.thumbnail_url && (!mockProject.video_platform || !mockProject.video_id)) {
        const videoInfo = extractVideoInfo(mockProject.thumbnail_url)
        if (videoInfo) {
          mockProject.video_platform = videoInfo.platform
          mockProject.video_id = videoInfo.id
        }
      }

      return {
        ...mockProject,
        bts_images: mockBtsImages.filter((img) => img.project_id === id),
        main_media: [], // Mock projects don't have main media for now
      }
    }
    return null
  }
}

/**
 * Get projects filtered by category
 */
export async function getProjectsByCategory(category: string): Promise<Project[]> {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()
    if (!isDbSetup) {
      console.log("Database not set up, returning filtered mock data")
      return mockProjects.filter((p) => p.category === category || p.type === category)
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("category", category)
      .order("project_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects by category:", error)
      return mockProjects.filter((p) => p.category === category || p.type === category)
    }

    // Process projects to extract tags
    const processedProjects = data.map((project) => {
      // Extract tags from role field
      const roleTags = extractTagsFromRole(project.role)

      // If project has type but no category, use type as category (for backward compatibility)
      if (project.type && !project.category) {
        project.category = project.type
      }

      // Process video URL if present
      if (project.thumbnail_url && (!project.video_platform || !project.video_id)) {
        const videoInfo = extractVideoInfo(project.thumbnail_url)
        if (videoInfo) {
          project.video_platform = videoInfo.platform
          project.video_id = videoInfo.id
        }
      }

      return {
        ...project,
        tags: [project.category, ...roleTags].filter(Boolean),
      }
    })

    // Only return mock projects if no real projects exist
    return processedProjects.length > 0
      ? processedProjects
      : mockProjects.filter((p) => p.category === category || p.type === category)
  } catch (error) {
    console.error("Error in getProjectsByCategory:", error)
    return mockProjects.filter((p) => p.category === category || p.type === category)
  }
}

/**
 * Get projects filtered by role
 */
export async function getProjectsByRole(role: string | string[]): Promise<Project[]> {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()
    if (!isDbSetup) {
      console.log("Database not set up, returning filtered mock data")
      if (Array.isArray(role)) {
        return mockProjects.filter((p) => role.includes(p.role))
      }
      return mockProjects.filter((p) => p.role === role)
    }

    const supabase = createServerClient()
    let query = supabase.from("projects").select("*")

    if (Array.isArray(role)) {
      // For multiple roles, we need to use OR conditions
      const conditions = role.map((r) => `role.ilike.%${r}%`).join(",")
      query = query.or(conditions)
    } else {
      // For single role, we can use ILIKE to match partial roles (comma-separated)
      query = query.ilike("role", `%${role}%`)
    }

    const { data, error } = await query
      .order("project_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects by role:", error)
      if (Array.isArray(role)) {
        return mockProjects.filter((p) => role.includes(p.role))
      }
      return mockProjects.filter((p) => p.role === role)
    }

    // Process projects to extract tags
    const processedProjects = data.map((project) => {
      // Extract tags from role field
      const roleTags = extractTagsFromRole(project.role)

      // If project has type but no category, use type as category (for backward compatibility)
      if (project.type && !project.category) {
        project.category = project.type
      }

      // Process video URL if present
      if (project.thumbnail_url && (!project.video_platform || !project.video_id)) {
        const videoInfo = extractVideoInfo(project.thumbnail_url)
        if (videoInfo) {
          project.video_platform = videoInfo.platform
          project.video_id = videoInfo.id
        }
      }

      return {
        ...project,
        tags: [project.category, ...roleTags].filter(Boolean),
      }
    })

    // Only return mock projects if no real projects exist
    if (processedProjects.length === 0) {
      if (Array.isArray(role)) {
        return mockProjects.filter((p) => role.includes(p.role))
      }
      return mockProjects.filter((p) => p.role === role)
    }

    return processedProjects
  } catch (error) {
    console.error("Error in getProjectsByRole:", error)
    if (Array.isArray(role)) {
      return mockProjects.filter((p) => role.includes(p.role))
    }
    return mockProjects.filter((p) => p.role === role)
  }
}