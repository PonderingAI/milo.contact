"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Shield, RefreshCw } from "lucide-react"

export interface WidgetOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

interface WidgetSelectorProps {
  availableWidgets?: WidgetOption[]
  onAddWidget?: (widgetId: string) => void
}

export function WidgetSelector({ availableWidgets = [], onAddWidget = () => {} }: WidgetSelectorProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([])

  const defaultWidgets = [
    {
      id: "dependency-overview",
      title: "Dependency Overview",
      description: "Shows a summary of your project dependencies",
      icon: <Package className="h-4 w-4 text-blue-400" />,
    },
    {
      id: "security-alerts",
      title: "Security Alerts",
      description: "Displays security vulnerabilities in your dependencies",
      icon: <Shield className="h-4 w-4 text-red-400" />,
    },
    {
      id: "update-status",
      title: "Update Status",
      description: "Shows which packages need updates",
      icon: <RefreshCw className="h-4 w-4 text-green-400" />,
    },
  ]

  const widgetsToShow = availableWidgets.length > 0 ? availableWidgets : defaultWidgets

  const toggleWidget = (widgetId: string) => {
    if (selectedWidgets.includes(widgetId)) {
      setSelectedWidgets(selectedWidgets.filter((id) => id !== widgetId))
    } else {
      setSelectedWidgets([...selectedWidgets, widgetId])
      onAddWidget(widgetId)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Widgets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {widgetsToShow.map((widget) => (
            <Card
              key={widget.id}
              className={`bg-gray-700 border-gray-600 cursor-pointer transition-colors ${
                selectedWidgets.includes(widget.id) ? "border-blue-500" : ""
              }`}
              onClick={() => toggleWidget(widget.id)}
            >
              <CardHeader className="p-4 flex flex-row items-center space-y-0">
                <div className="mr-2">{widget.icon}</div>
                <CardTitle className="text-sm">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-gray-400">{widget.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
