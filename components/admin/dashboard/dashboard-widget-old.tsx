"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripVertical, Settings } from "lucide-react"
import type { Widget } from "./widget-container"
import { cn } from "@/lib/utils"

interface DashboardWidgetProps {
  widget: Widget
  children: React.ReactNode
  onRemove: (id: string) => void
  className?: string
  showRemoveButton?: boolean
  showSettings?: boolean
  onSettings?: (id: string) => void
}

export function DashboardWidget({
  widget,
  children,
  onRemove,
  className,
  showRemoveButton = true,
  showSettings = false,
  onSettings,
}: DashboardWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove(widget.id)
  }

  const handleSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSettings?.(widget.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn("relative group h-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Widget Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            {widget.title}
          </CardTitle>
          
          {/* Widget Controls */}
          <div className={cn(
            "flex items-center gap-1 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            {showSettings && onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettings}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Widget settings"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
            
            {showRemoveButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                title="Remove widget"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="flex-1 p-4 overflow-hidden">
          <div className="h-full w-full">
            {children}
          </div>
        </CardContent>
      </Card>
      
      {/* Resize indicator for react-grid-layout */}
      <div className="absolute bottom-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
        <svg
          className="w-full h-full text-gray-400"
          fill="currentColor"
          viewBox="0 0 6 6"
        >
          <path d="m5 5h-4v-4h4v4zm-3-3h2v2h-2v-2z" fillRule="evenodd" />
        </svg>
      </div>
    </motion.div>
  )
}
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
