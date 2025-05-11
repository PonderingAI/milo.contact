"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { snapToGrid, gridUnitsToPixels, pixelsToGridUnits } from "@/lib/grid-utils"

interface WidgetContainerProps {
  id: string
  title: string
  initialX: number
  initialY: number
  initialWidth: number
  initialHeight: number
  minWidth?: number
  minHeight?: number
  onResize: (id: string, x: number, y: number, width: number, height: number) => void
  onMove: (id: string, x: number, y: number) => void
  children: React.ReactNode
  className?: string
  isEditing: boolean
}

export default function WidgetContainer({
  id,
  title,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  minWidth = 4,
  minHeight = 3,
  onResize,
  onMove,
  children,
  className = "",
  isEditing,
}: WidgetContainerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)

  // Convert grid units to pixels for initial values
  const [position, setPosition] = useState({
    x: gridUnitsToPixels(initialX),
    y: gridUnitsToPixels(initialY),
  })

  const [dimensions, setDimensions] = useState({
    width: gridUnitsToPixels(initialWidth),
    height: gridUnitsToPixels(initialHeight),
  })

  const widgetRef = useRef<HTMLDivElement>(null)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Update position and dimensions based on grid units
      setPosition({
        x: gridUnitsToPixels(initialX),
        y: gridUnitsToPixels(initialY),
      })

      setDimensions({
        width: gridUnitsToPixels(initialWidth),
        height: gridUnitsToPixels(initialHeight),
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [initialX, initialY, initialWidth, initialHeight])

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false)

    // Convert pixel position to grid units
    const gridX = pixelsToGridUnits(position.x)
    const gridY = pixelsToGridUnits(position.y)

    // Notify parent component
    onMove(id, gridX, gridY)
  }

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeDirection(null)

    // Convert pixel dimensions to grid units
    const gridX = pixelsToGridUnits(position.x)
    const gridY = pixelsToGridUnits(position.y)
    const gridWidth = pixelsToGridUnits(dimensions.width)
    const gridHeight = pixelsToGridUnits(dimensions.height)

    // Notify parent component
    onResize(id, gridX, gridY, gridWidth, gridHeight)
  }

  // Handle resize
  const handleResize = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    if (!isEditing) return

    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height
    const startPositionX = position.x
    const startPositionY = position.y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing) return

      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight
      let newX = startPositionX
      let newY = startPositionY

      // Handle different resize directions
      switch (direction) {
        case "e": // Right
          newWidth = Math.max(gridUnitsToPixels(minWidth), startWidth + deltaX)
          break
        case "w": // Left
          newWidth = Math.max(gridUnitsToPixels(minWidth), startWidth - deltaX)
          newX = startPositionX + (startWidth - newWidth)
          break
        case "s": // Bottom
          newHeight = Math.max(gridUnitsToPixels(minHeight), startHeight + deltaY)
          break
        case "n": // Top
          newHeight = Math.max(gridUnitsToPixels(minHeight), startHeight - deltaY)
          newY = startPositionY + (startHeight - newHeight)
          break
        case "se": // Bottom-right
          newWidth = Math.max(gridUnitsToPixels(minWidth), startWidth + deltaX)
          newHeight = Math.max(gridUnitsToPixels(minHeight), startHeight + deltaY)
          break
        case "sw": // Bottom-left
          newWidth = Math.max(gridUnitsToPixels(minWidth), startWidth - deltaX)
          newHeight = Math.max(gridUnitsToPixels(minHeight), startHeight + deltaY)
          newX = startPositionX + (startWidth - newWidth)
          break
        case "ne": // Top-right
          newWidth = Math.max(gridUnitsToPixels(minWidth), startWidth + deltaX)
          newHeight = Math.max(gridUnitsToPixels(minHeight), startHeight - deltaY)
          newY = startPositionY + (startHeight - newHeight)
          break
        case "nw": // Top-left
          newWidth = Math.max(gridUnitsToPixels(minWidth), startWidth - deltaX)
          newHeight = Math.max(gridUnitsToPixels(minHeight), startHeight - deltaY)
          newX = startPositionX + (startWidth - newWidth)
          newY = startPositionY + (startHeight - newHeight)
          break
      }

      // Snap to grid
      newWidth = snapToGrid(newWidth)
      newHeight = snapToGrid(newHeight)
      newX = snapToGrid(newX)
      newY = snapToGrid(newY)

      setDimensions({ width: newWidth, height: newHeight })
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      handleResizeEnd()
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <motion.div
      ref={widgetRef}
      className={`absolute ${className}`}
      style={{
        width: dimensions.width,
        height: isExpanded ? dimensions.height : 48,
        left: position.x,
        top: position.y,
        zIndex: isDragging || isResizing ? 10 : 1,
        touchAction: "none",
      }}
      drag={isEditing}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onDrag={(_, info) => {
        setPosition({
          x: snapToGrid(position.x + info.delta.x),
          y: snapToGrid(position.y + info.delta.y),
        })
      }}
    >
      <div className="flex flex-col h-full rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
        {/* Widget Header - Material 3 style */}
        <div
          className="flex items-center justify-between px-4 h-12 bg-primary/10 dark:bg-primary/20 cursor-move"
          onDoubleClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="font-medium text-sm text-primary-foreground">{title}</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-full hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            >
              {isExpanded ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Widget Content */}
        {isExpanded && <div className="flex-1 overflow-auto p-4">{children}</div>}

        {/* Resize Handles - Only visible in edit mode */}
        {isEditing && isExpanded && (
          <>
            {/* Corner resize handles */}
            <div
              className="absolute w-3 h-3 bottom-0 right-0 cursor-se-resize bg-primary/50 rounded-full"
              onMouseDown={(e) => handleResize(e, "se")}
            />
            <div
              className="absolute w-3 h-3 bottom-0 left-0 cursor-sw-resize bg-primary/50 rounded-full"
              onMouseDown={(e) => handleResize(e, "sw")}
            />
            <div
              className="absolute w-3 h-3 top-0 right-0 cursor-ne-resize bg-primary/50 rounded-full"
              onMouseDown={(e) => handleResize(e, "ne")}
            />
            <div
              className="absolute w-3 h-3 top-0 left-0 cursor-nw-resize bg-primary/50 rounded-full"
              onMouseDown={(e) => handleResize(e, "nw")}
            />

            {/* Edge resize handles */}
            <div
              className="absolute w-full h-3 top-0 cursor-n-resize flex justify-center"
              onMouseDown={(e) => handleResize(e, "n")}
            >
              <div className="w-3 h-3 bg-primary/50 rounded-full" />
            </div>
            <div
              className="absolute w-full h-3 bottom-0 cursor-s-resize flex justify-center"
              onMouseDown={(e) => handleResize(e, "s")}
            >
              <div className="w-3 h-3 bg-primary/50 rounded-full" />
            </div>
            <div
              className="absolute w-3 h-full left-0 cursor-w-resize flex items-center"
              onMouseDown={(e) => handleResize(e, "w")}
            >
              <div className="w-3 h-3 bg-primary/50 rounded-full" />
            </div>
            <div
              className="absolute w-3 h-full right-0 cursor-e-resize flex items-center"
              onMouseDown={(e) => handleResize(e, "e")}
            >
              <div className="w-3 h-3 bg-primary/50 rounded-full" />
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
