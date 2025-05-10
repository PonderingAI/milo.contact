"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Widget from "./widget"

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
  widgets: initialWidgets,
  gridSize = 20,
  onLayoutChange,
  className,
}: GridLayoutSystemProps) {
  const [widgets, setWidgets] = useState<WidgetData[]>(initialWidgets)
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  // Update container dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      setContainerDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  // Handle widget resize
  const handleWidgetResize = (id: string, width: number, height: number) => {
    const updatedWidgets = widgets.map((widget) => {
      if (widget.id === id) {
        return { ...widget, width, height }
      }
      return widget
    })

    setWidgets(updatedWidgets)
    if (onLayoutChange) {
      onLayoutChange(updatedWidgets)
    }
  }

  // Handle widget move
  const handleWidgetMove = (id: string, x: number, y: number) => {
    const updatedWidgets = widgets.map((widget) => {
      if (widget.id === id) {
        return { ...widget, x, y }
      }
      return widget
    })

    // Rearrange widgets to fill space efficiently
    const rearrangedWidgets = rearrangeWidgets(updatedWidgets, id)

    setWidgets(rearrangedWidgets)
    if (onLayoutChange) {
      onLayoutChange(rearrangedWidgets)
    }
  }

  // Handle widget collapse toggle
  const handleToggleCollapse = (id: string, isCollapsed: boolean) => {
    const updatedWidgets = widgets.map((widget) => {
      if (widget.id === id) {
        return { ...widget, isCollapsed }
      }
      return widget
    })

    setWidgets(updatedWidgets)
    if (onLayoutChange) {
      onLayoutChange(updatedWidgets)
    }
  }

  // Rearrange widgets to fill space efficiently
  const rearrangeWidgets = (currentWidgets: WidgetData[], movedWidgetId: string): WidgetData[] => {
    // Create a copy of widgets to work with
    const widgetsCopy = [...currentWidgets]

    // Find the moved widget
    const movedWidgetIndex = widgetsCopy.findIndex((w) => w.id === movedWidgetId)
    if (movedWidgetIndex === -1) return widgetsCopy

    const movedWidget = widgetsCopy[movedWidgetIndex]

    // Create a grid representation
    const grid: boolean[][] = []
    const maxX = Math.max(...widgetsCopy.map((w) => w.x + w.width)) + gridSize * 10
    const maxY = Math.max(...widgetsCopy.map((w) => w.y + w.height)) + gridSize * 10

    // Initialize grid
    for (let y = 0; y < maxY; y += gridSize) {
      grid[y / gridSize] = []
      for (let x = 0; x < maxX; x += gridSize) {
        grid[y / gridSize][x / gridSize] = false
      }
    }

    // Mark occupied cells (excluding the moved widget)
    widgetsCopy.forEach((widget, index) => {
      if (index === movedWidgetIndex) return

      const startX = Math.floor(widget.x / gridSize)
      const startY = Math.floor(widget.y / gridSize)
      const endX = Math.ceil((widget.x + widget.width) / gridSize)
      const endY = Math.ceil((widget.y + widget.height) / gridSize)

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (grid[y] && grid[y][x] !== undefined) {
            grid[y][x] = true
          }
        }
      }
    })

    // Check if the moved widget's position conflicts with any other widget
    const startX = Math.floor(movedWidget.x / gridSize)
    const startY = Math.floor(movedWidget.y / gridSize)
    const endX = Math.ceil((movedWidget.x + movedWidget.width) / gridSize)
    const endY = Math.ceil((movedWidget.y + movedWidget.height) / gridSize)

    let hasConflict = false
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (grid[y] && grid[y][x]) {
          hasConflict = true
          break
        }
      }
      if (hasConflict) break
    }

    // If no conflict, return the widgets as is
    if (!hasConflict) return widgetsCopy

    // If there's a conflict, find the nearest available position
    // This is a simplified approach - in a real implementation, you might want a more sophisticated algorithm

    return widgetsCopy
  }

  return (
    <div
      className={`relative w-full h-full min-h-[600px] ${className || ""}`}
      style={{
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundImage: "radial-gradient(circle, #00000005 1px, transparent 1px)",
      }}
    >
      {widgets.map((widget) => (
        <Widget
          key={widget.id}
          id={widget.id}
          title={widget.title}
          initialWidth={widget.width}
          initialHeight={widget.height}
          initialX={widget.x}
          initialY={widget.y}
          gridSize={gridSize}
          onResize={handleWidgetResize}
          onMove={handleWidgetMove}
          isCollapsed={widget.isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          className="material-widget"
        >
          {widget.content}
        </Widget>
      ))}
    </div>
  )
}
