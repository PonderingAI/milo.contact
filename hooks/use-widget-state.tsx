"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import type { WidgetPosition } from "@/components/admin/material-widget-container"

export interface Widget {
  id: string
  title: string
  content: React.ReactNode
  position: WidgetPosition
  minWidth?: number
  minHeight?: number
  isCollapsed?: boolean
}

interface UseWidgetStateOptions {
  initialWidgets: Widget[]
  storageKey?: string
  saveToLocalStorage?: boolean
}

export function useWidgetState({
  initialWidgets,
  storageKey = "widget-state",
  saveToLocalStorage = true,
}: UseWidgetStateOptions) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets)
  const [isLoaded, setIsLoaded] = useState(false)

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
              ? {
                  ...widget,
                  position: savedWidget.position,
                  isCollapsed: savedWidget.isCollapsed,
                }
              : widget
          })
          setWidgets(mergedWidgets)
        } catch (error) {
          console.error("Failed to parse saved widgets:", error)
          setWidgets(initialWidgets)
        }
      } else {
        setWidgets(initialWidgets)
      }
      setIsLoaded(true)
    } else {
      setWidgets(initialWidgets)
      setIsLoaded(true)
    }
  }, [initialWidgets, saveToLocalStorage, storageKey])

  // Update widget position
  const updateWidgetPosition = useCallback(
    (id: string, position: WidgetPosition) => {
      setWidgets((prevWidgets) => {
        const updatedWidgets = prevWidgets.map((widget) => (widget.id === id ? { ...widget, position } : widget))

        // Save to localStorage if enabled
        if (saveToLocalStorage && typeof window !== "undefined") {
          const dataToSave = updatedWidgets.map(({ id, position, isCollapsed }) => ({
            id,
            position,
            isCollapsed,
          }))
          localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        }

        return updatedWidgets
      })
    },
    [saveToLocalStorage, storageKey],
  )

  // Toggle widget collapse state
  const toggleWidgetCollapse = useCallback(
    (id: string, isCollapsed: boolean) => {
      setWidgets((prevWidgets) => {
        const updatedWidgets = prevWidgets.map((widget) => (widget.id === id ? { ...widget, isCollapsed } : widget))

        // Save to localStorage if enabled
        if (saveToLocalStorage && typeof window !== "undefined") {
          const dataToSave = updatedWidgets.map(({ id, position, isCollapsed }) => ({
            id,
            position,
            isCollapsed,
          }))
          localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        }

        return updatedWidgets
      })
    },
    [saveToLocalStorage, storageKey],
  )

  // Add a new widget
  const addWidget = useCallback(
    (widget: Widget) => {
      setWidgets((prevWidgets) => {
        const updatedWidgets = [...prevWidgets, widget]

        // Save to localStorage if enabled
        if (saveToLocalStorage && typeof window !== "undefined") {
          const dataToSave = updatedWidgets.map(({ id, position, isCollapsed }) => ({
            id,
            position,
            isCollapsed,
          }))
          localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        }

        return updatedWidgets
      })
    },
    [saveToLocalStorage, storageKey],
  )

  // Remove a widget
  const removeWidget = useCallback(
    (id: string) => {
      setWidgets((prevWidgets) => {
        const updatedWidgets = prevWidgets.filter((widget) => widget.id !== id)

        // Save to localStorage if enabled
        if (saveToLocalStorage && typeof window !== "undefined") {
          const dataToSave = updatedWidgets.map(({ id, position, isCollapsed }) => ({
            id,
            position,
            isCollapsed,
          }))
          localStorage.setItem(storageKey, JSON.stringify(dataToSave))
        }

        return updatedWidgets
      })
    },
    [saveToLocalStorage, storageKey],
  )

  // Update widget content
  const updateWidgetContent = useCallback((id: string, content: React.ReactNode) => {
    setWidgets((prevWidgets) => {
      const updatedWidgets = prevWidgets.map((widget) => (widget.id === id ? { ...widget, content } : widget))
      return updatedWidgets
    })
  }, [])

  // Reset to initial state
  const resetWidgets = useCallback(() => {
    setWidgets(initialWidgets)
    if (saveToLocalStorage && typeof window !== "undefined") {
      localStorage.removeItem(storageKey)
    }
  }, [initialWidgets, saveToLocalStorage, storageKey])

  return {
    widgets,
    isLoaded,
    updateWidgetPosition,
    toggleWidgetCollapse,
    addWidget,
    removeWidget,
    updateWidgetContent,
    resetWidgets,
  }
}
