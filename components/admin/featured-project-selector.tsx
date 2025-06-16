"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Project } from "@/lib/project-data"

export default function FeaturedProjectSelector() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get all projects
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .order("project_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })

        if (projectsError) {
          console.error("Error loading projects:", projectsError)
          return
        }

        setProjects(projectsData || [])

        // Get current featured project setting
        const { data: settingData, error: settingError } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "featured_project_id")
          .single()

        if (!settingError && settingData) {
          setSelectedProject(settingData.value)
        } else if (projectsData && projectsData.length > 0) {
          // Default to newest project
          setSelectedProject(projectsData[0].id)
        }
      } catch (err) {
        console.error("Error in loadData:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const supabase = getSupabaseBrowserClient()

      // Check if setting already exists
      const { data: existingData, error: checkError } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "featured_project_id")
        .maybeSingle()

      let result

      if (existingData) {
        // Update existing setting
        result = await supabase
          .from("site_settings")
          .update({ value: selectedProject })
          .eq("key", "featured_project_id")
      } else {
        // Insert new setting
        result = await supabase.from("site_settings").insert({ key: "featured_project_id", value: selectedProject })
      }

      if (result.error) {
        throw new Error(result.error.message)
      }

      toast({
        title: "Featured project updated",
        description: "The featured project has been updated successfully.",
      })
    } catch (err) {
      console.error("Error saving featured project:", err)
      toast({
        title: "Error",
        description: "Failed to update featured project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Featured Project</h3>
      <p className="text-sm text-muted-foreground">
        Select which project should be featured at the top of the homepage.
      </p>

      <div className="space-y-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
