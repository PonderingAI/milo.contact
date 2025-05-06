"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Grip, X, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DraggableWidgetProps {
  id: string
  title: string
  onRemove: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: string) => void
  className?: string
  children: React.ReactNode
}

export function DraggableWidget({
  id,
  title,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  className,
  children,
}: DraggableWidgetProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Card
      className={cn("bg-gray-900 border-gray-800", className)}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, id)}
    >
      <CardHeader className="p-3 flex flex-row items-center space-y-0 border-b border-gray-800">
        <div className="flex items-center flex-1">
          <Grip className="h-4 w-4 text-gray-500 mr-2 cursor-move" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-400" onClick={() => onRemove(id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {!collapsed && <CardContent className="p-4">{children}</CardContent>}
    </Card>
  )
}
