"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

// Define grid constants
const GRID_SIZE = 20 // Size of grid cells in pixels

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

export const MaterialWidgetContainer: React.FC<MaterialWidgetContainerProps> = ({
  id,
  title,
  initialPosition,
  onPositionChange,
  children,
  className,
  minWidth = 2,
  minHeight = 2,
  isCollapsed = false,
  onCollapseToggle,
}) => {
  const [position, setPosition] = useState<WidgetPosition>(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(isCollapsed)

  const widgetRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionStartRef = useRef({ ...initialPosition })

  // Snap position to grid
  const snapToGrid = useCallback(
    (pos: WidgetPosition): WidgetPosition => {
      return {
        x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
        width: Math.max(Math.round(pos.width / GRID_SIZE) * GRID_SIZE, minWidth * GRID_SIZE),
        height: Math.max(Math.round(pos.height / GRID_SIZE) * GRID_SIZE, minHeight * GRID_SIZE),
      }
    },
    [minWidth, minHeight],
  )

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
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x
        const deltaY = e.clientY - dragStartRef.current.y

        const newPosition = {
          ...positionStartRef.current,
          x: positionStartRef.current.x + deltaX,
          y: positionStartRef.current.y + deltaY,
        }

        setPosition(snapToGrid(newPosition))
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartRef.current.x
        const deltaY = e.clientY - dragStartRef.current.y

        const newPosition = { ...positionStartRef.current }

        // Handle different resize directions
        switch (isResizing) {
          case "e":
            newPosition.width = Math.max(positionStartRef.current.width + deltaX, minWidth * GRID_SIZE)
            break
          case "w":
            const newWidthW = Math.max(positionStartRef.current.width - deltaX, minWidth * GRID_SIZE)
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
            newPosition.height = Math.max(positionStartRef.current.height + deltaY, minHeight * GRID_SIZE)
            break
          case "n":
            const newHeightN = Math.max(positionStartRef.current.height - deltaY, minHeight * GRID_SIZE)
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
            newPosition.width = Math.max(positionStartRef.current.width + deltaX, minWidth * GRID_SIZE)
            newPosition.height = Math.max(positionStartRef.current.height + deltaY, minHeight * GRID_SIZE)
            break
          case "sw":
            const newWidthSW = Math.max(positionStartRef.current.width - deltaX, minWidth * GRID_SIZE)
            if (newWidthSW !== positionStartRef.current.width - deltaX) {
              const adjustedDeltaX = positionStartRef.current.width - newWidthSW
              newPosition.x = positionStartRef.current.x + adjustedDeltaX
            } else {
              newPosition.x = positionStartRef.current.x + deltaX
            }
            newPosition.width = newWidthSW
            newPosition.height = Math.max(positionStartRef.current.height + deltaY, minHeight * GRID_SIZE)
            break
          case "ne":
            newPosition.width = Math.max(positionStartRef.current.width + deltaX, minWidth * GRID_SIZE)
            const newHeightNE = Math.max(positionStartRef.current.height - deltaY, minHeight * GRID_SIZE)
            if (newHeightNE !== positionStartRef.current.height - deltaY) {
              const adjustedDeltaY = positionStartRef.current.height - newHeightNE
              newPosition.y = positionStartRef.current.y + adjustedDeltaY
            } else {
              newPosition.y = positionStartRef.current.y + deltaY
            }
            newPosition.height = newHeightNE
            break
          case "nw":
            const newWidthNW = Math.max(positionStartRef.current.width - deltaX, minWidth * GRID_SIZE)
            if (newWidthNW !== positionStartRef.current.width - deltaX) {
              const adjustedDeltaX = positionStartRef.current.width - newWidthNW
              newPosition.x = positionStartRef.current.x + adjustedDeltaX
            } else {
              newPosition.x = positionStartRef.current.x + deltaX
            }
            newPosition.width = newWidthNW

            const newHeightNW = Math.max(positionStartRef.current.height - deltaY, minHeight * GRID_SIZE)
            if (newHeightNW !== positionStartRef.current.height - deltaY) {
              const adjustedDeltaY = positionStartRef.current.height - newHeightNW
              newPosition.y = positionStartRef.current.y + adjustedDeltaY
            } else {
              newPosition.y = positionStartRef.current.y + deltaY
            }
            newPosition.height = newHeightNW
            break
        }

        setPosition(snapToGrid(newPosition))
      }
    },
    [isDragging, isResizing, snapToGrid, position, minWidth, minHeight],
  )

  // Handle mouse up for dragging and resizing
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      onPositionChange(id, position)
      setIsDragging(false)
      setIsResizing(null)
    }

    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }, [id, isDragging, isResizing, onPositionChange, position])

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

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
    <motion.div
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
      animate={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: collapsed ? 48 : position.height,
      }}
      initial={false}
    >
      <Card className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-lg">
        {/* Widget Header - Material 3 style */}
        <div
          className="flex items-center justify-between px-4 h-12 bg-primary/10 dark:bg-primary/20 cursor-move"
          onMouseDown={handleMouseDown}
        >
          <h3 className="font-medium text-primary dark:text-primary-foreground truncate">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              className="collapse-button p-1 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
              onClick={toggleCollapse}
              aria-label={collapsed ? "Expand" : "Collapse"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
              >
                {collapsed ? <polyline points="6 9 12 15 18 9" /> : <polyline points="18 15 12 9 6 15" />}
              </svg>
            </button>
          </div>
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
              className="resize-handle resize-e absolute top-1/2 right-0 w-2 h-8 -mt-4 cursor-e-resize"
              onMouseDown={handleResizeStart("e")}
            />
            <div
              className="resize-handle resize-w absolute top-1/2 left-0 w-2 h-8 -mt-4 cursor-w-resize"
              onMouseDown={handleResizeStart("w")}
            />
            <div
              className="resize-handle resize-s absolute bottom-0 left-1/2 h-2 w-8 -ml-4 cursor-s-resize"
              onMouseDown={handleResizeStart("s")}
            />
            <div
              className="resize-handle resize-n absolute top-0 left-1/2 h-2 w-8 -ml-4 cursor-n-resize"
              onMouseDown={handleResizeStart("n")}
            />
            <div
              className="resize-handle resize-se absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={handleResizeStart("se")}
            />
            <div
              className="resize-handle resize-sw absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
              onMouseDown={handleResizeStart("sw")}
            />
            <div
              className="resize-handle resize-ne absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
              onMouseDown={handleResizeStart("ne")}
            />
            <div
              className="resize-handle resize-nw absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
              onMouseDown={handleResizeStart("nw")}
            />
          </>
        )}
      </Card>
    </motion.div>
  )
}
