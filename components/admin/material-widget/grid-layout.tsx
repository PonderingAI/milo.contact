"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  calculateGridColumns,
  compactLayout,
  findAvailablePosition,
  type WidgetLayout,
  GRID_CELL_SIZE,
} from "@/lib/grid-utils"

interface GridLayoutProps {
  children: React.ReactNode
  layouts: WidgetLayout[]
  onLayoutChange: (layouts: WidgetLayout[]) => void
  className?: string
  isEditing: boolean
}

export default function GridLayout({ children, layouts, onLayoutChange, className = "", isEditing }: GridLayoutProps) {
  const [gridColumns, setGridColumns] = useState(24)
  const [gridWidth, setGridWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update grid columns based on container width
  useEffect(() => {
    if (!containerRef.current) return

    const updateGridDimensions = () => {
      const width = containerRef.current?.clientWidth || 0
      setGridWidth(width)
      setGridColumns(calculateGridColumns(width))
    }

    updateGridDimensions()

    const resizeObserver = new ResizeObserver(updateGridDimensions)
    resizeObserver.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [])

  // Handle widget resize
  const handleWidgetResize = (id: string, x: number, y: number, width: number, height: number) => {
    const updatedLayouts = layouts.map((layout) => (layout.id === id ? { ...layout, x, y, width, height } : layout))

    // Compact the layout if not in editing mode
    const finalLayouts = isEditing ? updatedLayouts : compactLayout(updatedLayouts, gridColumns)
    onLayoutChange(finalLayouts)
  }

  // Handle widget move
  const handleWidgetMove = (id: string, x: number, y: number) => {
    const updatedLayouts = layouts.map((layout) => (layout.id === id ? { ...layout, x, y } : layout))

    // Compact the layout if not in editing mode
    const finalLayouts = isEditing ? updatedLayouts : compactLayout(updatedLayouts, gridColumns)
    onLayoutChange(finalLayouts)
  }

  // Add a new widget
  const addWidget = (id: string, width: number, height: number) => {
    const position = findAvailablePosition(layouts, width, height, gridColumns)

    const newLayout: WidgetLayout = {
      id,
      x: position.x,
      y: position.y,
      width,
      height,
    }

    const updatedLayouts = [...layouts, newLayout]
    onLayoutChange(updatedLayouts)
  }

  // Remove a widget
  const removeWidget = (id: string) => {
    const updatedLayouts = layouts.filter((layout) => layout.id !== id)
    onLayoutChange(updatedLayouts)
  }

  // Calculate grid height
  const gridHeight = layouts.reduce((max, layout) => Math.max(max, layout.y + layout.height), 0) * GRID_CELL_SIZE

  // Clone children with additional props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const layout = layouts.find((l) => l.id === child.props.id)

      if (layout) {
        return React.cloneElement(child, {
          initialX: layout.x,
          initialY: layout.y,
          initialWidth: layout.width,
          initialHeight: layout.height,
          onResize: handleWidgetResize,
          onMove: handleWidgetMove,
          isEditing,
        })
      }
    }
    return child
  })

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: "100%",
        height: gridHeight + 100, // Add some extra space at the bottom
        minHeight: "400px",
      }}
    >
      {/* Grid background - only visible in edit mode */}
      {isEditing && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="grid"
            style={{
              backgroundSize: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px`,
              backgroundImage:
                "linear-gradient(to right, rgba(81, 92, 230, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(81, 92, 230, 0.1) 1px, transparent 1px)",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      )}

      {childrenWithProps}
    </div>
  )
}
