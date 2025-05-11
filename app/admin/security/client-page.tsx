"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SecurityDashboardHeader from "@/components/admin/security-dashboard-header"
import {
  loadDashboardState,
  saveDashboardState,
  loadUpdateModePreference,
  saveUpdateModePreference,
} from "@/lib/widget-state-manager"
import GridLayoutSystem, { type WidgetData } from "@/components/admin/grid-layout-system"
import UpdatePolicyWidget from "@/components/admin/update-policy-widget"
import DependencyList from "@/components/admin/dependency-list"
import VulnerabilityDetails from "@/components/admin/vulnerability-details"

export default function SecurityClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [updateMode, setUpdateMode] = useState<string>("manual")
  const [widgets, setWidgets] = useState<WidgetData[]>([])
  const [isLayoutChanged, setIsLayoutChanged] = useState(false)

  // Initialize dashboard
  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Get user ID (this would come from your auth system)
        // For now, we'll use a placeholder
        const tempUserId = "current-user-id"
        setUserId(tempUserId)

        // Load update mode preference
        const savedMode = await loadUpdateModePreference(tempUserId)
        if (savedMode) {
          setUpdateMode(savedMode)
        }

        // Load dashboard state
        const savedState = loadDashboardState("security-dashboard")

        if (savedState && savedState.widgets) {
          // Initialize widgets with saved state
          setWidgets(createWidgetsWithSavedState(savedState.widgets))
        } else {
          // Initialize default widgets
          setWidgets(createDefaultWidgets())
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing dashboard:", error)
        setIsLoading(false)
      }
    }

    initDashboard()
  }, [])

  // Create default widgets
  const createDefaultWidgets = (): WidgetData[] => {
    return [
      {
        id: "update-policy",
        title: "Update Policy",
        width: 400,
        height: 300,
        x: 0,
        y: 0,
        content: <UpdatePolicyWidget updateMode={updateMode} onUpdateModeChange={handleUpdateModeChange} />,
        isCollapsed: false,
      },
      {
        id: "dependency-list",
        title: "Dependencies",
        width: 600,
        height: 400,
        x: 420,
        y: 0,
        content: <DependencyList />,
        isCollapsed: false,
      },
      {
        id: "vulnerability-details",
        title: "Vulnerability Details",
        width: 500,
        height: 350,
        x: 0,
        y: 320,
        content: <VulnerabilityDetails />,
        isCollapsed: false,
      },
    ]
  }

  // Create widgets with saved state
  const createWidgetsWithSavedState = (savedWidgets: any[]): WidgetData[] => {
    return savedWidgets.map((widget) => {
      // Create widget content based on widget ID
      let content
      switch (widget.id) {
        case "update-policy":
          content = <UpdatePolicyWidget updateMode={updateMode} onUpdateModeChange={handleUpdateModeChange} />
          break
        case "dependency-list":
          content = <DependencyList />
          break
        case "vulnerability-details":
          content = <VulnerabilityDetails />
          break
        default:
          content = <div>Unknown widget type</div>
      }

      return {
        ...widget,
        content,
      }
    })
  }

  // Handle update mode change
  const handleUpdateModeChange = async (mode: string) => {
    setUpdateMode(mode)

    // Save update mode preference
    if (userId) {
      await saveUpdateModePreference(userId, mode)
    }

    // Update widgets
    setWidgets(
      widgets.map((widget) => {
        if (widget.id === "update-policy") {
          return {
            ...widget,
            content: <UpdatePolicyWidget updateMode={mode} onUpdateModeChange={handleUpdateModeChange} />,
          }
        }
        return widget
      }),
    )
  }

  // Handle layout change
  const handleLayoutChange = (updatedWidgets: WidgetData[]) => {
    setIsLayoutChanged(true)

    // Save widget state without content (which can't be serialized)
    const widgetsToSave = updatedWidgets.map(({ id, title, width, height, x, y, isCollapsed }) => ({
      id,
      title,
      width,
      height,
      x,
      y,
      isCollapsed,
    }))

    // Update widgets state
    setWidgets(updatedWidgets)
  }

  // Handle save layout
  const handleSaveLayout = () => {
    // Save widget state without content (which can't be serialized)
    const widgetsToSave = widgets.map(({ id, title, width, height, x, y, isCollapsed }) => ({
      id,
      title,
      width,
      height,
      x,
      y,
      isCollapsed,
    }))

    saveDashboardState("security-dashboard", {
      id: "security-dashboard",
      widgets: widgetsToSave,
      updateMode,
    })

    setIsLayoutChanged(false)
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)

    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, you would fetch fresh data here

    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SecurityDashboardHeader
        onRefresh={handleRefresh}
        onSaveLayout={handleSaveLayout}
        isLayoutChanged={isLayoutChanged}
        isLoading={isRefreshing}
      />

      <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[800px]">
        <GridLayoutSystem
          widgets={widgets}
          gridSize={20}
          onLayoutChange={handleLayoutChange}
          className="min-h-[800px]"
        />
      </div>
    </div>
  )
}
