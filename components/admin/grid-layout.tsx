"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { useGrid, type GridItem } from "./grid-context"
import { MaterialWidget } from "./material-widget"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GridLayoutProps {
  className?: string
  children?: React.ReactNode
}

export function GridLayout({ className, children }: GridLayoutProps) {
  const { items, cols, rowHeight, containerWidth, setContainerWidth } = useGrid()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false)

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [setContainerWidth])

  // Calculate cell width based on container width and columns
  const cellWidth = containerWidth / cols

  // Generate grid background
  const gridBackground = `
    linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)
  `

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full min-h-[400px]", className)}
      style={{
        background: showGrid ? gridBackground : undefined,
        backgroundSize: showGrid ? `${cellWidth}px ${rowHeight}px` : undefined,
      }}
    >
      {children}

      <div className="absolute bottom-2 right-2 z-50">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-1 rounded-md text-xs"
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>
      </div>
    </div>
  )
}

interface GridItemWrapperProps {
  item: GridItem
  renderContent: (item: GridItem) => React.ReactNode
  onRemove?: (id: string) => void
}

export function GridItemWrapper({ item, renderContent, onRemove }: GridItemWrapperProps) {
  const { moveItem, resizeItem, cols, rowHeight, containerWidth } = useGrid()
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Calculate position and size based on grid
  const cellWidth = containerWidth / cols
  const x = item.x * cellWidth
  const y = item.y * rowHeight
  const width = item.w * cellWidth
  const height = item.h * rowHeight

  // Handle resize
  const handleResize = (id: string, size: { width: number; height: number }) => {
    setIsResizing(true)

    // Convert pixel dimensions to grid units
    const w = Math.max(1, Math.round(size.width / cellWidth))
    const h = Math.max(1, Math.round(size.height / rowHeight))

    resizeItem(id, w, h)

    // Reset resizing state after a short delay
    setTimeout(() => setIsResizing(false), 100)
  }

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    // Calculate offset from mouse position to item top-left corner
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top

      setDragOffset({ x: offsetX, y: offsetY })

      // Add event listeners for drag
      document.addEventListener("mousemove", handleDrag)
      document.addEventListener("mouseup", handleDragEnd)
    }
  }

  // Handle drag
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging || !itemRef.current) return

    // Calculate new position in grid units
    const rect = itemRef.current.parentElement?.getBoundingClientRect()
    if (!rect) return

    const x = Math.max(0, Math.round((e.clientX - rect.left - dragOffset.x) / cellWidth))
    const y = Math.max(0, Math.round((e.clientY - rect.top - dragOffset.y) / rowHeight))

    moveItem(item.id, x, y)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    document.removeEventListener("mousemove", handleDrag)
    document.removeEventListener("mouseup", handleDragEnd)
  }

  // Toggle expanded state
  const toggleExpand = () => {
    setExpanded(!expanded)

    if (!expanded) {
      // Expand to full width (3 columns)
      resizeItem(item.id, cols, item.h * 2)
    } else {
      // Restore original size
      resizeItem(item.id, Math.min(cols, Math.max(1, Math.floor(item.w / 2))), Math.max(1, Math.floor(item.h / 2)))
    }
  }

  return (
    <motion.div
      ref={itemRef}
      className="absolute"
      style={{
        width,
        height,
        transform: `translate(${x}px, ${y}px)`,
      }}
      animate={{
        width,
        height,
        x,
        y,
        zIndex: isDragging || isResizing ? 10 : 1,
      }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
      }}
    >
      <MaterialWidget
        id={item.id}
        title={item.type}
        onRemove={onRemove}
        onResize={handleResize}
        expanded={expanded}
        onToggleExpand={toggleExpand}
        isDragging={isDragging}
        isResizing={isResizing}
        className="w-full h-full"
        accentColor={
          item.type.includes("security")
            ? "bg-red-500"
            : item.type.includes("update")
              ? "bg-blue-500"
              : item.type.includes("dependency")
                ? "bg-green-500"
                : "bg-purple-500"
        }
      >
        {renderContent(item)}
      </MaterialWidget>
    </motion.div>
  )
}
