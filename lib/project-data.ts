import { createServerClient } from "./supabase"

export interface Project {
  id: string
  title: string
  category: string
  type: string
  role: string
  image: string
  video_url?: string
  video_platform?: "youtube" | "vimeo"
  video_id?: string
  description?: string
  special_notes?: string
  created_at?: string
  updated_at?: string
}

export interface BtsImage {
  id: string
  project_id: string
  image_url: string
  caption?: string
  size?: "small" | "medium" | "large"
  aspect_ratio?: "square" | "portrait" | "landscape"
  created_at?: string
}

// Check if database is set up
export async function isDatabaseSetup() {
  try {
    const supabase = createServerClient()

    // Try to query the projects table
    const { data, error } = await supabase.from("projects").select("count(*)", { count: "exact", head: true })

    // If there's a specific error about the relation not existing, the table doesn't exist
    if (error && error.message.includes('relation "public.projects" does not exist')) {
      return false
    }

    // If there's some other error, we'll assume the database is not properly set up
    if (error) {
      console.error("Error checking database setup:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking database setup:", error)
    return false
  }
}

// Server-side data fetching functions
export async function getProjects() {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()
    if (!isDbSetup) {
      console.log("Database not set up, returning mock data")
      return mockProjects
    }

    const supabase = createServerClient()
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
      return mockProjects
    }

    return data.length > 0 ? data : mockProjects
  } catch (error) {
    console.error("Error in getProjects:", error)
    return mockProjects
  }
}

export async function getProjectById(id: string) {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()
    if (!isDbSetup) {
      console.log("Database not set up, returning mock project")
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
        return {
          ...mockProject,
          bts_images: mockBtsImages.filter((img) => img.project_id === id),
        }
      }
      return null
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

    return {
      ...project,
      bts_images: btsImages || [],
    } as Project & { bts_images: BtsImage[] }
  } catch (error) {
    console.error("Error in getProjectById:", error)
    const mockProject = mockProjects.find((p) => p.id === id)
    if (mockProject) {
      return {
        ...mockProject,
        bts_images: mockBtsImages.filter((img) => img.project_id === id),
      }
    }
    return null
  }
}

export async function getProjectsByType(type: string) {
  try {
    // First check if database is set up
    const isDbSetup = await isDatabaseSetup()
    if (!isDbSetup) {
      console.log("Database not set up, returning filtered mock data")
      return mockProjects.filter((p) => p.type === type)
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects by type:", error)
      return mockProjects.filter((p) => p.type === type)
    }

    return data.length > 0 ? data : mockProjects.filter((p) => p.type === type)
  } catch (error) {
    console.error("Error in getProjectsByType:", error)
    return mockProjects.filter((p) => p.type === type)
  }
}

export async function getProjectsByRole(role: string | string[]) {
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
      query = query.in("role", role)
    } else {
      query = query.eq("role", role)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects by role:", error)
      if (Array.isArray(role)) {
        return mockProjects.filter((p) => role.includes(p.role))
      }
      return mockProjects.filter((p) => p.role === role)
    }

    if (data.length === 0) {
      if (Array.isArray(role)) {
        return mockProjects.filter((p) => role.includes(p.role))
      }
      return mockProjects.filter((p) => p.role === role)
    }

    return data
  } catch (error) {
    console.error("Error in getProjectsByRole:", error)
    if (Array.isArray(role)) {
      return mockProjects.filter((p) => role.includes(p.role))
    }
    return mockProjects.filter((p) => p.role === role)
  }
}

// Helper function to extract video ID from YouTube or Vimeo URL
export function extractVideoInfo(url: string | undefined) {
  if (!url) return null

  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regex)
    return match ? { platform: "youtube", id: match[1] } : null
  }

  // Vimeo
  if (url.includes("vimeo.com")) {
    const regex =
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/
    const match = url.match(regex)
    return match ? { platform: "vimeo", id: match[1] } : null
  }

  return null
}

// Mock data for development - will be replaced by Supabase data in production
export const mockProjects = [
  // Directed Projects
  {
    id: "directed-1",
    title: "Short Film Title",
    category: "Short Film",
    type: "directed",
    role: "Director",
    image: "/images/project1.jpg",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "A compelling short film exploring themes of identity and belonging in a post-digital world.",
    special_notes:
      "This project was particularly special because we shot it entirely during golden hour over three consecutive days, creating a consistent and dreamlike visual atmosphere.",
  },
  {
    id: "directed-2",
    title: "Music Video Project",
    category: "Music Video",
    type: "directed",
    role: "Director",
    image: "/images/project2.jpg",
    video_url: "https://vimeo.com/123456789",
    description: "An experimental music video featuring innovative visual techniques and storytelling.",
    special_notes:
      "Working with the artist to develop a visual language that complemented the music was a rewarding creative challenge.",
  },

  // Camera Work Projects
  {
    id: "camera-1",
    title: "Feature Film",
    category: "Feature Film",
    type: "camera",
    role: "1st AC",
    image: "/images/project5.jpg",
    video_url: "https://youtube.com/watch?v=i_HtDNSxCnE",
    description: "Worked as 1st AC on this award-winning feature film, managing focus and camera operations.",
    special_notes:
      "The challenging lighting conditions and complex camera movements made this project particularly rewarding.",
  },
  {
    id: "camera-2",
    title: "TV Series",
    category: "Television",
    type: "camera",
    role: "2nd AC",
    image: "/images/project6.jpg",
    video_url: "https://www.youtube.com/watch?v=lmnopqrstuv",
    description: "Served as 2nd AC for this popular TV series, handling equipment and supporting the camera team.",
    special_notes: "Working with a seasoned DP taught me invaluable lessons about lighting and composition.",
  },

  // Production Projects
  {
    id: "production-1",
    title: "Short Film",
    category: "Short Film",
    type: "production",
    role: "Production Assistant",
    image: "/images/project2.jpg",
    video_url: "https://youtube.com/watch?v=-fgtd87ywuw",
    description: "Provided essential support as a PA on this award-winning short film production.",
    special_notes: "Being part of such a collaborative and creative team was an incredible learning experience.",
  },
  {
    id: "production-2",
    title: "Music Video",
    category: "Music Video",
    type: "production",
    role: "Production Assistant",
    image: "/images/project3.jpg",
    video_url: "https://youtube.com/watch?v=Oix719dXXb8",
    description: "Assisted with various aspects of production for this innovative music video.",
    special_notes: "The fast-paced production schedule taught me how to work efficiently under pressure.",
  },

  // Photography Projects
  {
    id: "photo-1",
    title: "Landscape Series",
    category: "Landscape",
    type: "photography",
    role: "Photographer",
    image: "/images/project6.jpg",
    description: "A series of landscape photographs capturing the beauty of natural environments.",
    special_notes:
      "Spending weeks in remote locations to capture these images gave me a deeper appreciation for nature's beauty.",
  },
  {
    id: "photo-2",
    title: "Portrait Collection",
    category: "Portrait",
    type: "photography",
    role: "Photographer",
    image: "/images/project7.jpg",
    description: "A collection of portrait photographs exploring human expression and identity.",
    special_notes:
      "Creating an environment where subjects felt comfortable enough to express their authentic selves was the key to these portraits.",
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
