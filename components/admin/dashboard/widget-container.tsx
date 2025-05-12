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
import { ErrorBoundaryWidget } from "./error-boundary-widget"

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

  // Update layout when widgets change or on mount
  useEffect(() => {
    if (widgets.length > 0 && containerWidth > 0) {
      const widgetsWithoutPositions = widgets.some((widget) => !widget.position)
      if (widgetsWithoutPositions || isDragging === false) {
        const compactedWidgets = compactLayout([...widgets])
        if (JSON.stringify(compactedWidgets) !== JSON.stringify(widgets)) {
          setWidgets(compactedWidgets)
        }
      }
    }
  }, [widgets, containerWidth, isDragging])

  // Compact the layout to fill empty spaces
  const compactLayout = (currentWidgets: Widget[]): Widget[] => {
    // Create a deep copy to avoid mutating the original
    const widgetsCopy = JSON.parse(JSON.stringify(currentWidgets)) as Widget[]

    // Sort widgets by y position (top to bottom)
    const sortedWidgets = widgetsCopy.sort((a, b) => {
      if (!a.position) return -1
      if (!b.position) return 1
      return a.position.y - b.position.y || a.position.x - b.position.x
    })

    // Initialize grid representation (100 rows should be enough for most dashboards)
    const grid: boolean[][] = Array(100)
      .fill(null)
      .map(() => Array(gridColumns).fill(false))

    // Place widgets on grid
    return sortedWidgets.map((widget) => {
      // Find first available position if no position exists
      if (!widget.position) {
        let placed = false
        let x = 0
        let y = 0

        while (!placed && y < 100) {
          if (canPlace(grid, x, y, widget.size.w, widget.size.h)) {
            placeWidget(grid, x, y, widget.size.w, widget.size.h)
            placed = true
            widget.position = { x, y }
          } else {
            // Move to next position
            x++
            if (x + widget.size.w > gridColumns) {
              x = 0
              y++
            }
          }
        }
        return widget
      }

      // Try to place widget at its current position
      const { x, y } = widget.position

      // If current position is available, keep it
      if (canPlace(grid, x, y, widget.size.w, widget.size.h)) {
        placeWidget(grid, x, y, widget.size.w, widget.size.h)
        return widget
      }

      // Otherwise, find a new position
      let newX = 0
      let newY = 0
      let placed = false

      while (!placed && newY < 100) {
        if (canPlace(grid, newX, newY, widget.size.w, widget.size.h)) {
          placeWidget(grid, newX, newY, widget.size.w, widget.size.h)
          placed = true
          widget.position = { x: newX, y: newY }
        } else {
          // Move to next position
          newX++
          if (newX + widget.size.w > gridColumns) {
            newX = 0
            newY++
          }
        }
      }

      return widget
    })
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

  // Mark grid cells as occupied
  const placeWidget = (grid: boolean[][], x: number, y: number, w: number, h: number): void => {
    for (let i = y; i < y + h; i++) {
      if (!grid[i]) grid[i] = []
      for (let j = x; j < x + w; j++) {
        grid[i][j] = true
      }
    }
  }

  // Add a new widget
  const addWidget = (widgetType: string) => {
    const widgetDef = availableWidgets.find((w) => w.type === widgetType)
    if (!widgetDef) return

    // Save current state for undo
    setUndoStack([...undoStack, [...widgets]])

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetDef.type,
      title: widgetDef.title,
      size: { ...widgetDef.defaultSize },
      props: widgetDef.defaultProps || {},
    }

    setWidgets([...widgets, newWidget])
    setSelectorOpen(false)
    toast({
      title: "Widget Added",
      description: `Added ${widgetDef.title} widget to dashboard`,
    })
  }

  // Remove a widget
  const removeWidget = (id: string) => {
    // Save current state for undo
    setUndoStack([...undoStack, [...widgets]])

    setWidgets(widgets.filter((w) => w.id !== id))
    toast({
      title: "Widget Removed",
      description: "Widget removed from dashboard",
    })
  }

  // Update widget position
  const updateWidgetPosition = (id: string, position: { x: number; y: number }) => {
    const updatedWidgets = widgets.map((widget) => (widget.id === id ? { ...widget, position } : widget))
    setWidgets(updatedWidgets)
  }

  // Update widget size
  const updateWidgetSize = (id: string, size: { w: number; h: number }) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === id ? { ...widget, size: { ...widget.size, ...size } } : widget,
    )
    setWidgets(updatedWidgets)
  }

  // Handle widget drag start
  const handleDragStart = () => {
    // Save current state for undo
    setUndoStack([...undoStack, [...widgets]])
    setIsDragging(true)
  }

  // Handle widget drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    // Recompact layout after drag
    const compactedWidgets = compactLayout([...widgets])
    setWidgets(compactedWidgets)
  }

  // Handle widget resize start
  const handleResizeStart = () => {
    // Save current state for undo
    setUndoStack([...undoStack, [...widgets]])
    setIsResizing(true)
  }

  // Handle widget resize end
  const handleResizeEnd = () => {
    setIsResizing(false)
    // Recompact layout after resize
    const compactedWidgets = compactLayout([...widgets])
    setWidgets(compactedWidgets)
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
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-1"
          >
            <Undo className="h-4 w-4" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} className="flex items-center gap-1">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={() => setSelectorOpen(true)} className="flex items-center gap-1 rounded-full">
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-grow bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto p-4"
        style={{
          minHeight: "calc(100vh - 200px)",
          height: "100%",
        }}
      >
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
              isDragging={isDragging}
              isResizing={isResizing}
            >
              <ErrorBoundaryWidget>{renderWidgetComponent(widget)}</ErrorBoundaryWidget>
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
