"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus } from "lucide-react"

export interface WidgetOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

interface WidgetSelectorProps {
  availableWidgets: WidgetOption[]
  onAddWidget: (widgetId: string) => void
}

export function WidgetSelector({ availableWidgets = [], onAddWidget }: WidgetSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleAddWidget = (widgetId: string) => {
    if (onAddWidget) {
      onAddWidget(widgetId)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed border-gray-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Widget
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gray-900 border-gray-800">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Add widgets to your dashboard</h4>
          <div className="grid gap-2">
            {availableWidgets.map((widget) => (
              <Button
                key={widget.id}
                variant="outline"
                className="justify-start h-auto p-3 border-gray-800"
                onClick={() => handleAddWidget(widget.id)}
              >
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">{widget.icon}</div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{widget.title}</div>
                    <div className="text-xs text-gray-400">{widget.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
