import { createClient } from "@/lib/supabase-browser"

// Type definitions for project data
export interface ProjectData {
  id?: string
  title: string
  description: string
  thumbnail_url?: string
  video_url?: string
  featured?: boolean
  tags?: string[]
  created_at?: string
  updated_at?: string
  slug?: string
  content?: string
  category?: string
  order?: number
  bts_images?: string[]
}

// Create a new project
export async function createProject(projectData: ProjectData) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("projects").insert(projectData).select().single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error creating project:", error)
    return { success: false, error }
  }
}

// Get a project by ID
export async function getProject(id: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching project:", error)
    return { success: false, error }
  }
}

// Update an existing project
export async function updateProject(id: string, projectData: Partial<ProjectData>) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("projects").update(projectData).eq("id", id).select().single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("Error updating project:", error)
    return { success: false, error }
  }
}
