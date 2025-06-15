/**
 * Project Data Utilities
 *
 * This file contains types and functions for working with project data.
 * It handles fetching projects from Supabase and provides fallback to mock data.
 */

import { createServerClient } from "./supabase-server"
import { mockProjects, mockBtsImages, type Project, type BtsImage } from "./mock-data"

// Re-export types for backward compatibility
export type { Project, BtsImage }

// Re-export mock data for backward compatibility
export { mockProjects, mockBtsImages }

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

/**
 * Extract tags from role field
 */
export function extractTagsFromRole(role: string | null | undefined): string[] {
  if (!role) return []
  return role
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

/**
 * Get all projects from the database or fallback to mock data
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

    // Check if user is authenticated and has admin role
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const isAdmin = session?.user ? await checkUserIsAdmin(session.user.id) : false

    let query = supabase.from("projects").select("*")

    // If not admin, only show public projects or those with publish_date in the past
    if (!isAdmin) {
      const now = new Date().toISOString()
      query = query.or(`is_public.eq.true,publish_date.lt.${now}`)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

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

// Helper function to check if a user has admin role
async function checkUserIsAdmin(userId: string): Promise<boolean> {
  try {
    // Try to use an API endpoint to check admin status
    try {
      const response = await fetch(`/api/auth/check-admin?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        return data.isAdmin === true
      }
    } catch (apiError) {
      console.log("API admin check failed, falling back to database check")
    }
    
    // Fallback to database check
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error in checkUserIsAdmin:", error)
    return false
  }
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Get a project by ID with its BTS images
 */
export async function getProjectById(id: string): Promise<(Project & { bts_images: BtsImage[] }) | null> {
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
    } as Project & { bts_images: BtsImage[] }
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

    const { data, error } = await query.order("created_at", { ascending: false })

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

/**
 * Extract video platform and ID from a video URL
 */
export function extractVideoInfo(url: string): { platform: string; id: string } | null {
  try {
    if (!url || typeof url !== "string") {
      console.error("Invalid video URL:", url)
      return null
    }

    // YouTube URL patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
    ]

    // Vimeo URL patterns
    const vimeoPatterns = [
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/i,
      /(?:https?:\/\/)?(?:www\.)?player\.vimeo\.com\/video\/(\d+)/i,
    ]

    // LinkedIn URL patterns
    const linkedinPatterns = [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/urn:li:activity:([0-9a-zA-Z-]+)/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/[^/]+-([0-9a-zA-Z-]+)/i,
    ]

    // Check YouTube patterns
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return { platform: "youtube", id: match[1] }
      }
    }

    // Check Vimeo patterns
    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return { platform: "vimeo", id: match[1] }
      }
    }

    // Check LinkedIn patterns
    for (const pattern of linkedinPatterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return { platform: "linkedin", id: match[1] }
      }
    }

    console.warn("Unrecognized video URL format:", url)
    return null
  } catch (error) {
    console.error("Error extracting video info:", error)
    return null
  }
}

// Add this new function to fetch YouTube video titles using the oEmbed API
export async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    )

    if (!response.ok) {
      console.error(`Failed to fetch YouTube title: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.title || null
  } catch (error) {
    console.error("Error fetching YouTube title:", error)
    return null
  }
}


