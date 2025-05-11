"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface GridItem {
  id: string
  x: number
  y: number
  w: number
  h: number
  type: string
  data?: any
}

interface GridContextType {
  items: GridItem[]
  addItem: (item: Omit<GridItem, "x" | "y">) => void
  updateItem: (id: string, updates: Partial<GridItem>) => void
  removeItem: (id: string) => void
  moveItem: (id: string, x: number, y: number) => void
  resizeItem: (id: string, w: number, h: number) => void
  getNextPosition: (w: number, h: number) => { x: number; y: number }
  cols: number
  rowHeight: number
  containerWidth: number
  setContainerWidth: (width: number) => void
}

const GridContext = createContext<GridContextType | undefined>(undefined)

interface GridProviderProps {
  children: React.ReactNode
  initialItems?: GridItem[]
  cols?: number
  rowHeight?: number
  storageKey?: string
}

export const GridProvider: React.FC<GridProviderProps> = ({
  children,
  initialItems = [],
  cols = 12,
  rowHeight = 50,
  storageKey = "grid-layout",
}) => {
  const [items, setItems] = useState<GridItem[]>(initialItems)
  const [containerWidth, setContainerWidth] = useState(1200)

  // Load items from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      const savedItems = localStorage.getItem(storageKey)
      if (savedItems) {
        try {
          setItems(JSON.parse(savedItems))
        } catch (e) {
          console.error("Failed to parse saved grid items:", e)
        }
      }
    }
  }, [storageKey])

  // Save items to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey && items.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
  }, [items, storageKey])

  // Check if a position is valid (not occupied and within bounds)
  const isPositionValid = useCallback(
    (x: number, y: number, w: number, h: number, itemId?: string): boolean => {
      // Check bounds
      if (x < 0 || x + w > cols || y < 0) {
        return false
      }

      // Check collision with other items
      return !items.some(
        (item) => item.id !== itemId && x < item.x + item.w && x + w > item.x && y < item.y + item.h && y + h > item.y,
      )
    },
    [items, cols],
  )

  // Find the next available position for a new item
  const getNextPosition = useCallback(
    (w: number, h: number): { x: number; y: number } => {
      // Start from top-left
      let y = 0
      let maxAttempts = 1000 // Prevent infinite loop

      while (maxAttempts > 0) {
        for (let x = 0; x <= cols - w; x++) {
          if (isPositionValid(x, y, w, h)) {
            return { x, y }
          }
        }
        y++
        maxAttempts--
      }

      // If no position found, place at the bottom
      const maxY = items.reduce((max, item) => Math.max(max, item.y + item.h), 0)
      return { x: 0, y: maxY }
    },
    [isPositionValid, items, cols],
  )

  // Compact the layout (move items up if there's space)
  const compactLayout = useCallback(() => {
    // Sort items by y position
    const sortedItems = [...items].sort((a, b) => a.y - b.y)
    const newItems = [...sortedItems]

    for (let i = 0; i < newItems.length; i++) {
      const item = { ...newItems[i] }
      let y = item.y

      // Try to move the item up as far as possible
      while (y > 0 && isPositionValid(item.x, y - 1, item.w, item.h, item.id)) {
        y--
      }

      if (y !== item.y) {
        newItems[i] = { ...item, y }
      }
    }

    setItems(newItems)
  }, [items, isPositionValid])

  // Add a new item to the grid
  const addItem = useCallback(
    (item: Omit<GridItem, "x" | "y">) => {
      const position = getNextPosition(item.w, item.h)
      const newItem = { ...item, ...position }
      setItems((prev) => [...prev, newItem])

      // Compact after adding
      setTimeout(compactLayout, 50)
    },
    [getNextPosition, compactLayout],
  )

  // Update an existing item
  const updateItem = useCallback((id: string, updates: Partial<GridItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  // Remove an item from the grid
  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id))

      // Compact after removing
      setTimeout(compactLayout, 50)
    },
    [compactLayout],
  )

  // Move an item to a new position
  const moveItem = useCallback(
    (id: string, x: number, y: number) => {
      const item = items.find((i) => i.id === id)
      if (!item) return

      if (isPositionValid(x, y, item.w, item.h, id)) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, x, y } : item)))

        // Compact after moving
        setTimeout(compactLayout, 50)
      }
    },
    [items, isPositionValid, compactLayout],
  )

  // Resize an item
  const resizeItem = useCallback(
    (id: string, w: number, h: number) => {
      const item = items.find((i) => i.id === id)
      if (!item) return

      if (isPositionValid(item.x, item.y, w, h, id)) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, w, h } : item)))

        // Compact after resizing
        setTimeout(compactLayout, 50)
      }
    },
    [items, isPositionValid, compactLayout],
  )

  const value = {
    items,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    resizeItem,
    getNextPosition,
    cols,
    rowHeight,
    containerWidth,
    setContainerWidth,
  }

  return <GridContext.Provider value={value}>{children}</GridContext.Provider>
}

export const useGrid = () => {
  const context = useContext(GridContext)
  if (context === undefined) {
    throw new Error("useGrid must be used within a GridProvider")
  }
  return context
}
