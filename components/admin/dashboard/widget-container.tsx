"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { WidgetSelector } from "./widget-selector"
import { DashboardWidget } from "./dashboard-widget"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, Undo, Save, AlertCircle } from "lucide-react"

export interface Widget {
  id: string
  type: string
  title: string
  size: {
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }
  position?: {
    x: number
    y: number
  }
  props?: Record<string, any>
}

export interface WidgetDefinition {
  type: string
  title: string
  description: string
  category: string
  component: React.ComponentType<any>
  defaultSize: {
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }
  defaultProps?: Record<string, any>
}

interface WidgetContainerProps {
  availableWidgets: WidgetDefinition[]
  defaultWidgets?: Widget[]
  storageKey?: string
  columns?: number
  rowHeight?: number
  gap?: number
}

export function WidgetContainer({
  availableWidgets,
  defaultWidgets = [],
  storageKey = "admin-dashboard-widgets",
  columns = 12,
  rowHeight = 100,
  gap = 16,
}: WidgetContainerProps) {
  const [widgets, setWidgets] = useLocalStorage<Widget[]>(storageKey, defaultWidgets)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isSelectorOpen, setSelectorOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<Widget[][]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [cellWidth, setCellWidth] = useState(0)
  const [cellHeight, setRowHeight] = useState(rowHeight)
  const [gridColumns, setGridColumns] = useState(columns)
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null)

  // Calculate container dimensions
  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        const width = containerRef.current?.clientWidth || 0
        setContainerWidth(width)
        const cellW = (width - (gridColumns - 1) * gap) / gridColumns
        setCellWidth(cellW)
      }

      updateDimensions()
      window.addEventListener("resize", updateDimensions)
      return () => window.removeEventListener("resize", updateDimensions)
    }
  }, [gridColumns, gap])

  // Create a grid representation of widget positions
  const createGrid = (currentWidgets: Widget[], skipId?: string): boolean[][] => {
    const grid: boolean[][] = Array(100)
      .fill(null)
      .map(() => Array(gridColumns).fill(false))

    currentWidgets.forEach((widget) => {
      if (widget.id !== skipId && widget.position) {
        for (let y = widget.position.y; y < widget.position.y + widget.size.h; y++) {
          for (let x = widget.position.x; x < widget.position.x + widget.size.w; x++) {
            if (y >= 0 && x >= 0 && x < gridColumns) {
              if (!grid[y]) grid[y] = Array(gridColumns).fill(false)
              grid[y][x] = true
            }
          }
        }
      }
    })

    return grid
  }

  // Check if a widget can be placed at a position
  const canPlace = (grid: boolean[][], x: number, y: number, w: number, h: number): boolean => {
    if (x < 0 || y < 0 || x + w > gridColumns) return false

    for (let i = y; i < y + h; i++) {
      for (let j = x; j < x + w; j++) {
        if (!grid[i]) continue // Skip if row doesn't exist
        if (grid[i][j]) return false
      }
    }
    return true
  }

  // Reflow widgets to avoid overlaps
  const reflowWidgets = (currentWidgets: Widget[], activeId?: string): Widget[] => {
    // Sort widgets by position (top to bottom, left to right)
    const sortedWidgets = [...currentWidgets].sort((a, b) => {
      if (!a.position) return -1
      if (!b.position) return 1
      if (a.position.y !== b.position.y) return a.position.y - b.position.y
      return a.position.x - b.position.x
    })

    // Move active widget to the front if specified
    if (activeId) {
      const activeIndex = sortedWidgets.findIndex((w) => w.id === activeId)
      if (activeIndex !== -1) {
        const activeWidget = sortedWidgets.splice(activeIndex, 1)[0]
        sortedWidgets.unshift(activeWidget)
      }
    }

    // Initialize grid
    const grid: boolean[][] = Array(100)
      .fill(null)
      .map(() => Array(gridColumns).fill(false))

    // Place widgets on grid, moving them if needed
    return sortedWidgets.map((widget) => {
      const widgetCopy = { ...widget }

      // If no position, find first available spot
      if (!widgetCopy.position) {
        let placed = false
        let x = 0
        let y = 0

        while (!placed && y < 100) {
          if (canPlace(grid, x, y, widgetCopy.size.w, widgetCopy.size.h)) {
            placed = true
            widgetCopy.position = { x, y }

            // Mark grid as occupied
            for (let i = y; i < y + widgetCopy.size.h; i++) {
              for (let j = x; j < x + widgetCopy.size.w; j++) {
                if (!grid[i]) grid[i] = Array(gridColumns).fill(false)
                grid[i][j] = true
              }
            }
          } else {
            // Try next position
            x++
            if (x + widgetCopy.size.w > gridColumns) {
              x = 0
              y++
            }
          }
        }

        return widgetCopy
      }

      // Try to place at current position
      let { x, y } = widgetCopy.position

      // If current position is occupied, find nearest available spot
      if (!canPlace(grid, x, y, widgetCopy.size.w, widgetCopy.size.h)) {
        // Try to find closest available position
        let bestX = 0
        let bestY = 0
        let bestDistance = Number.POSITIVE_INFINITY

        // Search for available positions
        for (let searchY = 0; searchY < 100; searchY++) {
          for (let searchX = 0; searchX <= gridColumns - widgetCopy.size.w; searchX++) {
            if (canPlace(grid, searchX, searchY, widgetCopy.size.w, widgetCopy.size.h)) {
              const distance = Math.abs(searchX - x) + Math.abs(searchY - y)
              if (distance < bestDistance) {
                bestDistance = distance
                bestX = searchX
                bestY = searchY
              }
            }
          }

          // If we found a position in this row, and it's getting further away, stop searching
          if (bestDistance < Number.POSITIVE_INFINITY && searchY > y + bestDistance) break
        }

        // Update position to best available spot
        x = bestX
        y = bestY
        widgetCopy.position = { x, y }
      }

      // Mark grid as occupied
      for (let i = y; i < y + widgetCopy.size.h; i++) {
        for (let j = x; j < x + widgetCopy.size.w; j++) {
          if (!grid[i]) grid[i] = Array(gridColumns).fill(false)
          grid[i][j] = true
        }
      }

      return widgetCopy
    })
  }

  // Add a new widget
  const addWidget = (widgetType: string) => {
    const widgetDef = availableWidgets.find((w) => w.type === widgetType)
    if (!widgetDef) return

    // Save current state for undo
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(widgets))])

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetDef.type,
      title: widgetDef.title,
      size: { ...widgetDef.defaultSize },
      props: widgetDef.defaultProps || {},
    }

    // Add widget and reflow
    const updatedWidgets = reflowWidgets([...widgets, newWidget], newWidget.id)
    setWidgets(updatedWidgets)
    setSelectorOpen(false)

    toast({
      title: "Widget Added",
      description: `Added ${widgetDef.title} widget to dashboard`,
    })
  }

  // Remove a widget
  const removeWidget = (id: string) => {
    // Save current state for undo
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(widgets))])

    // Remove widget and reflow
    const updatedWidgets = reflowWidgets(widgets.filter((w) => w.id !== id))
    setWidgets(updatedWidgets)

    toast({
      title: "Widget Removed",
      description: "Widget removed from dashboard",
    })
  }

  // Update widget position
  const updateWidgetPosition = (id: string, position: { x: number; y: number }) => {
    // Find the widget
    const widgetIndex = widgets.findIndex((w) => w.id === id)
    if (widgetIndex === -1) return

    // Create updated widgets array
    const updatedWidgets = [...widgets]
    updatedWidgets[widgetIndex] = {
      ...updatedWidgets[widgetIndex],
      position,
    }

    // Reflow widgets to avoid overlaps
    const reflowedWidgets = reflowWidgets(updatedWidgets, id)
    setWidgets(reflowedWidgets)
    setActiveWidgetId(id)
  }

  // Update widget size
  const updateWidgetSize = (id: string, size: { w: number; h: number }, direction: string) => {
    // Find the widget
    const widgetIndex = widgets.findIndex((w) => w.id === id)
    if (widgetIndex === -1) return

    // Create updated widgets array
    const updatedWidgets = [...widgets]
    updatedWidgets[widgetIndex] = {
      ...updatedWidgets[widgetIndex],
      size: { ...updatedWidgets[widgetIndex].size, ...size },
    }

    // Reflow widgets to avoid overlaps
    const reflowedWidgets = reflowWidgets(updatedWidgets, id)
    setWidgets(reflowedWidgets)
    setActiveWidgetId(id)
  }

  // Handle widget drag start
  const handleDragStart = () => {
    // Save current state for undo
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(widgets))])
    setIsDragging(true)
  }

  // Handle widget drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    setActiveWidgetId(null)
  }

  // Handle widget resize start
  const handleResizeStart = () => {
    // Save current state for undo
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(widgets))])
    setIsResizing(true)
  }

  // Handle widget resize end
  const handleResizeEnd = () => {
    setIsResizing(false)
    setActiveWidgetId(null)
  }

  // Undo last action
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack.pop()
      if (previousState) {
        setWidgets(previousState)
        setUndoStack([...undoStack])
        toast({
          title: "Undo",
          description: "Reverted to previous dashboard state",
        })
      }
    }
  }

  // Save dashboard layout
  const handleSave = () => {
    // Already saved via localStorage, just show confirmation
    toast({
      title: "Dashboard Saved",
      description: "Your dashboard layout has been saved",
    })
  }

  // Safely render widget component
  const renderWidgetComponent = (widget: Widget) => {
    try {
      const widgetDef = availableWidgets.find((w) => w.type === widget.type)
      if (!widgetDef || typeof widgetDef.component !== "function") {
        return <div>Invalid widget type</div>
      }

      // Use a simple approach - just render the component directly with its props
      const Component = widgetDef.component
      return <Component {...(widget.props || {})} />
    } catch (error) {
      console.error("Error rendering widget:", error)
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm">Failed to render widget</p>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col w-full h-full bg-gray-100 dark:bg-gray-900">
      {/* Floating controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="flex items-center gap-1 bg-background/80 backdrop-blur-sm"
        >
          <Undo className="h-4 w-4" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="flex items-center gap-1 bg-background/80 backdrop-blur-sm"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button onClick={() => setSelectorOpen(true)} className="flex items-center gap-1 rounded-full bg-primary">
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      </div>

      <div ref={containerRef} className="relative flex-grow overflow-auto p-4 w-full h-full">
        <AnimatePresence>
          {widgets.map((widget) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              gridColumns={gridColumns}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              gap={gap}
              onRemove={removeWidget}
              onPositionChange={updateWidgetPosition}
              onSizeChange={updateWidgetSize}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
              isDragging={isDragging && activeWidgetId === widget.id}
              isResizing={isResizing && activeWidgetId === widget.id}
            >
              {renderWidgetComponent(widget)}
            </DashboardWidget>
          ))}
        </AnimatePresence>
      </div>

      <WidgetSelector
        open={isSelectorOpen}
        onClose={() => setSelectorOpen(false)}
        widgets={availableWidgets}
        onSelectWidget={addWidget}
      />
    </div>
  )
}
