"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { WidgetSelector } from "./widget-selector"
import { DashboardWidget } from "./dashboard-widget"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, Save, Undo } from "lucide-react"

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
  const [layout, setLayout] = useState<any[]>([])
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

  // Update layout when widgets change
  useEffect(() => {
    if (widgets.length > 0 && containerWidth > 0) {
      compactLayout(widgets)
    }
  }, [widgets, containerWidth])

  // Compact the layout to fill empty spaces
  const compactLayout = (currentWidgets: Widget[]) => {
    // Sort widgets by y position (top to bottom)
    const sortedWidgets = [...currentWidgets].sort((a, b) => {
      if (!a.position) return -1
      if (!b.position) return 1
      return a.position.y - b.position.y || a.position.x - b.position.x
    })

    // Initialize grid representation
    const grid: boolean[][] = Array(100)
      .fill(null)
      .map(() => Array(gridColumns).fill(false))

    // Place widgets on grid
    const newLayout = sortedWidgets.map((widget) => {
      if (!widget.position) {
        // Find first available position
        let placed = false
        let x = 0
        let y = 0

        while (!placed) {
          if (canPlace(grid, x, y, widget.size.w, widget.size.h)) {
            placeWidget(grid, x, y, widget.size.w, widget.size.h)
            placed = true
          } else {
            // Move to next position
            x++
            if (x + widget.size.w > gridColumns) {
              x = 0
              y++
            }
          }
        }

        return { ...widget, position: { x, y } }
      }

      // Use existing position if possible
      if (canPlace(grid, widget.position.x, widget.position.y, widget.size.w, widget.size.h)) {
        placeWidget(grid, widget.position.x, widget.position.y, widget.size.w, widget.size.h)
        return widget
      }

      // Find new position if current is occupied
      let placed = false
      let x = 0
      let y = 0

      while (!placed) {
        if (canPlace(grid, x, y, widget.size.w, widget.size.h)) {
          placeWidget(grid, x, y, widget.size.w, widget.size.h)
          placed = true
        } else {
          // Move to next position
          x++
          if (x + widget.size.w > gridColumns) {
            x = 0
            y++
          }
        }
      }

      return { ...widget, position: { x, y } }
    })

    setWidgets(newLayout)
    setLayout(newLayout)
  }

  // Check if a widget can be placed at a position
  const canPlace = (grid: boolean[][], x: number, y: number, w: number, h: number) => {
    if (x < 0 || y < 0 || x + w > gridColumns) return false

    for (let i = y; i < y + h; i++) {
      for (let j = x; j < x + w; j++) {
        if (grid[i] && grid[i][j]) return false
      }
    }
    return true
  }

  // Mark grid cells as occupied
  const placeWidget = (grid: boolean[][], x: number, y: number, w: number, h: number) => {
    for (let i = y; i < y + h; i++) {
      for (let j = x; j < x + w; j++) {
        if (!grid[i]) grid[i] = []
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
    compactLayout(widgets)
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
    compactLayout(widgets)
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
          <Button onClick={() => setSelectorOpen(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-grow grid auto-rows-min gap-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: `${gap}px`,
          minHeight: "calc(100vh - 200px)",
        }}
      >
        <AnimatePresence>
          {widgets.map((widget) => {
            const widgetDef = availableWidgets.find((w) => w.type === widget.type)
            if (!widgetDef) return null

            const WidgetComponent = widgetDef.component

            return (
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
                <WidgetComponent {...widget.props} />
              </DashboardWidget>
            )
          })}
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
