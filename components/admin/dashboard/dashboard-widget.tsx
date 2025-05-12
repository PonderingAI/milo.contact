"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Widget } from "./widget-container"

interface DashboardWidgetProps {
  widget: Widget
  gridColumns: number
  cellWidth: number
  cellHeight: number
  gap: number
  children: React.ReactNode
  onRemove: (id: string) => void
  onPositionChange: (id: string, position: { x: number; y: number }) => void
  onSizeChange: (id: string, size: { w: number; h: number }) => void
  onDragStart: () => void
  onDragEnd: () => void
  onResizeStart: () => void
  onResizeEnd: () => void
  isDragging: boolean
  isResizing: boolean
}

export function DashboardWidget({
  widget,
  gridColumns,
  cellWidth,
  cellHeight,
  gap,
  children,
  onRemove,
  onPositionChange,
  onSizeChange,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  isDragging,
  isResizing,
}: DashboardWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  // Calculate grid position and size
  const gridPosition = widget.position || { x: 0, y: 0 }
  const gridSize = widget.size

  // Calculate pixel position and size
  const pixelPosition = {
    x: gridPosition.x * (cellWidth + gap),
    y: gridPosition.y * (cellHeight + gap),
  }

  const pixelSize = {
    width: gridSize.w * cellWidth + (gridSize.w - 1) * gap,
    height: gridSize.h * cellHeight + (gridSize.h - 1) * gap,
  }

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    onDragStart()

    const rect = widgetRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    document.addEventListener("mousemove", handleDragMove)
    document.addEventListener("mouseup", handleDragEnd)
  }

  // Handle drag move
  const handleDragMove = (e: MouseEvent) => {
    if (!widgetRef.current) return

    const rect = widgetRef.current.parentElement?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left - dragStart.x
    const y = e.clientY - rect.top - dragStart.y

    // Convert to grid coordinates
    const gridX = Math.round(x / (cellWidth + gap))
    const gridY = Math.round(y / (cellHeight + gap))

    // Ensure within bounds
    const boundedX = Math.max(0, Math.min(gridColumns - gridSize.w, gridX))
    const boundedY = Math.max(0, gridY)

    if (boundedX !== gridPosition.x || boundedY !== gridPosition.y) {
      onPositionChange(widget.id, { x: boundedX, y: boundedY })
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    document.removeEventListener("mousemove", handleDragMove)
    document.removeEventListener("mouseup", handleDragEnd)
    onDragEnd()
  }

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    onResizeStart()

    const rect = widgetRef.current?.getBoundingClientRect()
    if (rect) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        w: gridSize.w,
        h: gridSize.h,
      })
    }

    const handleDirection = (e: MouseEvent) => handleResizeMove(e, direction)
    document.addEventListener("mousemove", handleDirection)
    document.addEventListener("mouseup", () => handleResizeEnd(direction))

    // Store the cleanup function
    const cleanup = () => {
      document.removeEventListener("mousemove", handleDirection)
      document.removeEventListener("mouseup", cleanup)
    }

    // Add cleanup to mouseup
    document.addEventListener("mouseup", cleanup)
  }

  // Handle resize move
  const handleResizeMove = (e: MouseEvent, direction: string) => {
    if (!widgetRef.current) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    // Convert to grid units
    const deltaGridX = Math.round(deltaX / (cellWidth + gap))
    const deltaGridY = Math.round(deltaY / (cellHeight + gap))

    let newW = resizeStart.w
    let newH = resizeStart.h

    // Update size based on direction
    if (direction.includes("e")) newW = Math.max(1, resizeStart.w + deltaGridX)
    if (direction.includes("s")) newH = Math.max(1, resizeStart.h + deltaGridY)

    // Apply min/max constraints
    newW = Math.max(gridSize.minW || 1, Math.min(gridSize.maxW || gridColumns, newW))
    newH = Math.max(gridSize.minH || 1, Math.min(gridSize.maxH || 10, newH))

    if (newW !== gridSize.w || newH !== gridSize.h) {
      onSizeChange(widget.id, { w: newW, h: newH })
    }
  }

  // Handle resize end
  const handleResizeEnd = (direction: string) => {
    const handleDirection = (e: MouseEvent) => handleResizeMove(e, direction)
    document.removeEventListener("mousemove", handleDirection)
    onResizeEnd()
  }

  return (
    <motion.div
      ref={widgetRef}
      className="absolute"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: pixelPosition.x,
        y: pixelPosition.y,
        width: pixelSize.width,
        height: pixelSize.height,
        zIndex: isDragging || isResizing ? 10 : 1,
      }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className="w-full h-full overflow-hidden shadow-md hover:shadow-lg transition-shadow rounded-xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="p-4 h-full relative">
          {isHovered && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 text-gray-500 hover:text-red-500 z-10 bg-background/80 backdrop-blur-sm rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(widget.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="h-full">{children}</div>
        </div>

        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        />
      </Card>
    </motion.div>
  )
}
