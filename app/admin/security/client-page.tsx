"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import WidgetDashboard from "@/components/admin/material-widget/widget-dashboard"
import WidgetContainer from "@/components/admin/material-widget/widget-container"
import type { WidgetLayout } from "@/lib/grid-utils"
import UpdatePolicyWidget from "@/components/admin/update-policy-widget"
import DependencyList from "@/components/admin/dependency-list"
import VulnerabilityDetails from "@/components/admin/vulnerability-details"

// Default layouts for widgets
const defaultLayouts: WidgetLayout[] = [
  { id: "update-policy", x: 0, y: 0, width: 12, height: 8 },
  { id: "dependency-list", x: 12, y: 0, width: 12, height: 12 },
  { id: "vulnerability-details", x: 0, y: 8, width: 12, height: 10 },
]

export default function SecurityClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateMode, setUpdateMode] = useState("manual")
  const [layouts, setLayouts] = useState<WidgetLayout[]>(defaultLayouts)

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true)

        // Load update mode
        const modeResponse = await fetch("/api/dependencies/settings?key=update_mode")
        if (!modeResponse.ok) {
          throw new Error("Failed to load update mode")
        }
        const modeData = await modeResponse.json()
        if (modeData.value) {
          setUpdateMode(modeData.value)
        }

        // Load widget layouts
        const layoutsResponse = await fetch("/api/dependencies/settings?key=widget_layouts")
        if (layoutsResponse.ok) {
          const layoutsData = await layoutsResponse.json()
          if (layoutsData.value && Array.isArray(layoutsData.value)) {
            setLayouts(layoutsData.value)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading settings:", error)
        setError("Failed to load settings")
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={() => router.refresh()} className="px-4 py-2 bg-primary text-white rounded-md">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full">
      <WidgetDashboard initialLayouts={layouts} initialUpdateMode={updateMode}>
        <WidgetContainer id="update-policy" title="Update Policy" minWidth={6} minHeight={6}>
          <UpdatePolicyWidget />
        </WidgetContainer>

        <WidgetContainer id="dependency-list" title="Dependencies" minWidth={6} minHeight={8}>
          <DependencyList />
        </WidgetContainer>

        <WidgetContainer id="vulnerability-details" title="Vulnerability Details" minWidth={6} minHeight={6}>
          <VulnerabilityDetails />
        </WidgetContainer>
      </WidgetDashboard>
    </div>
  )
}
