"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripHorizontal } from "lucide-react"
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
  const [isResizingWidget, setIsResizingWidget] = useState(false)
  const [resizeDirection, setResizeDirection] = useState("")

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

    // Don't start drag if we're resizing
    if (isResizingWidget) return

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
    const gridX = Math.max(0, Math.min(gridColumns - gridSize.w, Math.round(x / (cellWidth + gap))))
    const gridY = Math.max(0, Math.round(y / (cellHeight + gap)))

    if (gridX !== gridPosition.x || gridY !== gridPosition.y) {
      onPositionChange(widget.id, { x: gridX, y: gridY })
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

    setIsResizingWidget(true)
    setResizeDirection(direction)
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

    document.addEventListener("mousemove", handleResizeMove)
    document.addEventListener("mouseup", handleResizeEnd)
  }

  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!widgetRef.current || !isResizingWidget) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    // Convert to grid units
    const deltaGridX = Math.round(deltaX / (cellWidth + gap))
    const deltaGridY = Math.round(deltaY / (cellHeight + gap))

    let newW = resizeStart.w
    let newH = resizeStart.h

    // Update size based on direction
    if (resizeDirection.includes("e")) newW = Math.max(1, resizeStart.w + deltaGridX)
    if (resizeDirection.includes("s")) newH = Math.max(1, resizeStart.h + deltaGridY)
    if (resizeDirection.includes("w")) {
      const potentialNewW = Math.max(1, resizeStart.w - deltaGridX)
      if (potentialNewW !== newW) {
        newW = potentialNewW
        // Also need to update x position
        onPositionChange(widget.id, {
          x: gridPosition.x + (resizeStart.w - newW),
          y: gridPosition.y,
        })
      }
    }
    if (resizeDirection.includes("n")) {
      const potentialNewH = Math.max(1, resizeStart.h - deltaGridY)
      if (potentialNewH !== newH) {
        newH = potentialNewH
        // Also need to update y position
        onPositionChange(widget.id, {
          x: gridPosition.x,
          y: gridPosition.y + (resizeStart.h - newH),
        })
      }
    }

    // Apply min/max constraints
    newW = Math.max(gridSize.minW || 1, Math.min(gridSize.maxW || gridColumns, newW))
    newH = Math.max(gridSize.minH || 1, Math.min(gridSize.maxH || 10, newH))

    if (newW !== gridSize.w || newH !== gridSize.h) {
      onSizeChange(widget.id, { w: newW, h: newH })
    }
  }

  // Handle resize end
  const handleResizeEnd = () => {
    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleResizeEnd)
    setIsResizingWidget(false)
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
        zIndex: isDragging || isResizing || isHovered ? 10 : 1,
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
      <Card className="w-full h-full overflow-hidden shadow-md hover:shadow-lg transition-shadow rounded-xl">
        <div className="p-4 h-full relative">
          {/* Drag handle */}
          <div
            className="absolute top-2 left-2 cursor-move opacity-0 hover:opacity-100 transition-opacity z-10"
            onMouseDown={handleDragStart}
          >
            <GripHorizontal className="h-4 w-4 text-gray-400" />
          </div>

          {/* Close button */}
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

          {/* Widget content */}
          <div className="h-full">{children}</div>
        </div>

        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "se")}
        >
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-400"></div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        ></div>
        <div
          className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        ></div>
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-n-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "n")}
        ></div>
        <div
          className="absolute top-0 bottom-0 left-0 w-2 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "w")}
        ></div>
        <div
          className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "nw")}
        >
          <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-400"></div>
        </div>
        <div
          className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "ne")}
        >
          <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-400"></div>
        </div>
        <div
          className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, "sw")}
        >
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-400"></div>
        </div>
      </Card>
    </motion.div>
  )
}
