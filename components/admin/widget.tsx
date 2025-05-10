"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface WidgetProps {
  id: string
  title: string
  children: React.ReactNode
  className?: string
  onResize?: (id: string, width: number, height: number) => void
  onMove?: (id: string, x: number, y: number) => void
  initialWidth?: number
  initialHeight?: number
  initialX?: number
  initialY?: number
  gridSize?: number
  isCollapsed?: boolean
  onToggleCollapse?: (id: string, isCollapsed: boolean) => void
}

export default function Widget({
  id,
  title,
  children,
  className,
  onResize,
  onMove,
  initialWidth = 400,
  initialHeight = 300,
  initialX = 0,
  initialY = 0,
  gridSize = 20,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}: WidgetProps) {
  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [x, setX] = useState(initialX)
  const [y, setY] = useState(initialY)
  const [isResizing, setIsResizing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(propIsCollapsed || false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0, clientX: 0, clientY: 0 })

  // Handle controlled collapse state
  useEffect(() => {
    if (propIsCollapsed !== undefined && propIsCollapsed !== isCollapsed) {
      setIsCollapsed(propIsCollapsed)
    }
  }, [propIsCollapsed])

  // Handle window resize for responsive scaling
  useEffect(() => {
    const handleWindowResize = () => {
      if (widgetRef.current) {
        // Calculate new dimensions based on viewport width
        const viewportWidth = window.innerWidth
        const scaleFactor = viewportWidth / 1920 // Base scale on 1920px design

        // Apply minimum scale to prevent widgets from becoming too small
        const minScale = 0.5
        const effectiveScale = Math.max(scaleFactor, minScale)

        // Update widget dimensions while maintaining aspect ratio
        const newWidth = Math.round(initialWidth * effectiveScale)
        const newHeight = Math.round(initialHeight * effectiveScale)

        setWidth(newWidth)
        setHeight(newHeight)

        // Notify parent of resize
        if (onResize) {
          onResize(id, newWidth, newHeight)
        }
      }
    }

    // Initial resize
    handleWindowResize()

    // Add event listener
    window.addEventListener("resize", handleWindowResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [id, initialWidth, initialHeight, onResize])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)

    startPosRef.current = {
      x,
      y,
      width,
      height,
      clientX: e.clientX,
      clientY: e.clientY,
    }

    document.addEventListener("mousemove", handleResizeMove)
    document.addEventListener("mouseup", handleResizeEnd)
  }

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - startPosRef.current.clientX
    const deltaY = e.clientY - startPosRef.current.clientY

    let newWidth = startPosRef.current.width
    let newHeight = startPosRef.current.height
    let newX = startPosRef.current.x
    let newY = startPosRef.current.y

    // Handle different resize directions
    if (resizeDirection?.includes("e")) {
      newWidth = Math.max(200, startPosRef.current.width + deltaX)
    }
    if (resizeDirection?.includes("w")) {
      const widthChange = Math.min(deltaX, startPosRef.current.width - 200)
      newWidth = startPosRef.current.width - widthChange
      newX = startPosRef.current.x + widthChange
    }
    if (resizeDirection?.includes("s")) {
      newHeight = Math.max(100, startPosRef.current.height + deltaY)
    }
    if (resizeDirection?.includes("n")) {
      const heightChange = Math.min(deltaY, startPosRef.current.height - 100)
      newHeight = startPosRef.current.height - heightChange
      newY = startPosRef.current.y + heightChange
    }

    // Snap to grid
    newWidth = Math.round(newWidth / gridSize) * gridSize
    newHeight = Math.round(newHeight / gridSize) * gridSize
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize

    setWidth(newWidth)
    setHeight(newHeight)
    setX(newX)
    setY(newY)

    if (onResize) {
      onResize(id, newWidth, newHeight)
    }
    if (onMove && (newX !== x || newY !== y)) {
      onMove(id, newX, newY)
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeDirection(null)
    document.removeEventListener("mousemove", handleResizeMove)
    document.removeEventListener("mouseup", handleResizeEnd)
  }

  const handleMoveStart = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.classList.contains("resize-handle") || e.target.closest(".widget-header-actions"))
    ) {
      return
    }

    e.preventDefault()
    setIsMoving(true)

    startPosRef.current = {
      x,
      y,
      width,
      height,
      clientX: e.clientX,
      clientY: e.clientY,
    }

    document.addEventListener("mousemove", handleMoveMove)
    document.addEventListener("mouseup", handleMoveEnd)
  }

  const handleMoveMove = (e: MouseEvent) => {
    if (!isMoving) return

    const deltaX = e.clientX - startPosRef.current.clientX
    const deltaY = e.clientY - startPosRef.current.clientY

    const newX = startPosRef.current.x + deltaX
    const newY = startPosRef.current.y + deltaY

    // Snap to grid
    const snappedX = Math.round(newX / gridSize) * gridSize
    const snappedY = Math.round(newY / gridSize) * gridSize

    setX(snappedX)
    setY(snappedY)

    if (onMove) {
      onMove(id, snappedX, snappedY)
    }
  }

  const handleMoveEnd = () => {
    setIsMoving(false)
    document.removeEventListener("mousemove", handleMoveMove)
    document.removeEventListener("mouseup", handleMoveEnd)
  }

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    if (onToggleCollapse) {
      onToggleCollapse(id, newCollapsedState)
    }
  }

  return (
    <Card
      ref={widgetRef}
      className={cn(
        "absolute rounded-lg overflow-hidden shadow-lg transition-shadow hover:shadow-xl",
        isMoving && "cursor-grabbing shadow-2xl z-50",
        !isMoving && "cursor-grab",
        className,
      )}
      style={{
        width: `${width}px`,
        height: isCollapsed ? "auto" : `${height}px`,
        transform: `translate(${x}px, ${y}px)`,
        backgroundColor: "white",
        border: "1px solid rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Widget Header */}
      <div
        className="widget-header bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 flex justify-between items-center"
        onMouseDown={handleMoveStart}
      >
        <h3 className="font-medium text-sm truncate">{title}</h3>
        <div className="widget-header-actions flex space-x-1">
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
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
      {!isCollapsed && (
        <div className="p-4 overflow-auto" style={{ height: "calc(100% - 48px)" }}>
          {children}
        </div>
      )}

      {/* Resize Handles */}
      {!isCollapsed && (
        <>
          <div
            className="resize-handle resize-e absolute top-0 right-0 w-2 h-full cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, "e")}
          />
          <div
            className="resize-handle resize-w absolute top-0 left-0 w-2 h-full cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            className="resize-handle resize-s absolute bottom-0 left-0 w-full h-2 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            className="resize-handle resize-n absolute top-0 left-0 w-full h-2 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            className="resize-handle resize-se absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          <div
            className="resize-handle resize-sw absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="resize-handle resize-ne absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="resize-handle resize-nw absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
        </>
      )}
    </Card>
  )
}
