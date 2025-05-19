"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripVertical, ArrowRightIcon as ArrowsMaximize, ArrowLeftIcon as ArrowsMinimize } from "lucide-react"
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
  onResize?: (id: string, size: { width: number; height: number }) => void
  initialSize?: { width?: number; height?: number; cols?: number }
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
  initialSize,
}: WidgetProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [size, setSize] = useState({
    width: initialSize?.width || 0,
    height: initialSize?.height || 0,
    cols: initialSize?.cols || 1,
  })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [expanded, setExpanded] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)

  // Initialize size from the DOM after first render
  useEffect(() => {
    if (widgetRef.current && !size.width && !size.height) {
      setSize({
        width: widgetRef.current.offsetWidth,
        height: widgetRef.current.offsetHeight,
        cols: size.cols,
      })
    }
  }, [size.width, size.height, size.cols])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggingWidgetId) return // Don't start resizing if we're dragging

    setIsResizing(true)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: size.width, height: size.height })

    // Add event listeners for resize
    document.addEventListener("mousemove", handleResize)
    document.addEventListener("mouseup", handleResizeEnd)

    // Add a class to the body to indicate resizing (for cursor)
    document.body.classList.add("resizing")
  }

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    // Calculate new size
    const newWidth = Math.max(200, startSize.width + deltaX)
    const newHeight = Math.max(100, startSize.height + deltaY)

    // Calculate columns based on width
    // Assuming a 3-column layout with each column being ~400px
    const containerWidth = widgetRef.current?.parentElement?.offsetWidth || 1200
    const colWidth = containerWidth / 3
    const newCols = Math.min(3, Math.max(1, Math.round(newWidth / colWidth)))

    setSize({
      width: newWidth,
      height: newHeight,
      cols: newCols,
    })

    if (onResize) {
      onResize(id, { width: newWidth, height: newHeight })
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    document.removeEventListener("mousemove", handleResize)
    document.removeEventListener("mouseup", handleResizeEnd)
    document.body.classList.remove("resizing")
  }

  const toggleExpand = () => {
    setExpanded(!expanded)

    if (!expanded) {
      // Save current size before expanding
      setStartSize({ width: size.width, height: size.height })
      setSize({
        width: widgetRef.current?.parentElement?.offsetWidth || 1200,
        height: size.height * 1.5,
        cols: 3,
      })
    } else {
      // Restore previous size
      setSize({
        width: startSize.width,
        height: startSize.height,
        cols: size.cols > 1 ? size.cols : 1,
      })
    }

    if (onResize) {
      onResize(id, {
        width: !expanded ? widgetRef.current?.parentElement?.offsetWidth || 1200 : startSize.width,
        height: !expanded ? size.height * 1.5 : startSize.height,
      })
    }
  }

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
        gridColumn: expanded || fullWidth || size.cols > 1 ? "span " + (expanded ? 3 : size.cols) : "span 1",
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`${className}`}
      style={{
        height: size.height > 0 ? size.height + "px" : "auto",
        width: "100%",
      }}
    >
      <Card
        className={`bg-gray-800 border-gray-700 transition-all duration-200 h-full ${
          draggingWidgetId === id ? "opacity-70 scale-105" : ""
        } ${highlighted ? "border-blue-700 shadow-lg shadow-blue-900/20" : ""} ${
          isResizing ? "border-blue-500" : ""
        } relative`}
        draggable={draggable && !isResizing}
        onDragStart={onDragStart && !isResizing ? (e) => onDragStart(e, id) : undefined}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop && id ? (e) => onDrop(e, id) : undefined}
      >
        <CardHeader
          className={`p-4 flex flex-row items-center justify-between space-y-0 bg-gray-800 rounded-t-lg border-b border-gray-700 ${
            highlighted ? "bg-gradient-to-r from-blue-900/40 to-purple-900/40" : ""
          }`}
        >
          <div className="flex items-center">
            <GripVertical className="h-4 w-4 text-gray-500 mr-2 cursor-move" />
            <CardTitle className={`text-sm font-medium ${highlighted ? "text-blue-200" : "text-gray-200"}`}>
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleExpand}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ArrowsMinimize className="h-4 w-4" /> : <ArrowsMaximize className="h-4 w-4" />}
            </Button>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onRemove(id)}
                title="Remove widget"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-auto" style={{ height: "calc(100% - 56px)" }}>
          {children}
        </CardContent>

        {/* Resize handles */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10"
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
          className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize z-10"
          onMouseDown={(e) => handleResizeStart(e, "s")}
        />

        <div
          className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize z-10"
          onMouseDown={(e) => handleResizeStart(e, "e")}
        />
      </Card>
    </motion.div>
  )
}
