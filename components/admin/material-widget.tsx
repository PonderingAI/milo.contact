"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  X,
  GripVertical,
  ArrowRightIcon as ArrowsMaximize,
  ArrowLeftIcon as ArrowsMinimize,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  CornerRightDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ResizeHandleProps {
  position: "n" | "e" | "s" | "w" | "ne" | "se" | "sw" | "nw"
  onResizeStart: (e: React.MouseEvent, position: string) => void
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ position, onResizeStart }) => {
  const getPositionStyles = () => {
    switch (position) {
      case "n":
        return "top-0 left-0 right-0 h-1 cursor-n-resize"
      case "e":
        return "top-0 right-0 bottom-0 w-1 cursor-e-resize"
      case "s":
        return "bottom-0 left-0 right-0 h-1 cursor-s-resize"
      case "w":
        return "top-0 left-0 bottom-0 w-1 cursor-w-resize"
      case "ne":
        return "top-0 right-0 w-3 h-3 cursor-ne-resize"
      case "se":
        return "bottom-0 right-0 w-3 h-3 cursor-se-resize"
      case "sw":
        return "bottom-0 left-0 w-3 h-3 cursor-sw-resize"
      case "nw":
        return "top-0 left-0 w-3 h-3 cursor-nw-resize"
      default:
        return ""
    }
  }

  const getIcon = () => {
    switch (position) {
      case "ne":
        return <ChevronUp className="h-3 w-3 rotate-45" />
      case "se":
        return <CornerRightDown className="h-3 w-3" />
      case "sw":
        return <ChevronDown className="h-3 w-3 rotate-45" />
      case "nw":
        return <ChevronLeft className="h-3 w-3 rotate-45" />
      default:
        return null
    }
  }

  return (
    <div className={`absolute z-20 ${getPositionStyles()}`} onMouseDown={(e) => onResizeStart(e, position)}>
      {["ne", "se", "sw", "nw"].includes(position) && (
        <div className="flex items-center justify-center h-full w-full text-gray-400">{getIcon()}</div>
      )}
    </div>
  )
}

interface MaterialWidgetProps {
  id: string
  title: string
  children: React.ReactNode
  onRemove?: (id: string) => void
  onResize?: (id: string, size: { width: number; height: number }) => void
  onMove?: (id: string, position: { x: number; y: number }) => void
  className?: string
  expanded?: boolean
  onToggleExpand?: () => void
  elevation?: 0 | 1 | 2 | 3
  accentColor?: string
  isDragging?: boolean
  isResizing?: boolean
  allowResize?: boolean
  allowMove?: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export function MaterialWidget({
  id,
  title,
  children,
  onRemove,
  onResize,
  onMove,
  className = "",
  expanded = false,
  onToggleExpand,
  elevation = 1,
  accentColor = "bg-blue-500",
  isDragging = false,
  isResizing = false,
  allowResize = true,
  allowMove = true,
  minWidth = 200,
  minHeight = 100,
  maxWidth,
  maxHeight,
}: MaterialWidgetProps) {
  const [isResizingState, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })
  const [size, setSize] = useState({ width: 0, height: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  // Initialize size from the DOM after first render
  useEffect(() => {
    if (widgetRef.current) {
      const { offsetWidth, offsetHeight } = widgetRef.current
      setSize({ width: offsetWidth, height: offsetHeight })
    }
  }, [])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!allowResize || isDragging) return

    setIsResizing(true)
    setResizeDirection(direction)
    setStartPos({ x: e.clientX, y: e.clientY })
    setStartSize({ width: size.width, height: size.height })

    // Add event listeners for resize
    document.addEventListener("mousemove", handleResize)
    document.addEventListener("mouseup", handleResizeEnd)

    // Add a class to the body to indicate resizing (for cursor)
    document.body.classList.add("resizing")
    document.body.style.cursor = `${direction}-resize`
  }

  const handleResize = (e: MouseEvent) => {
    if (!isResizingState || !resizeDirection) return

    const deltaX = e.clientX - startPos.x
    const deltaY = e.clientY - startPos.y

    // Calculate new size based on resize direction
    let newWidth = startSize.width
    let newHeight = startSize.height

    if (resizeDirection.includes("e")) {
      newWidth = Math.max(minWidth, startSize.width + deltaX)
      if (maxWidth) newWidth = Math.min(maxWidth, newWidth)
    }
    if (resizeDirection.includes("w")) {
      newWidth = Math.max(minWidth, startSize.width - deltaX)
      if (maxWidth) newWidth = Math.min(maxWidth, newWidth)
    }
    if (resizeDirection.includes("s")) {
      newHeight = Math.max(minHeight, startSize.height + deltaY)
      if (maxHeight) newHeight = Math.min(maxHeight, newHeight)
    }
    if (resizeDirection.includes("n")) {
      newHeight = Math.max(minHeight, startSize.height - deltaY)
      if (maxHeight) newHeight = Math.min(maxHeight, newHeight)
    }

    setSize({ width: newWidth, height: newHeight })

    if (onResize) {
      onResize(id, { width: newWidth, height: newHeight })
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
    setResizeDirection(null)
    document.removeEventListener("mousemove", handleResize)
    document.removeEventListener("mouseup", handleResizeEnd)
    document.body.classList.remove("resizing")
    document.body.style.cursor = ""
  }

  // Get elevation styles
  const getElevationStyles = () => {
    switch (elevation) {
      case 0:
        return "shadow-none border border-gray-200 dark:border-gray-800"
      case 1:
        return "shadow-sm"
      case 2:
        return "shadow-md"
      case 3:
        return "shadow-lg"
      default:
        return "shadow-sm"
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
        zIndex: isDragging || isResizingState ? 10 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn("relative rounded-lg overflow-hidden", getElevationStyles(), className)}
      style={{
        width: size.width > 0 ? size.width : "100%",
        height: size.height > 0 ? size.height : "auto",
      }}
    >
      <Card
        className={cn("h-full border-0", isDragging ? "opacity-70" : "", isResizingState ? "ring-2 ring-blue-500" : "")}
      >
        <CardHeader
          className={cn(
            "p-3 flex flex-row items-center justify-between space-y-0 bg-gray-50 dark:bg-gray-900 border-b",
            accentColor && `border-t-2 border-t-${accentColor}`,
          )}
        >
          <div className="flex items-center">
            {allowMove && <GripVertical className="h-4 w-4 text-gray-500 mr-2 cursor-move" />}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onToggleExpand}
                title={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ArrowsMinimize className="h-3.5 w-3.5" /> : <ArrowsMaximize className="h-3.5 w-3.5" />}
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                onClick={() => onRemove(id)}
                title="Remove widget"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 overflow-auto" style={{ height: "calc(100% - 48px)" }}>
          {children}
        </CardContent>

        {/* Resize handles */}
        {allowResize && (
          <>
            <ResizeHandle position="n" onResizeStart={handleResizeStart} />
            <ResizeHandle position="e" onResizeStart={handleResizeStart} />
            <ResizeHandle position="s" onResizeStart={handleResizeStart} />
            <ResizeHandle position="w" onResizeStart={handleResizeStart} />
            <ResizeHandle position="ne" onResizeStart={handleResizeStart} />
            <ResizeHandle position="se" onResizeStart={handleResizeStart} />
            <ResizeHandle position="sw" onResizeStart={handleResizeStart} />
            <ResizeHandle position="nw" onResizeStart={handleResizeStart} />
          </>
        )}
      </Card>
    </motion.div>
  )
}
