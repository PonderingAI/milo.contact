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
}: DraggableWidgetProps) {
  const isUpdateSettings = title.toLowerCase().includes("global update")

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={isUpdateSettings ? "col-span-1 md:col-span-2 lg:col-span-3" : ""}
    >
      <Card
        className={`bg-gray-800 border-gray-700 transition-all duration-200 ${
          isUpdateSettings ? "border-blue-700 shadow-lg shadow-blue-900/20" : ""
        }`}
        draggable
        onDragStart={(e) => onDragStart(e, id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, id)}
      >
        <CardHeader
          className={`p-4 flex flex-row items-center justify-between space-y-0 ${
            isUpdateSettings ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-t-lg" : ""
          }`}
        >
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 text-gray-500 mr-2 cursor-move" />
            <CardTitle className={`text-sm font-medium ${isUpdateSettings ? "text-blue-200" : ""}`}>{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onRemove(id)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  )
}
