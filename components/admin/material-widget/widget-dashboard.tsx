"use client"

import type React from "react"
import { WidgetProvider, useWidgetContext } from "./widget-context"
import GridLayout from "./grid-layout"
import WidgetToolbar from "./widget-toolbar"
import type { WidgetLayout } from "@/lib/grid-utils"

interface WidgetDashboardProps {
  initialLayouts: WidgetLayout[]
  initialUpdateMode: string
  children: React.ReactNode
}

export default function WidgetDashboard({ initialLayouts, initialUpdateMode, children }: WidgetDashboardProps) {
  return (
    <WidgetProvider initialLayouts={initialLayouts} initialUpdateMode={initialUpdateMode}>
      <div className="flex flex-col h-full">
        <WidgetToolbar />
        <WidgetDashboardContent>{children}</WidgetDashboardContent>
      </div>
    </WidgetProvider>
  )
}

function WidgetDashboardContent({ children }: { children: React.ReactNode }) {
  const { layouts, updateLayouts, isEditing } = useWidgetContext()

  return (
    <div className="flex-1 overflow-auto p-4">
      <GridLayout layouts={layouts} onLayoutChange={updateLayouts} isEditing={isEditing} className="min-h-[600px]">
        {children}
      </GridLayout>
    </div>
  )
}
