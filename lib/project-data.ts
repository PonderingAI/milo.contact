/**
 * Project Data Utilities
 *
 * This file contains types and functions for working with project data.
 * It handles fetching projects from Supabase and provides fallback to mock data.
 */

import { createServerClient } from "./supabase-server"

/**
 * Project interface representing a portfolio project
 */
export interface Project {
  id: string
  title: string
  category: string
  role: string
  image: string
  video_url?: string
  video_platform?: "youtube" | "vimeo"
  video_id?: string
  description?: string
  special_notes?: string
  created_at?: string
  updated_at?: string
  project_date?: string
  is_public?: boolean
  publish_date?: string
  // type is deprecated - use category or tags instead
  type?: string
  // Virtual property for tags - not stored in database
  tags?: string[]
}

/**
 * Behind-the-scenes image interface
 */
export interface BtsImage {
  id: string
  project_id: string
  image_url: string
  caption?: string
  size?: "small" | "medium" | "large"
  aspect_ratio?: "square" | "portrait" | "landscape"
  created_at?: string
}

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

      // If project has video_url but no video_platform/video_id, extract them
      if (project.video_url && (!project.video_platform || !project.video_id)) {
        const videoInfo = extractVideoInfo(project.video_url)
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
        if (mockProject.video_url && (!mockProject.video_platform || !mockProject.video_id)) {
          const videoInfo = extractVideoInfo(mockProject.video_url)
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
        if (mockProject.video_url && (!mockProject.video_platform || !mockProject.video_id)) {
          const videoInfo = extractVideoInfo(mockProject.video_url)
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

    // Process video URL if present
    if (project.video_url && (!project.video_platform || !project.video_id)) {
      const videoInfo = extractVideoInfo(project.video_url)
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
      if (mockProject.video_url && (!mockProject.video_platform || !mockProject.video_id)) {
        const videoInfo = extractVideoInfo(mockProject.video_url)
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
      if (project.video_url && (!project.video_platform || !project.video_id)) {
        const videoInfo = extractVideoInfo(project.video_url)
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
      if (project.video_url && (!project.video_platform || !project.video_id)) {
        const videoInfo = extractVideoInfo(project.video_url)
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

// Mock data for development - will be replaced by Supabase data in production
export const mockProjects = [
  // Directed Projects
  {
    id: "directed-1",
    title: "Short Film Title",
    category: "Short Film",
    role: "Director",
    image: "/images/project1.jpg",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "A compelling short film exploring themes of identity and belonging in a post-digital world.",
    special_notes:
      "This project was particularly special because we shot it entirely during golden hour over three consecutive days, creating a consistent and dreamlike visual atmosphere.",
    tags: ["Short Film", "Director"],
  },
  {
    id: "directed-2",
    title: "Music Video Project",
    category: "Music Video",
    role: "Director",
    image: "/images/project2.jpg",
    video_url: "https://vimeo.com/123456789",
    description: "An experimental music video featuring innovative visual techniques and storytelling.",
    special_notes:
      "Working with the artist to develop a visual language that complemented the music was a rewarding creative challenge.",
    tags: ["Music Video", "Director"],
  },

  // Camera Work Projects
  {
    id: "camera-1",
    title: "Feature Film",
    category: "Feature Film",
    role: "1st AC",
    image: "/images/project5.jpg",
    video_url: "https://youtube.com/watch?v=i_HtDNSxCnE",
    description: "Worked as 1st AC on this award-winning feature film, managing focus and camera operations.",
    special_notes:
      "The challenging lighting conditions and complex camera movements made this project particularly rewarding.",
    tags: ["Feature Film", "1st AC"],
  },
  {
    id: "camera-2",
    title: "TV Series",
    category: "Television",
    role: "2nd AC",
    image: "/images/project6.jpg",
    video_url: "https://www.youtube.com/watch?v=lmnopqrstuv",
    description: "Served as 2nd AC for this popular TV series, handling equipment and supporting the camera team.",
    special_notes: "Working with a seasoned DP taught me invaluable lessons about lighting and composition.",
    tags: ["Television", "2nd AC"],
  },

  // Production Projects
  {
    id: "production-1",
    title: "Short Film",
    category: "Short Film",
    role: "Production Assistant",
    image: "/images/project2.jpg",
    video_url: "https://youtube.com/watch?v=-fgtd87ywuw",
    description: "Provided essential support as a PA on this award-winning short film production.",
    special_notes: "Being part of such a collaborative and creative team was an incredible learning experience.",
    tags: ["Short Film", "Production Assistant"],
  },
  {
    id: "production-2",
    title: "Music Video",
    category: "Music Video",
    role: "Production Assistant",
    image: "/images/project3.jpg",
    video_url: "https://youtube.com/watch?v=Oix719dXXb8",
    description: "Assisted with various aspects of production for this innovative music video.",
    special_notes: "The fast-paced production schedule taught me how to work efficiently under pressure.",
    tags: ["Music Video", "Production Assistant"],
  },

  // Photography Projects
  {
    id: "photo-1",
    title: "Landscape Series",
    category: "Landscape",
    role: "Photographer",
    image: "/images/project6.jpg",
    description: "A series of landscape photographs capturing the beauty of natural environments.",
    special_notes:
      "Spending weeks in remote locations to capture these images gave me a deeper appreciation for nature's beauty.",
    tags: ["Landscape", "Photographer"],
  },
  {
    id: "photo-2",
    title: "Portrait Collection",
    category: "Portrait",
    role: "Photographer",
    image: "/images/project7.jpg",
    description: "A collection of portrait photographs exploring human expression and identity.",
    special_notes:
      "Creating an environment where subjects felt comfortable enough to express their authentic selves was the key to these portraits.",
    tags: ["Portrait", "Photographer"],
  },
  {
    id: "ai-1",
    title: "AI Generated Art",
    category: "AI",
    role: "AI Artist",
    image: "/images/project4.jpg",
    description:
      "A collection of AI-generated artwork exploring the intersection of human creativity and machine learning.",
    special_notes:
      "This project uses cutting-edge AI models to create unique visual experiences that challenge our perception of art and creativity.",
    tags: ["AI", "AI Artist"],
  },
]

// Mock BTS images for development
export const mockBtsImages = [
  // For directed-1
  {
    id: "bts-1",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-1.jpg",
    caption: "Setting up the camera rig",
    size: "medium",
    aspect_ratio: "landscape",
  },
  {
    id: "bts-2",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-2.jpg",
    caption: "Director discussing the scene",
    size: "large",
    aspect_ratio: "portrait",
  },
  {
    id: "bts-3",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-3.jpg",
    caption: "Lighting setup",
    size: "small",
    aspect_ratio: "square",
  },
  {
    id: "bts-4",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-4.jpg",
    caption: "Cast and crew",
    size: "medium",
    aspect_ratio: "landscape",
  },

  // For camera-1
  {
    id: "bts-5",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-1.jpg",
    caption: "Camera setup",
    size: "medium",
    aspect_ratio: "landscape",
  },
  {
    id: "bts-6",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-2.jpg",
    caption: "Focus pulling",
    size: "small",
    aspect_ratio: "square",
  },
  {
    id: "bts-7",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-3.jpg",
    caption: "Camera team",
    size: "large",
    aspect_ratio: "landscape",
  },
  {
    id: "bts-8",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-4.jpg",
    caption: "Equipment preparation",
    size: "medium",
    aspect_ratio: "portrait",
  },
]
