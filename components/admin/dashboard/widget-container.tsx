"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Responsive, WidthProvider, type Layout } from "react-grid-layout"
import { AnimatePresence, motion } from "framer-motion"
import { WidgetSelector } from "./widget-selector"
import { DashboardWidget } from "./dashboard-widget"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, Undo, Save, AlertCircle, Grid3X3, Maximize2, RotateCcw } from "lucide-react"

// Import CSS for react-grid-layout
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

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
  autoCompact?: boolean
  compactType?: "vertical" | "horizontal" | null
  preventCollision?: boolean
  margin?: [number, number]
  rowHeight?: number
}

export function WidgetContainer({
  availableWidgets,
  defaultWidgets = [],
  storageKey = "admin-dashboard-widgets",
  autoCompact = true,
  compactType = "vertical",
  preventCollision = false,
  margin = [16, 16],
  rowHeight = 100,
}: WidgetContainerProps) {
  const [widgets, setWidgets] = useLocalStorage<Widget[]>(storageKey, defaultWidgets)
  const [isSelectorOpen, setSelectorOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<Widget[][]>([])
  const [layouts, setLayouts] = useLocalStorage<Record<string, Layout[]>>(`${storageKey}-layouts`, {})
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg")
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Breakpoint configuration
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }

  // Detect mobile for better mobile experience
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Convert widgets to layout format for react-grid-layout
  const widgetsToLayouts = useCallback((widgetList: Widget[]): Record<string, Layout[]> => {
    const layoutsByBreakpoint: Record<string, Layout[]> = {}
    
    Object.keys(cols).forEach(breakpoint => {
      layoutsByBreakpoint[breakpoint] = widgetList.map(widget => ({
        i: widget.id,
        x: widget.position?.x || 0,
        y: widget.position?.y || 0,
        w: Math.min(widget.size.w, cols[breakpoint as keyof typeof cols]),
        h: widget.size.h,
        minW: widget.size.minW || 1,
        minH: widget.size.minH || 1,
        maxW: widget.size.maxW || cols[breakpoint as keyof typeof cols],
        maxH: widget.size.maxH || 20,
        isBounded: true, // Keep widgets within grid bounds
      }))
    })
    
    return layoutsByBreakpoint
  }, [])

  // Convert layout back to widget format
  const layoutsToWidgets = useCallback((newLayouts: Record<string, Layout[]>): Widget[] => {
    const layoutForBreakpoint = newLayouts[currentBreakpoint] || newLayouts.lg || []
    
    return widgets.map(widget => {
      const layout = layoutForBreakpoint.find(l => l.i === widget.id)
      if (!layout) return widget
      
      return {
        ...widget,
        position: { x: layout.x, y: layout.y },
        size: {
          ...widget.size,
          w: layout.w,
          h: layout.h,
        }
      }
    })
  }, [widgets, currentBreakpoint])

  // Save state for undo
  const saveStateForUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(widgets))])
  }, [widgets])

  // Add a new widget
  const addWidget = useCallback((widgetType: string) => {
    const widgetDef = availableWidgets.find((w) => w.type === widgetType)
    if (!widgetDef) return

    saveStateForUndo()

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetDef.type,
      title: widgetDef.title,
      size: { ...widgetDef.defaultSize },
      position: { x: 0, y: 0 }, // react-grid-layout will auto-position
      props: widgetDef.defaultProps || {},
    }

    const updatedWidgets = [...widgets, newWidget]
    setWidgets(updatedWidgets)
    
    // Update layouts
    const newLayouts = widgetsToLayouts(updatedWidgets)
    setLayouts(newLayouts)
    
    setSelectorOpen(false)

    toast({
      title: "Widget Added",
      description: `Added ${widgetDef.title} widget to dashboard`,
    })
  }, [availableWidgets, widgets, saveStateForUndo, widgetsToLayouts])

  // Remove a widget
  const removeWidget = useCallback((id: string) => {
    saveStateForUndo()

    const updatedWidgets = widgets.filter((w) => w.id !== id)
    setWidgets(updatedWidgets)
    
    // Update layouts
    const newLayouts = widgetsToLayouts(updatedWidgets)
    setLayouts(newLayouts)

    toast({
      title: "Widget Removed",
      description: "Widget removed from dashboard",
    })
  }, [widgets, saveStateForUndo, widgetsToLayouts])

  // Handle layout changes (drag/resize)
  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: Record<string, Layout[]>) => {
    if (isDragging || isResizing) {
      // Update layouts state
      setLayouts(allLayouts)
      
      // Update widgets with new positions/sizes
      const updatedWidgets = layoutsToWidgets(allLayouts)
      setWidgets(updatedWidgets)
    }
  }, [isDragging, isResizing, layoutsToWidgets])

  // Handle breakpoint changes
  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint)
  }, [])

  // Drag start handler
  const handleDragStart = useCallback(() => {
    saveStateForUndo()
    setIsDragging(true)
  }, [saveStateForUndo])

  // Drag stop handler
  const handleDragStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setIsDragging(false)
  }, [])

  // Resize start handler
  const handleResizeStart = useCallback(() => {
    saveStateForUndo()
    setIsResizing(true)
  }, [saveStateForUndo])

  // Resize stop handler
  const handleResizeStop = useCallback((layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setIsResizing(false)
  }, [])

  // Undo last action
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1]
      const newUndoStack = undoStack.slice(0, -1)
      
      setWidgets(previousState)
      setUndoStack(newUndoStack)
      
      // Update layouts
      const newLayouts = widgetsToLayouts(previousState)
      setLayouts(newLayouts)
      
      toast({
        title: "Undo",
        description: "Reverted to previous dashboard state",
      })
    }
  }, [undoStack, widgetsToLayouts])

  // Reset layout
  const handleResetLayout = useCallback(() => {
    saveStateForUndo()
    
    // Reset all widgets to auto-layout
    const resetWidgets = widgets.map(widget => ({
      ...widget,
      position: { x: 0, y: 0 }
    }))
    
    setWidgets(resetWidgets)
    
    // Clear custom layouts to force auto-layout
    setLayouts({})
    
    toast({
      title: "Layout Reset",
      description: "Dashboard layout has been reset to automatic positioning",
    })
  }, [widgets, saveStateForUndo])

  // Auto-arrange widgets
  const handleAutoArrange = useCallback(() => {
    saveStateForUndo()
    
    // Create an optimal layout
    const arrangedWidgets = [...widgets].map((widget, index) => {
      const col = cols[currentBreakpoint as keyof typeof cols]
      const widgetWidth = Math.min(widget.size.w, col)
      const x = (index * widgetWidth) % col
      const y = Math.floor((index * widgetWidth) / col) * widget.size.h
      
      return {
        ...widget,
        position: { x, y }
      }
    })
    
    setWidgets(arrangedWidgets)
    
    const newLayouts = widgetsToLayouts(arrangedWidgets)
    setLayouts(newLayouts)
    
    toast({
      title: "Auto-Arranged",
      description: "Widgets have been automatically arranged",
    })
  }, [widgets, currentBreakpoint, saveStateForUndo, widgetsToLayouts])

  // Save dashboard layout
  const handleSave = useCallback(() => {
    toast({
      title: "Dashboard Saved",
      description: "Your dashboard layout has been saved automatically",
    })
  }, [])

  // Safely render widget component
  const renderWidgetComponent = useCallback((widget: Widget) => {
    try {
      const widgetDef = availableWidgets.find((w) => w.type === widget.type)
      if (!widgetDef || typeof widgetDef.component !== "function") {
        return (
          <div className="flex flex-col items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400">Invalid widget type</p>
          </div>
        )
      }

      const Component = widgetDef.component
      return <Component {...(widget.props || {})} />
    } catch (error) {
      console.error("Error rendering widget:", error)
      return (
        <div className="flex flex-col items-center justify-center h-full bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Failed to render widget</p>
          <p className="text-xs text-yellow-500 dark:text-yellow-500 mt-1">Check console for details</p>
        </div>
      )
    }
  }, [availableWidgets])

  // Get current layouts
  const currentLayouts = layouts && Object.keys(layouts).length > 0 ? layouts : widgetsToLayouts(widgets)

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Enhanced floating controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-1"
            title="Undo last action"
          >
            <Undo className="h-4 w-4" />
            {!isMobile && "Undo"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAutoArrange}
            className="flex items-center gap-1"
            title="Auto-arrange widgets"
          >
            <Grid3X3 className="h-4 w-4" />
            {!isMobile && "Auto"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetLayout}
            className="flex items-center gap-1"
            title="Reset layout"
          >
            <RotateCcw className="h-4 w-4" />
            {!isMobile && "Reset"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="flex items-center gap-1"
            title="Save dashboard"
          >
            <Save className="h-4 w-4" />
            {!isMobile && "Save"}
          </Button>
        </div>
        
        <Button 
          onClick={() => setSelectorOpen(true)} 
          className="flex items-center gap-1 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          title="Add new widget"
        >
          <Plus className="h-4 w-4" />
          {!isMobile && "Add Widget"}
        </Button>
      </div>

      {/* Enhanced grid container */}
      <div className="flex-grow overflow-auto p-4 w-full h-full">
        {widgets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center">
                <Grid3X3 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to your Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by adding your first widget to create a personalized dashboard experience.
              </p>
              <Button 
                onClick={() => setSelectorOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Widget
              </Button>
            </div>
          </motion.div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={currentLayouts}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            onDragStart={handleDragStart}
            onDragStop={handleDragStop}
            onResizeStart={handleResizeStart}
            onResizeStop={handleResizeStop}
            breakpoints={breakpoints}
            cols={cols}
            rowHeight={rowHeight}
            margin={margin}
            containerPadding={[0, 0]}
            autoSize={true}
            compactType={compactType}
            preventCollision={preventCollision}
            isDraggable={!isMobile} // Disable drag on mobile for better touch experience
            isResizable={!isMobile} // Disable resize on mobile
            useCSSTransforms={true}
            transformScale={1}
            verticalCompact={autoCompact}
            // Enhanced mobile experience
            {...(isMobile && {
              compactType: "vertical",
              preventCollision: true,
              isDraggable: false,
              isResizable: false,
            })}
          >
            {widgets.map((widget) => (
              <div 
                key={widget.id}
                className="widget-container bg-background rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow duration-200 hover:shadow-md"
              >
                <DashboardWidget
                  widget={widget}
                  onRemove={removeWidget}
                  className="h-full"
                  showRemoveButton={!isMobile}
                >
                  {renderWidgetComponent(widget)}
                </DashboardWidget>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Widget selector */}
      <WidgetSelector
        open={isSelectorOpen}
        onClose={() => setSelectorOpen(false)}
        widgets={availableWidgets}
        onSelectWidget={addWidget}
      />

      {/* Custom styles for better visual feedback */}
      <style jsx global>{`
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9IiM0QTVDNkEiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PHBhdGggZD0ibTUgNWgtNHYtNGg0djR6bS0zLTNoMnYyaC0ydi0yeiIvPjwvZz48L3N2Zz4=') no-repeat bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
          opacity: 0.4;
          transition: opacity 200ms ease;
        }
        
        .react-grid-item:hover > .react-resizable-handle {
          opacity: 0.8;
        }
        
        .react-grid-placeholder {
          background: rgb(59 130 246 / 0.3) !important;
          border: 2px dashed rgb(59 130 246) !important;
          border-radius: 8px !important;
          transition: all 200ms ease;
        }
        
        .widget-container {
          position: relative;
          overflow: hidden;
        }
        
        @media (max-width: 768px) {
          .react-grid-item {
            touch-action: pan-y;
          }
        }
      `}</style>
    </div>
  )
}
