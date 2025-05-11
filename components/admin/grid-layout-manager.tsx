"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { MaterialWidgetContainer, type WidgetPosition } from "./material-widget-container"

// Grid constants
const GRID_SIZE = 20 // Size of grid cells in pixels
const GRID_GAP = 1 // Gap between grid cells in grid units

interface Widget {
  id: string
  title: string
  content: React.ReactNode
  position: WidgetPosition
  minWidth?: number
  minHeight?: number
  isCollapsed?: boolean
}

interface GridLayoutManagerProps {
  widgets: Widget[]
  onWidgetsChange?: (widgets: Widget[]) => void
  className?: string
  columns?: number
  saveToLocalStorage?: boolean
  storageKey?: string
}

export const GridLayoutManager: React.FC<GridLayoutManagerProps> = ({
  widgets: initialWidgets,
  onWidgetsChange,
  className,
  columns = 12,
  saveToLocalStorage = true,
  storageKey = "grid-layout-widgets",
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets)
  const [gridWidth, setGridWidth] = useState(0)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  // Load widgets from localStorage on mount
  useEffect(() => {
    if (saveToLocalStorage && typeof window !== "undefined") {
      const savedWidgets = localStorage.getItem(storageKey)
      if (savedWidgets) {
        try {
          const parsedWidgets = JSON.parse(savedWidgets)
          // Merge saved positions with initial widgets
          const mergedWidgets = initialWidgets.map((widget) => {
            const savedWidget = parsedWidgets.find((w: Widget) => w.id === widget.id)
            return savedWidget
              ? { ...widget, position: savedWidget.position, isCollapsed: savedWidget.isCollapsed }
              : widget
          })
          setWidgets(mergedWidgets)
        } catch (error) {
          console.error("Failed to parse saved widgets:", error)
        }
      } else {
        setWidgets(initialWidgets)
      }
    } else {
      setWidgets(initialWidgets)
    }
  }, [initialWidgets, saveToLocalStorage, storageKey])

  // Update grid width when container size changes
  useEffect(() => {
    if (!containerRef) return

    const updateGridWidth = () => {
      setGridWidth(containerRef.offsetWidth)
    }

    updateGridWidth()

    const resizeObserver = new ResizeObserver(updateGridWidth)
    resizeObserver.observe(containerRef)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])

  // Calculate cell size based on container width and columns
  const cellSize = gridWidth ? Math.floor(gridWidth / columns) : GRID_SIZE

  // Handle widget position change
  const handlePositionChange = useCallback(
    (id: string, newPosition: WidgetPosition) => {
      setWidgets((prevWidgets) => {
        const updatedWidgets = prevWidgets.map((widget) =>
          widget.id === id ? { ...widget, position: newPosition } : widget,
        )

        // Save to localStorage if enabled
        if (saveToLocalStorage && typeof window !== "undefined") {
          const positionsToSave = updatedWidgets.map(({ id, position, isCollapsed }) => ({
            id,
            position,
            isCollapsed,
          }))
          localStorage.setItem(storageKey, JSON.stringify(positionsToSave))
        }

        // Notify parent if callback provided
        if (onWidgetsChange) {
          onWidgetsChange(updatedWidgets)
        }

        return updatedWidgets
      })
    },
    [onWidgetsChange, saveToLocalStorage, storageKey],
  )

  // Handle widget collapse toggle
  const handleCollapseToggle = useCallback(
    (id: string, collapsed: boolean) => {
      setWidgets((prevWidgets) => {
        const updatedWidgets = prevWidgets.map((widget) =>
          widget.id === id ? { ...widget, isCollapsed: collapsed } : widget,
        )

        // Save to localStorage if enabled
        if (saveToLocalStorage && typeof window !== "undefined") {
          const positionsToSave = updatedWidgets.map(({ id, position, isCollapsed }) => ({
            id,
            position,
            isCollapsed,
          }))
          localStorage.setItem(storageKey, JSON.stringify(positionsToSave))
        }

        // Notify parent if callback provided
        if (onWidgetsChange) {
          onWidgetsChange(updatedWidgets)
        }

        return updatedWidgets
      })
    },
    [onWidgetsChange, saveToLocalStorage, storageKey],
  )

  // Render grid background
  const renderGridBackground = () => {
    if (!gridWidth || !cellSize) return null

    const rows = Math.ceil(2000 / cellSize) // Arbitrary large number for height
    const cols = Math.ceil(gridWidth / cellSize)

    return (
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
              <path
                d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                fill="none"
                stroke="rgba(0, 0, 0, 0.05)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    )
  }

  return (
    <div
      ref={setContainerRef}
      className={`relative w-full min-h-[600px] bg-gray-50 dark:bg-gray-900 ${className || ""}`}
      style={{ height: "100%" }}
    >
      {/* Grid Background */}
      {renderGridBackground()}

      {/* Widgets */}
      {widgets.map((widget) => (
        <MaterialWidgetContainer
          key={widget.id}
          id={widget.id}
          title={widget.title}
          initialPosition={widget.position}
          onPositionChange={handlePositionChange}
          minWidth={widget.minWidth}
          minHeight={widget.minHeight}
          isCollapsed={widget.isCollapsed}
          onCollapseToggle={handleCollapseToggle}
        >
          {widget.content}
        </MaterialWidgetContainer>
      ))}
    </div>
  )
}
