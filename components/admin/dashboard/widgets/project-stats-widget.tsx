"use client"

import { useState, useEffect } from "react"
import { FileText, Loader2 } from "lucide-react"

interface ProjectStatsWidgetProps {
  title?: string
  endpoint?: string
}

interface ProjectStats {
  total: number
  categories: { [key: string]: number }
  roles: { [key: string]: number }
  recent: number
}

export function ProjectStatsWidget({ 
  title = "Project Statistics", 
  endpoint = "/api/projects/search" 
}: ProjectStatsWidgetProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all projects - try search with wildcard first, fallback to different approaches
        let response = await fetch(`${endpoint}?q=*`)
        
        // If search API doesn't work with wildcard, try alternative approaches
        if (!response.ok) {
          // Try calling without any query parameters to get all projects
          response = await fetch(endpoint)
          if (!response.ok) {
            throw new Error("Failed to fetch projects")
          }
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          const projects = data.data
          
          // Calculate statistics
          const categories: { [key: string]: number } = {}
          const roles: { [key: string]: number } = {}
          
          projects.forEach((project: any) => {
            // Count categories
            if (project.category) {
              categories[project.category] = (categories[project.category] || 0) + 1
            }
            
            // Count roles
            if (project.role) {
              roles[project.role] = (roles[project.role] || 0) + 1
            }
          })

          // Calculate recent projects (last 30 days)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          
          const recent = projects.filter((project: any) => {
            if (!project.created_at) return false
            return new Date(project.created_at) > thirtyDaysAgo
          }).length

          setStats({
            total: projects.length,
            categories,
            roles,
            recent
          })
        } else {
          throw new Error("Invalid response format")
        }
      } catch (err: any) {
        setError(err.message)
        console.error("Error fetching project stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectStats()
  }, [endpoint])

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading project stats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Failed to load project stats</p>
        <p className="text-xs text-destructive">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <FileText className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No project data available</p>
      </div>
    )
  }

  const topCategory = Object.entries(stats.categories).sort(([,a], [,b]) => b - a)[0]
  const topRole = Object.entries(stats.roles).sort(([,a], [,b]) => b - a)[0]

  return (
    <div className="flex flex-col h-full">
      <div className="text-muted-foreground mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span>{title}</span>
      </div>
      
      <div className="text-4xl font-bold text-primary mb-2">{stats.total}</div>
      <p className="text-sm text-muted-foreground mb-4">Total projects</p>
      
      <div className="space-y-2 flex-grow">
        {stats.recent > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recent (30 days):</span>
            <span className="font-medium">{stats.recent}</span>
          </div>
        )}
        
        {topCategory && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Top category:</span>
            <span className="font-medium">{topCategory[0]} ({topCategory[1]})</span>
          </div>
        )}
        
        {topRole && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Main role:</span>
            <span className="font-medium">{topRole[0]} ({topRole[1]})</span>
          </div>
        )}
      </div>
    </div>
  )
}