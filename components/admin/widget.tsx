"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripVertical } from "lucide-react"
import { motion } from "framer-motion"

interface WidgetProps {
  id: string
  title: string
  children: React.ReactNode
  onRemove?: (id: string) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, id: string) => void
  onDragEnd?: () => void
  draggingWidgetId?: string | null
  className?: string
  fullWidth?: boolean
  highlighted?: boolean
}

export function WidgetComponent({
  id,
  title,
  children,
  onRemove,
  draggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggingWidgetId,
  className = "",
  fullWidth = false,
  highlighted = false,
}: WidgetProps) {
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
      className={`mb-4 ${fullWidth ? "col-span-1 md:col-span-2 lg:col-span-3" : ""} ${className}`}
    >
      <Card
        className={`bg-gray-800 border-gray-700 transition-all duration-200 h-full ${
          draggingWidgetId === id ? "opacity-70 scale-105" : ""
        } ${highlighted ? "border-blue-700 shadow-lg shadow-blue-900/20" : ""}`}
        draggable={draggable}
        onDragStart={onDragStart ? (e) => onDragStart(e, id) : undefined}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop && id ? (e) => onDrop(e, id) : undefined}
      >
        <CardHeader
          className={`p-4 flex flex-row items-center justify-between space-y-0 bg-gray-800 rounded-t-lg border-b border-gray-700 ${
            highlighted ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40" : ""
          }`}
        >
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 text-gray-500 mr-2 cursor-move" />
            <CardTitle className={`text-sm font-medium ${highlighted ? "text-blue-200" : "text-gray-200"}`}>
              {title}
            </CardTitle>
          </div>
          {onRemove && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRemove(id)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4">{children}</CardContent>
      </Card>
    </motion.div>
  )
}
