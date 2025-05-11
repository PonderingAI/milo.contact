"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

export interface WidgetData {
  id: string
  title: string
  width: number
  height: number
  x: number
  y: number
  content: React.ReactNode
  isCollapsed?: boolean
}

interface GridLayoutSystemProps {
  widgets: WidgetData[]
  gridSize?: number
  onLayoutChange?: (widgets: WidgetData[]) => void
  className?: string
}

export default function GridLayoutSystem({
  widgets,
  gridSize = 20,
  onLayoutChange,
  className = "",
}: GridLayoutSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [startWidgetPos, setStartWidgetPos] = useState({ x: 0, y: 0 })
  const [localWidgets, setLocalWidgets] = useState<WidgetData[]>(widgets)

  // Update local widgets when props change
  useEffect(() => {
    setLocalWidgets(widgets)
  }, [widgets])

  // Update container dimensions on resize
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
        setContainerHeight(containerRef.current.offsetHeight)
      }
    }

    updateContainerSize()
    window.addEventListener("resize", updateContainerSize)

    return () => {
      window.removeEventListener("resize", updateContainerSize)
    }
  }, [])

  // Handle widget drag start
  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault()

    const widget = localWidgets.find((w) => w.id === id)
    if (!widget) return

    setActiveWidgetId(id)
    setIsDragging(true)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartWidgetPos({ x: widget.x, y: widget.y })

    // Add event listeners for drag
    document.addEventListener("mousemove", handleDragMove)
    document.addEventListener("mouseup", handleDragEnd)
  }

  // Handle widget drag move
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !activeWidgetId) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    // Calculate new position
    let newX = startWidgetPos.x + deltaX
    let newY = startWidgetPos.y + deltaY

    // Snap to grid
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize

    // Update widget position
    setLocalWidgets((prev) =>
      prev.map((widget) => (widget.id === activeWidgetId ? { ...widget, x: newX, y: newY } : widget)),
    )
  }

  // Handle widget drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    setActiveWidgetId(null)

    // Remove event listeners
    document.removeEventListener("mousemove", handleDragMove)
    document.removeEventListener("mouseup", handleDragEnd)

    // Notify parent of layout change
    if (onLayoutChange) {
      onLayoutChange(localWidgets)
    }
  }

  // Handle widget resize start
  const handleResizeStart = (e: React.MouseEvent, id: string, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    const widget = localWidgets.find((w) => w.id === id)
    if (!widget) return

    setActiveWidgetId(id)
    setIsResizing(true)
    setResizeDirection(direction)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: widget.width, height: widget.height })
    setStartWidgetPos({ x: widget.x, y: widget.y })

    // Add event listeners for resize
    document.addEventListener("mousemove", handleResizeMove)
    document.addEventListener("mouseup", handleResizeEnd)
  }

  // Handle widget resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !activeWidgetId || !resizeDirection) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    const widget = localWidgets.find((w) => w.id === activeWidgetId)
    if (!widget) return

    let newWidth = startSize.width
    let newHeight = startSize.height
    let newX = startWidgetPos.x
    let newY = startWidgetPos.y

    // Handle resize based on direction
    if (resizeDirection.includes("e")) {
      newWidth = Math.max(100, startSize.width + deltaX)
    }
    if (resizeDirection.includes("w")) {
      const widthChange = Math.min(startSize.width - 100, deltaX)
      newWidth = startSize.width - widthChange
      newX = startWidgetPos.x + widthChange
    }
    if (resizeDirection.includes("s")) {
      newHeight = Math.max(100, startSize.height + deltaY)
    }
    if (resizeDirection.includes("n")) {
      const heightChange = Math.min(startSize.height - 100, deltaY)
      newHeight = startSize.height - heightChange
      newY = startWidgetPos.y + heightChange
    }

    // Snap to grid
    newWidth = Math.round(newWidth / gridSize) * gridSize
    newHeight = Math.round(newHeight / gridSize) * gridSize
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize

    // Update widget size and position
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === activeWidgetId ? { ...w, width: newWidth, height: newHeight, x: newX, y: newY } : w)),
    )
  }

  // Handle widget resize end
  const handleResizeEnd = () => {
    setIsResizing(false)
    setActiveWidgetId(null)
    setResizeDirection(null)

    // Remove event listeners
    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleResizeEnd)

    // Notify parent of layout change
    if (onLayoutChange) {
      onLayoutChange(localWidgets)
    }
  }

  // Handle widget collapse toggle
  const handleCollapseToggle = (id: string) => {
    setLocalWidgets((prev) =>
      prev.map((widget) => (widget.id === id ? { ...widget, isCollapsed: !widget.isCollapsed } : widget)),
    )

    // Notify parent of layout change
    if (onLayoutChange) {
      onLayoutChange(
        localWidgets.map((widget) => (widget.id === id ? { ...widget, isCollapsed: !widget.isCollapsed } : widget)),
      )
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "600px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 grid opacity-10"
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage:
            "linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)",
        }}
      />

      {/* Widgets */}
      {localWidgets.map((widget) => (
        <motion.div
          key={widget.id}
          className={`absolute bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 ${
            activeWidgetId === widget.id ? "z-10 shadow-xl" : "z-0"
          }`}
          style={{
            width: widget.width,
            height: widget.isCollapsed ? 40 : widget.height,
            left: widget.x,
            top: widget.y,
            transition: isDragging || isResizing ? "none" : "box-shadow 0.2s ease",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Widget header */}
          <div
            className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center cursor-move"
            onMouseDown={(e) => handleDragStart(e, widget.id)}
          >
            <h3 className="font-medium truncate">{widget.title}</h3>
            <div className="flex items-center space-x-2">
              <button className="text-gray-300 hover:text-white" onClick={() => handleCollapseToggle(widget.id)}>
                {widget.isCollapsed ? "▼" : "▲"}
              </button>
            </div>
          </div>

          {/* Widget content */}
          {!widget.isCollapsed && (
            <div className="p-4 overflow-auto" style={{ height: "calc(100% - 40px)" }}>
              {widget.content}
            </div>
          )}

          {/* Resize handles */}
          {!widget.isCollapsed && (
            <>
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "se")}
              />
              <div
                className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "sw")}
              />
              <div
                className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "ne")}
              />
              <div
                className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "nw")}
              />
              <div
                className="absolute top-0 w-full h-2 cursor-n-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "n")}
              />
              <div
                className="absolute bottom-0 w-full h-2 cursor-s-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "s")}
              />
              <div
                className="absolute left-0 h-full w-2 cursor-w-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "w")}
              />
              <div
                className="absolute right-0 h-full w-2 cursor-e-resize"
                onMouseDown={(e) => handleResizeStart(e, widget.id, "e")}
              />
            </>
          )}
        </motion.div>
      ))}
    </div>
  )
}
