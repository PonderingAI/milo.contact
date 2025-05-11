"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WidgetPosition {
  x: number
  y: number
  width: number
  height: number
}

interface MaterialWidgetContainerProps {
  id: string
  title: string
  initialPosition: WidgetPosition
  onPositionChange: (id: string, position: WidgetPosition) => void
  children: React.ReactNode
  className?: string
  minWidth?: number
  minHeight?: number
  isCollapsed?: boolean
  onCollapseToggle?: (id: string, collapsed: boolean) => void
}

export function MaterialWidgetContainer({
  id,
  title,
  initialPosition,
  onPositionChange,
  children,
  className,
  minWidth = 200,
  minHeight = 100,
  isCollapsed = false,
  onCollapseToggle,
}: MaterialWidgetContainerProps) {
  const [position, setPosition] = useState<WidgetPosition>(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(isCollapsed)

  const widgetRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionStartRef = useRef({ ...initialPosition })

  // Update position when initialPosition changes
  useEffect(() => {
    setPosition(initialPosition)
  }, [initialPosition])

  // Update collapsed state when isCollapsed changes
  useEffect(() => {
    setCollapsed(isCollapsed)
  }, [isCollapsed])

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".resize-handle") || (e.target as HTMLElement).closest(".collapse-button")) {
      return
    }

    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    positionStartRef.current = { ...position }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y

      const newPosition = {
        ...positionStartRef.current,
        x: positionStartRef.current.x + deltaX,
        y: positionStartRef.current.y + deltaY,
      }

      setPosition(newPosition)
    } else if (isResizing) {
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y

      const newPosition = { ...positionStartRef.current }

      // Handle different resize directions
      switch (isResizing) {
        case "e":
          newPosition.width = Math.max(positionStartRef.current.width + deltaX, minWidth)
          break
        case "w":
          const newWidthW = Math.max(positionStartRef.current.width - deltaX, minWidth)
          if (newWidthW !== positionStartRef.current.width - deltaX) {
            // Adjust deltaX if we hit the minimum width
            const adjustedDeltaX = positionStartRef.current.width - newWidthW
            newPosition.x = positionStartRef.current.x + adjustedDeltaX
          } else {
            newPosition.x = positionStartRef.current.x + deltaX
          }
          newPosition.width = newWidthW
          break
        case "s":
          newPosition.height = Math.max(positionStartRef.current.height + deltaY, minHeight)
          break
        case "n":
          const newHeightN = Math.max(positionStartRef.current.height - deltaY, minHeight)
          if (newHeightN !== positionStartRef.current.height - deltaY) {
            // Adjust deltaY if we hit the minimum height
            const adjustedDeltaY = positionStartRef.current.height - newHeightN
            newPosition.y = positionStartRef.current.y + adjustedDeltaY
          } else {
            newPosition.y = positionStartRef.current.y + deltaY
          }
          newPosition.height = newHeightN
          break
        case "se":
          newPosition.width = Math.max(positionStartRef.current.width + deltaX, minWidth)
          newPosition.height = Math.max(positionStartRef.current.height + deltaY, minHeight)
          break
        case "sw":
          const newWidthSW = Math.max(positionStartRef.current.width - deltaX, minWidth)
          if (newWidthSW !== positionStartRef.current.width - deltaX) {
            const adjustedDeltaX = positionStartRef.current.width - newWidthSW
            newPosition.x = positionStartRef.current.x + adjustedDeltaX
          } else {
            newPosition.x = positionStartRef.current.x + deltaX
          }
          newPosition.width = newWidthSW
          newPosition.height = Math.max(positionStartRef.current.height + deltaY, minHeight)
          break
        case "ne":
          newPosition.width = Math.max(positionStartRef.current.width + deltaX, minWidth)
          const newHeightNE = Math.max(positionStartRef.current.height - deltaY, minHeight)
          if (newHeightNE !== positionStartRef.current.height - deltaY) {
            const adjustedDeltaY = positionStartRef.current.height - newHeightNE
            newPosition.y = positionStartRef.current.y + adjustedDeltaY
          } else {
            newPosition.y = positionStartRef.current.y + deltaY
          }
          newPosition.height = newHeightNE
          break
        case "nw":
          const newWidthNW = Math.max(positionStartRef.current.width - deltaX, minWidth)
          if (newWidthNW !== positionStartRef.current.width - deltaX) {
            const adjustedDeltaX = positionStartRef.current.width - newWidthNW
            newPosition.x = positionStartRef.current.x + adjustedDeltaX
          } else {
            newPosition.x = positionStartRef.current.x + deltaX
          }
          newPosition.width = newWidthNW

          const newHeightNW = Math.max(positionStartRef.current.height - deltaY, minHeight)
          if (newHeightNW !== positionStartRef.current.height - deltaY) {
            const adjustedDeltaY = positionStartRef.current.height - newHeightNW
            newPosition.y = positionStartRef.current.y + adjustedDeltaY
          } else {
            newPosition.y = positionStartRef.current.y + deltaY
          }
          newPosition.height = newHeightNW
          break
      }

      setPosition(newPosition)
    }
  }

  // Handle mouse up for dragging and resizing
  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      onPositionChange(id, position)
      setIsDragging(false)
      setIsResizing(null)
    }

    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // Handle resize start
  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(direction)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    positionStartRef.current = { ...position }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Toggle collapse
  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    if (onCollapseToggle) {
      onCollapseToggle(id, newCollapsed)
    }
  }

  // Calculate content height based on collapsed state
  const contentHeight = collapsed ? 0 : position.height - 48 // 48px for header

  return (
    <div
      ref={widgetRef}
      className={cn(
        "absolute rounded-lg shadow-md overflow-hidden",
        isDragging || isResizing ? "z-50" : "z-10",
        className,
      )}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: collapsed ? 48 : position.height, // Collapse to header height
        transition: isDragging || isResizing ? "none" : "all 0.2s ease",
      }}
    >
      <Card className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-lg">
        {/* Widget Header - Material 3 style */}
        <div
          className="flex items-center justify-between px-4 h-12 bg-primary/10 dark:bg-primary/20 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 text-gray-500 mr-2" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <button
            className="collapse-button p-1 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Widget Content */}
        <div
          className="flex-1 overflow-auto p-4 transition-all"
          style={{
            height: contentHeight,
            opacity: collapsed ? 0 : 1,
            visibility: collapsed ? "hidden" : "visible",
          }}
        >
          {children}
        </div>

        {/* Resize Handles */}
        {!collapsed && (
          <>
            <div
              className="resize-handle absolute top-1/2 right-0 w-2 h-8 -mt-4 cursor-e-resize"
              onMouseDown={handleResizeStart("e")}
            />
            <div
              className="resize-handle absolute top-1/2 left-0 w-2 h-8 -mt-4 cursor-w-resize"
              onMouseDown={handleResizeStart("w")}
            />
            <div
              className="resize-handle absolute bottom-0 left-1/2 h-2 w-8 -ml-4 cursor-s-resize"
              onMouseDown={handleResizeStart("s")}
            />
            <div
              className="resize-handle absolute top-0 left-1/2 h-2 w-8 -ml-4 cursor-n-resize"
              onMouseDown={handleResizeStart("n")}
            />
            <div
              className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={handleResizeStart("se")}
            />
            <div
              className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
              onMouseDown={handleResizeStart("sw")}
            />
            <div
              className="resize-handle absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
              onMouseDown={handleResizeStart("ne")}
            />
            <div
              className="resize-handle absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
              onMouseDown={handleResizeStart("nw")}
            />
          </>
        )}
      </Card>
    </div>
  )
}
