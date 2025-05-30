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
  onSizeChange: (id: string, size: { w: number; h: number }, direction: string) => void
  onDragStart: () => void
  onDragEnd: () => void
  onResizeStart: () => void
  onResizeEnd: () => void
  isDragging: boolean
  isResizing: boolean
}

// Edge detection constants
const EDGE_THRESHOLD = 20 // px from edge to trigger resize highlight

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

  // Edge highlighting states
  const [highlightEdge, setHighlightEdge] = useState({
    top: false,
    right: false,
    bottom: false,
    left: false,
  })

  // Track if we're in resize mode and which direction
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

  // Handle mouse movement for edge detection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!widgetRef.current || isResizingWidget) return

    const rect = widgetRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Detect if mouse is near any edge
    const isNearTop = mouseY < EDGE_THRESHOLD
    const isNearRight = mouseX > rect.width - EDGE_THRESHOLD
    const isNearBottom = mouseY > rect.height - EDGE_THRESHOLD
    const isNearLeft = mouseX < EDGE_THRESHOLD

    setHighlightEdge({
      top: isNearTop,
      right: isNearRight,
      bottom: isNearBottom,
      left: isNearLeft,
    })
  }

  // Reset edge highlights when mouse leaves
  const handleMouseLeave = () => {
    setIsHovered(false)
    setHighlightEdge({ top: false, right: false, bottom: false, left: false })
  }

  // Handle mouse down for either drag or resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()

    const rect = widgetRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Detect if mouse is near any edge
    const isNearTop = mouseY < EDGE_THRESHOLD
    const isNearRight = mouseX > rect.width - EDGE_THRESHOLD
    const isNearBottom = mouseY > rect.height - EDGE_THRESHOLD
    const isNearLeft = mouseX < EDGE_THRESHOLD

    // Determine if this is a resize or drag operation
    if (isNearTop || isNearRight || isNearBottom || isNearLeft) {
      // This is a resize operation
      let direction = ""
      if (isNearTop) direction += "n"
      if (isNearRight) direction += "e"
      if (isNearBottom) direction += "s"
      if (isNearLeft) direction += "w"

      handleResizeStart(e, direction)
    } else {
      // This is a drag operation
      handleDragStart(e)
    }
  }

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
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
    let newX = gridPosition.x
    let newY = gridPosition.y

    // Update size based on direction
    if (resizeDirection.includes("e")) {
      newW = Math.max(1, resizeStart.w + deltaGridX)
    }
    if (resizeDirection.includes("s")) {
      newH = Math.max(1, resizeStart.h + deltaGridY)
    }
    if (resizeDirection.includes("w")) {
      const widthChange = Math.min(resizeStart.w - 1, Math.max(-deltaGridX, 0))
      newW = resizeStart.w - widthChange
      newX = gridPosition.x + widthChange
    }
    if (resizeDirection.includes("n")) {
      const heightChange = Math.min(resizeStart.h - 1, Math.max(-deltaGridY, 0))
      newH = resizeStart.h - heightChange
      newY = gridPosition.y + heightChange
    }

    // Apply min/max constraints
    newW = Math.max(gridSize.minW || 1, Math.min(gridSize.maxW || gridColumns, newW))
    newH = Math.max(gridSize.minH || 1, Math.min(gridSize.maxH || 10, newH))

    // Update position if needed (for n/w resize)
    if (newX !== gridPosition.x || newY !== gridPosition.y) {
      onPositionChange(widget.id, { x: newX, y: newY })
    }

    // Update size if changed
    if (newW !== gridSize.w || newH !== gridSize.h) {
      onSizeChange(widget.id, { w: newW, h: newH }, resizeDirection)
    }
  }

  // Handle resize end
  const handleResizeEnd = () => {
    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleResizeEnd)
    setIsResizingWidget(false)
    onResizeEnd()
  }

  // Set cursor based on edge highlighting
  const getCursor = () => {
    if (highlightEdge.top && highlightEdge.left) return "nw-resize"
    if (highlightEdge.top && highlightEdge.right) return "ne-resize"
    if (highlightEdge.bottom && highlightEdge.left) return "sw-resize"
    if (highlightEdge.bottom && highlightEdge.right) return "se-resize"
    if (highlightEdge.top) return "n-resize"
    if (highlightEdge.right) return "e-resize"
    if (highlightEdge.bottom) return "s-resize"
    if (highlightEdge.left) return "w-resize"
    return "grab"
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
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      style={{ cursor: getCursor() }}
    >
      <Card className="w-full h-full overflow-hidden shadow-md hover:shadow-lg transition-shadow rounded-xl">
        <div className="p-4 h-full relative">
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

        {/* Edge highlight overlays */}
        {highlightEdge.top && <div className="absolute top-0 left-0 right-0 h-[20px] bg-primary/20 z-10" />}
        {highlightEdge.right && <div className="absolute top-0 right-0 bottom-0 w-[20px] bg-primary/20 z-10" />}
        {highlightEdge.bottom && <div className="absolute bottom-0 left-0 right-0 h-[20px] bg-primary/20 z-10" />}
        {highlightEdge.left && <div className="absolute top-0 left-0 bottom-0 w-[20px] bg-primary/20 z-10" />}
      </Card>
    </motion.div>
  )
}
