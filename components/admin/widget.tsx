"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripVertical, Maximize2, Minimize2, ChevronUp, ChevronDown } from "lucide-react"
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
  onResize?: (id: string, size: { width: number; height: number; gridWidth: number; gridHeight: number }) => void
  onMove?: (id: string, position: { x: number; y: number; gridX: number; gridY: number }) => void
  initialSize?: { width?: number; height?: number; gridWidth?: number; gridHeight?: number }
  initialPosition?: { x?: number; y?: number; gridX?: number; gridY?: number }
  gridSize?: number
  collapsed?: boolean
  onCollapse?: (id: string, collapsed: boolean) => void
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
  onResize,
  onMove,
  initialSize,
  initialPosition,
  gridSize = 20, // Default grid size for snapping
  collapsed = false,
  onCollapse,
}: WidgetProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [size, setSize] = useState({
    width: initialSize?.width || 0,
    height: initialSize?.height || 0,
    gridWidth: initialSize?.gridWidth || 1,
    gridHeight: initialSize?.gridHeight || 1,
  })
  const [position, setPosition] = useState({
    x: initialPosition?.x || 0,
    y: initialPosition?.y || 0,
    gridX: initialPosition?.gridX || 0,
    gridY: initialPosition?.gridY || 0,
  })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [expanded, setExpanded] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const widgetRef = useRef<HTMLDivElement>(null)

  // Initialize size from the DOM after first render
  useEffect(() => {
    if (widgetRef.current && !size.width && !size.height) {
      const rect = widgetRef.current.getBoundingClientRect()
      setSize({
        width: rect.width,
        height: rect.height,
        gridWidth: Math.ceil(rect.width / gridSize),
        gridHeight: Math.ceil(rect.height / gridSize),
      })
    }
  }, [size.width, size.height, gridSize])

  // Update collapsed state if prop changes
  useEffect(() => {
    setIsCollapsed(collapsed)
  }, [collapsed])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggingWidgetId) return // Don't start resizing if we're dragging

    setIsResizing(true)
    setResizeDirection(direction)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: size.width, height: size.height })
    setStartPosition({ x: position.x, y: position.y })

    // Add event listeners for resize
    document.addEventListener("mousemove", handleResize)
    document.addEventListener("mouseup", handleResizeEnd)

    // Add a class to the body to indicate resizing (for cursor)
    document.body.classList.add("resizing")
    document.body.classList.add(`resizing-${direction}`)
  }

  const handleResize = (e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    let newWidth = startSize.width
    let newHeight = startSize.height
    let newX = startPosition.x
    let newY = startPosition.y

    // Handle different resize directions
    if (resizeDirection.includes("e")) {
      newWidth = Math.max(gridSize, startSize.width + deltaX)
    }
    if (resizeDirection.includes("w")) {
      const widthChange = Math.min(startSize.width - gridSize, deltaX)
      newWidth = Math.max(gridSize, startSize.width - widthChange)
      newX = startPosition.x + widthChange
    }
    if (resizeDirection.includes("s")) {
      newHeight = Math.max(gridSize, startSize.height + deltaY)
    }
    if (resizeDirection.includes("n")) {
      const heightChange = Math.min(startSize.height - gridSize, deltaY)
      newHeight = Math.max(gridSize, startSize.height - heightChange)
      newY = startPosition.y + heightChange
    }

    // Snap to grid
    const snappedWidth = Math.round(newWidth / gridSize) * gridSize
    const snappedHeight = Math.round(newHeight / gridSize) * gridSize
    const snappedX = Math.round(newX / gridSize) * gridSize
    const snappedY = Math.round(newY / gridSize) * gridSize

    // Calculate grid units
    const gridWidth = Math.ceil(snappedWidth / gridSize)
    const gridHeight = Math.ceil(snappedHeight / gridSize)

    setSize({
      width: snappedWidth,
      height: snappedHeight,
      gridWidth,
      gridHeight,
    })

    setPosition({
      x: snappedX,
      y: snappedY,
      gridX: Math.round(snappedX / gridSize),
      gridY: Math.round(snappedY / gridSize),
    })

    if (onResize) {
      onResize(id, {
        width: snappedWidth,
        height: snappedHeight,
        gridWidth,
        gridHeight,
      })
    }

    if (onMove && (resizeDirection.includes("w") || resizeDirection.includes("n"))) {
      onMove(id, {
        x: snappedX,
        y: snappedY,
        gridX: Math.round(snappedX / gridSize),
        gridY: Math.round(snappedY / gridSize),
      })
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeDirection(null)
    document.removeEventListener("mousemove", handleResize)
    document.removeEventListener("mouseup", handleResizeEnd)
    document.body.classList.remove("resizing")
    document.body.classList.remove(`resizing-${resizeDirection}`)
  }

  const toggleExpand = () => {
    setExpanded(!expanded)

    if (!expanded) {
      // Save current size before expanding
      setStartSize({ width: size.width, height: size.height })

      // Get container width
      const containerWidth = widgetRef.current?.parentElement?.offsetWidth || 1200

      setSize({
        width: containerWidth,
        height: size.height * 1.5,
        gridWidth: Math.ceil(containerWidth / gridSize),
        gridHeight: Math.ceil((size.height * 1.5) / gridSize),
      })
    } else {
      // Restore previous size
      setSize({
        width: startSize.width,
        height: startSize.height,
        gridWidth: Math.ceil(startSize.width / gridSize),
        gridHeight: Math.ceil(startSize.height / gridSize),
      })
    }

    if (onResize) {
      const newWidth = !expanded ? widgetRef.current?.parentElement?.offsetWidth || 1200 : startSize.width

      const newHeight = !expanded ? size.height * 1.5 : startSize.height

      onResize(id, {
        width: newWidth,
        height: newHeight,
        gridWidth: Math.ceil(newWidth / gridSize),
        gridHeight: Math.ceil(newHeight / gridSize),
      })
    }
  }

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)

    if (onCollapse) {
      onCollapse(id, newCollapsedState)
    }
  }

  // Material 3 inspired colors
  const getColors = () => {
    if (highlighted) {
      return {
        bg: "bg-blue-900/10",
        border: "border-blue-700/50",
        header: "bg-blue-900/20",
        headerBorder: "border-blue-700/30",
        text: "text-blue-50",
        shadow: "shadow-lg shadow-blue-900/10",
      }
    }

    return {
      bg: "bg-gray-900/90",
      border: "border-gray-800/80",
      header: "bg-gray-800/90",
      headerBorder: "border-gray-700/80",
      text: "text-gray-100",
      shadow: "shadow-md shadow-black/20",
    }
  }

  const colors = getColors()

  return (
    <motion.div
      ref={widgetRef}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        zIndex: draggingWidgetId === id || isResizing ? 10 : 1,
        boxShadow: draggingWidgetId === id || isResizing ? "0 10px 25px rgba(0, 0, 0, 0.5)" : "none",
        gridColumn: expanded ? "span 3" : `span ${size.gridWidth}`,
        gridRow: `span ${isCollapsed ? 1 : size.gridHeight}`,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`${className}`}
      style={{
        height: isCollapsed ? "auto" : size.height > 0 ? size.height + "px" : "auto",
        width: "100%",
      }}
    >
      <Card
        className={`${colors.bg} ${colors.border} ${colors.shadow} transition-all duration-200 h-full rounded-xl backdrop-blur-sm relative overflow-hidden`}
        draggable={draggable && !isResizing}
        onDragStart={onDragStart && !isResizing ? (e) => onDragStart(e, id) : undefined}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop && id ? (e) => onDrop(e, id) : undefined}
      >
        <CardHeader
          className={`p-3 flex flex-row items-center justify-between space-y-0 ${colors.header} rounded-t-xl ${colors.headerBorder} border-b`}
        >
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 text-gray-400 mr-2 cursor-move" />
            <CardTitle className={`text-sm font-medium ${colors.text}`}>{title}</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
              onClick={toggleCollapse}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700/50"
              onClick={toggleExpand}
              title={expanded ? "Restore" : "Maximize"}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-red-700/50"
                onClick={() => onRemove(id)}
                title="Remove widget"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="p-4 overflow-auto" style={{ height: "calc(100% - 48px)" }}>
            {children}
          </CardContent>
        )}

        {/* Resize handles */}
        {!isCollapsed && (
          <>
            {/* Corner resize handles */}
            <div
              className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "se")}
              style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
                backgroundSize: "3px 3px",
                backgroundPosition: "bottom right",
                backgroundRepeat: "no-repeat",
                padding: "8px",
                transform: "translate(4px, 4px)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "sw")}
            />
            <div
              className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "ne")}
            />
            <div
              className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "nw")}
            />

            {/* Edge resize handles */}
            <div
              className="absolute bottom-0 left-6 right-6 h-2 cursor-s-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "s")}
            />
            <div
              className="absolute top-0 left-6 right-6 h-2 cursor-n-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "n")}
            />
            <div
              className="absolute top-6 bottom-6 right-0 w-2 cursor-e-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "e")}
            />
            <div
              className="absolute top-6 bottom-6 left-0 w-2 cursor-w-resize z-10"
              onMouseDown={(e) => handleResizeStart(e, "w")}
            />
          </>
        )}
      </Card>
    </motion.div>
  )
}
