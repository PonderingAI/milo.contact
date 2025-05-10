"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripVertical } from "lucide-react"
import { motion } from "framer-motion"

interface DraggableWidgetProps {
  id: string
  title: string
  children: React.ReactNode
  onRemove: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: string) => void
  onDragEnd?: () => void
  draggingWidgetId?: string | null
}

export function DraggableWidget({
  id,
  title,
  children,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggingWidgetId,
}: DraggableWidgetProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        zIndex: draggingWidgetId === id ? 10 : 1,
        boxShadow: draggingWidgetId === id ? "0 10px 25px rgba(0, 0, 0, 0.5)" : "none",
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card
        className={`bg-gray-800 border-gray-700 transition-all duration-200 h-full ${
          draggingWidgetId === id ? "opacity-70 scale-105" : ""
        }`}
        draggable
        onDragStart={(e) => onDragStart(e, id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, id)}
      >
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-gray-800 rounded-t-lg border-b border-gray-700">
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 text-gray-500 mr-2 cursor-move" />
            <CardTitle className="text-sm font-medium text-gray-200">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRemove(id)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">{children}</CardContent>
      </Card>
    </motion.div>
  )
}
