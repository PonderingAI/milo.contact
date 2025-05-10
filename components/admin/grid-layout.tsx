"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface GridItem {
  id: string
  x: number
  y: number
  w: number
  h: number
  content: React.ReactNode
  static?: boolean
  collapsed?: boolean
}

interface GridLayoutProps {
  items: GridItem[]
  cols: number
  rowHeight: number
  gap: number
  onLayoutChange?: (layout: GridItem[]) => void
  className?: string
}

export function GridLayout({
  items,
  cols = 12,
  rowHeight = 100,
  gap = 10,
  onLayoutChange,
  className = "",
}: GridLayoutProps) {
  const [layout, setLayout] = useState<GridItem[]>(items)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)

  // Update layout when items change
  useEffect(() => {
    setLayout(items)
  }, [items])

  // Compact the layout to fill empty spaces
  const compactLayout = useCallback(() => {
    // Sort items by y position (top to bottom)
    const sortedItems = [...layout].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })

    const newLayout: GridItem[] = []
    const grid: { [key: string]: string } = {} // Track occupied cells

    // Place each item in the first available position
    sortedItems.forEach((item) => {
      if (item.static) {
        // Don't move static items
        newLayout.push(item)

        // Mark cells as occupied
        for (let x = item.x; x < item.x + item.w; x++) {
          for (let y = item.y; y < item.y + item.h; y++) {
            grid[`${x},${y}`] = item.id
          }
        }
        return
      }

      // Find the first available position for this item
      let placed = false
      let y = 0

      while (!placed) {
        for (let x = 0; x <= cols - item.w; x++) {
          // Check if this position is available
          let canPlace = true
          for (let ix = 0; ix < item.w; ix++) {
            for (let iy = 0; iy < item.h; iy++) {
              if (grid[`${x + ix},${y + iy}`]) {
                canPlace = false
                break
              }
            }
            if (!canPlace) break
          }

          if (canPlace) {
            // Place the item here
            const newItem = { ...item, x, y }
            newLayout.push(newItem)

            // Mark cells as occupied
            for (let ix = 0; ix < item.w; ix++) {
              for (let iy = 0; iy < item.h; iy++) {
                grid[`${x + ix},${y + iy}`] = item.id
              }
            }

            placed = true
            break
          }
        }

        if (!placed) y++
      }
    })

    return newLayout
  }, [layout, cols])

  // Handle item movement
  const moveItem = useCallback(
    (id: string, x: number, y: number) => {
      const newLayout = layout.map((item) => {
        if (item.id === id) {
          // Ensure the item stays within bounds
          const boundedX = Math.max(0, Math.min(cols - item.w, x))
          return { ...item, x: boundedX, y: Math.max(0, y) }
        }
        return item
      })

      setLayout(newLayout)

      if (onLayoutChange) {
        onLayoutChange(newLayout)
      }
    },
    [layout, cols, onLayoutChange],
  )

  // Handle item resize
  const resizeItem = useCallback(
    (id: string, w: number, h: number) => {
      const newLayout = layout.map((item) => {
        if (item.id === id) {
          // Ensure the item stays within bounds
          const boundedW = Math.max(1, Math.min(cols, w))
          return { ...item, w: boundedW, h: Math.max(1, h) }
        }
        return item
      })

      setLayout(newLayout)

      if (onLayoutChange) {
        onLayoutChange(newLayout)
      }
    },
    [layout, cols, onLayoutChange],
  )

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("widgetId", id)
    setDraggingId(id)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData("widgetId")

    if (draggedId === targetId) return

    // Find the dragged and target items
    const draggedItem = layout.find((item) => item.id === draggedId)
    const targetItem = layout.find((item) => item.id === targetId)

    if (!draggedItem || !targetItem) return

    // Swap positions
    const newLayout = layout.map((item) => {
      if (item.id === draggedId) {
        return { ...item, x: targetItem.x, y: targetItem.y }
      }
      if (item.id === targetId) {
        return { ...item, x: draggedItem.x, y: draggedItem.y }
      }
      return item
    })

    setLayout(newLayout)

    if (onLayoutChange) {
      onLayoutChange(newLayout)
    }

    setDraggingId(null)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggingId(null)

    // Compact the layout after dragging
    const compactedLayout = compactLayout()
    setLayout(compactedLayout)

    if (onLayoutChange) {
      onLayoutChange(compactedLayout)
    }
  }

  // Calculate grid styles
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridAutoRows: `${rowHeight}px`,
    gap: `${gap}px`,
    position: "relative" as const,
  }

  return (
    <div className={`grid-layout ${className}`} style={gridStyle}>
      <AnimatePresence>
        {layout.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              gridColumn: `span ${item.w}`,
              gridRow: item.collapsed ? "span 1" : `span ${item.h}`,
              zIndex: draggingId === item.id || resizingId === item.id ? 10 : 1,
            }}
            className="grid-item"
            draggable={!item.static}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
          >
            {item.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
