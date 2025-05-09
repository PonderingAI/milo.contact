"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Grip, X } from "lucide-react"

interface Widget {
  id: string
  name: string
  description?: string
  enabled: boolean
  position?: number
}

interface DraggableWidgetProps {
  widget: Widget
  onRemove?: (id: string) => void
  onToggle?: (id: string, enabled: boolean) => void
}

export function DraggableWidget({ widget, onRemove = () => {}, onToggle = () => {} }: DraggableWidgetProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleToggle = (checked: boolean) => {
    onToggle(widget.id, checked)
  }

  return (
    <Card className={`bg-gray-700 border-gray-600 ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex items-center">
          <Grip className="h-4 w-4 mr-2 cursor-move text-gray-400" />
          <CardTitle className="text-base">{widget.name}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={widget.enabled} onCheckedChange={handleToggle} aria-label={`Toggle ${widget.name}`} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(widget.id)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </CardHeader>
      {widget.description && (
        <CardContent className="pt-0 pb-4 px-4">
          <p className="text-sm text-gray-300">{widget.description}</p>
        </CardContent>
      )}
    </Card>
  )
}
