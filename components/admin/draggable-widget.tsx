"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripVertical } from "lucide-react"

interface DraggableWidgetProps {
  id: string
  title: string
  children: React.ReactNode
  onRemove: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: string) => void
}

export function DraggableWidget({
  id,
  title,
  children,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: DraggableWidgetProps) {
  return (
    <Card
      className="bg-gray-800 border-gray-700"
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, id)}
    >
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center">
          <GripVertical className="h-4 w-4 text-gray-500 mr-2 cursor-move" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRemove(id)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">{children}</CardContent>
    </Card>
  )
}
