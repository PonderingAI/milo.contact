"use client"

import { useState, useEffect } from "react"
import { Activity, CheckCircle, AlertCircle, Package, Upload, Database } from "lucide-react"

interface SystemActivityWidgetProps {
  title?: string
  maxItems?: number
}

interface ActivityItem {
  id: string
  type: "project" | "media" | "security" | "system" | "dependency"
  message: string
  timestamp: Date
  status: "success" | "error" | "warning" | "info"
}

export function SystemActivityWidget({ 
  title = "Recent Activity",
  maxItems = 5
}: SystemActivityWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const generateMockActivity = (): ActivityItem[] => {
    const now = new Date()
    const activities: ActivityItem[] = []

    // Generate some realistic activity items
    const mockActivities = [
      {
        type: "project" as const,
        message: "New project 'Documentary Feature' created",
        status: "success" as const,
        timestamp: new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        type: "security" as const,
        message: "Security scan completed - 2 vulnerabilities found",
        status: "warning" as const,
        timestamp: new Date(now.getTime() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        type: "media" as const,
        message: "Uploaded 3 new images to gallery",
        status: "success" as const,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        type: "dependency" as const,
        message: "Updated @radix-ui/react-dialog to v1.1.4",
        status: "success" as const,
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        type: "system" as const,
        message: "Database backup completed successfully",
        status: "success" as const,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: "security" as const,
        message: "Dependabot alert resolved for lodash",
        status: "success" as const,
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        type: "media" as const,
        message: "Failed to process video thumbnail",
        status: "error" as const,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ]

    return mockActivities.slice(0, maxItems).map((activity, index) => ({
      id: `activity-${index}`,
      ...activity
    }))
  }

  useEffect(() => {
    // In a real implementation, this would fetch from an activity log API
    const fetchActivity = async () => {
      try {
        setLoading(true)
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // For now, use mock data
        const mockActivities = generateMockActivity()
        setActivities(mockActivities)
      } catch (error) {
        console.error("Error fetching activity:", error)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [maxItems])

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "project":
        return <Package className="h-4 w-4" />
      case "media":
        return <Upload className="h-4 w-4" />
      case "security":
        return <AlertCircle className="h-4 w-4" />
      case "dependency":
        return <Package className="h-4 w-4" />
      case "system":
        return <Database className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case "warning":
        return <AlertCircle className="h-3 w-3 text-yellow-500" />
      case "info":
        return <Activity className="h-3 w-3 text-blue-500" />
      default:
        return <Activity className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "text-green-500"
      case "error":
        return "text-red-500"
      case "warning":
        return "text-yellow-500"
      case "info":
        return "text-blue-500"
      default:
        return "text-muted-foreground"
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return timestamp.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span>{title}</span>
        </div>
        <div className="space-y-3 flex-grow">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-muted rounded animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <Activity className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-muted-foreground mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        <span>{title}</span>
      </div>
      
      <div className="space-y-3 flex-grow overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1.5 bg-muted rounded-full">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground flex-1">
                  {activity.message}
                </p>
                {getStatusIcon(activity.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}