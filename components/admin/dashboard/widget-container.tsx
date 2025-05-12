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
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null)

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

  // Check if a widget can be placed at a position
  const canPlace = (grid: boolean[][], x: number, y: number, w: number, h: number, skipId?: string): boolean => {
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
  const placeWidget = (grid: boolean[][], x: number, y: number, w: number, h: number, id?: string): void => {
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
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(widgets))])

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
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(widgets))])

    setWidgets(widgets.filter((w) => w.id !== id))
    toast({
      title: "Widget Removed",
      description: "Widget removed from dashboard",
    })
  }

  // Update widget position
  const updateWidgetPosition = (id: string, position: { x: number; y: number }) => {
    // Create a temporary grid to check for collisions
    const grid: boolean[][] = Array(100)
      .fill(null)
      .map(() => Array(gridColumns).fill(false))

    // Mark all widgets except the one being moved
    widgets.forEach((widget) => {
      if (widget.id !== id && widget.position) {
        placeWidget(grid, widget.position.x, widget.position.y, widget.size.w, widget.size.h)
      }
    })

    // Find the widget being moved
    const widget = widgets.find((w) => w.id === id)
    if (!widget) return

    // Check if the new position is valid
    if (canPlace(grid, position.x, position.y, widget.size.w, widget.size.h)) {
      const updatedWidgets = widgets.map((w) => (w.id === id ? { ...w, position } : w))
      setWidgets(updatedWidgets)
      setDraggedWidgetId(id)
    }
  }

  // Update widget size
  const updateWidgetSize = (id: string, size: { w: number; h: number }) => {
    // Create a temporary grid to check for collisions
    const grid: boolean[][] = Array(100)
      .fill(null)
      .map(() => Array(gridColumns).fill(false))

    // Mark all widgets except the one being resized
    widgets.forEach((widget) => {
      if (widget.id !== id && widget.position) {
        placeWidget(grid, widget.position.x, widget.position.y, widget.size.w, widget.size.h)
      }
    })

    // Find the widget being resized
    const widget = widgets.find((w) => w.id === id)
    if (!widget || !widget.position) return

    // Check if the new size is valid
    if (canPlace(grid, widget.position.x, widget.position.y, size.w, size.h)) {
      const updatedWidgets = widgets.map((w) => (w.id === id ? { ...w, size: { ...w.size, ...size } } : w))
      setWidgets(updatedWidgets)
    }
  }

  // Handle widget drag start
  const handleDragStart = (id: string) => {
    // Save current state for undo
    setUndoStack([...undoStack, JSON.parse(JSON.stringify(widgets))])
    setIsDragging(true)
    setDraggedWidgetId(id)
  }

  // Handle widget drag end
  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedWidgetId(null)
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
              onDragStart={() => handleDragStart(widget.id)}
              onDragEnd={handleDragEnd}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
              isDragging={isDragging && draggedWidgetId === widget.id}
              isResizing={isResizing}
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
