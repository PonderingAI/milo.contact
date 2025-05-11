"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { WidgetLayout } from "@/lib/grid-utils"

interface WidgetContextProps {
  layouts: WidgetLayout[]
  updateLayouts: (layouts: WidgetLayout[]) => void
  isEditing: boolean
  toggleEditMode: () => void
  saveLayouts: () => Promise<void>
  updateMode: string
  setUpdateMode: (mode: string) => void
  saveUpdateMode: () => Promise<void>
}

const WidgetContext = createContext<WidgetContextProps | undefined>(undefined)

interface WidgetProviderProps {
  children: React.ReactNode
  initialLayouts: WidgetLayout[]
  initialUpdateMode: string
}

export function WidgetProvider({ children, initialLayouts, initialUpdateMode }: WidgetProviderProps) {
  const [layouts, setLayouts] = useState<WidgetLayout[]>(initialLayouts)
  const [isEditing, setIsEditing] = useState(false)
  const [updateMode, setUpdateMode] = useState(initialUpdateMode)

  // Load layouts from localStorage on mount
  useEffect(() => {
    const savedLayouts = localStorage.getItem("widget-layouts")
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts))
      } catch (error) {
        console.error("Failed to parse saved layouts:", error)
      }
    }

    const savedUpdateMode = localStorage.getItem("update-mode")
    if (savedUpdateMode) {
      setUpdateMode(savedUpdateMode)
    }
  }, [])

  // Update layouts
  const updateLayouts = (newLayouts: WidgetLayout[]) => {
    setLayouts(newLayouts)
    localStorage.setItem("widget-layouts", JSON.stringify(newLayouts))
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  // Save layouts to the server
  const saveLayouts = async () => {
    try {
      const response = await fetch("/api/dependencies/save-layouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ layouts }),
      })

      if (!response.ok) {
        throw new Error("Failed to save layouts")
      }

      return await response.json()
    } catch (error) {
      console.error("Error saving layouts:", error)
      throw error
    }
  }

  // Save update mode to the server
  const saveUpdateMode = async () => {
    try {
      // Save to localStorage
      localStorage.setItem("update-mode", updateMode)

      // Save to server
      const response = await fetch("/api/dependencies/update-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: updateMode }),
      })

      if (!response.ok) {
        throw new Error("Failed to save update mode")
      }

      return await response.json()
    } catch (error) {
      console.error("Error saving update mode:", error)
      throw error
    }
  }

  return (
    <WidgetContext.Provider
      value={{
        layouts,
        updateLayouts,
        isEditing,
        toggleEditMode,
        saveLayouts,
        updateMode,
        setUpdateMode,
        saveUpdateMode,
      }}
    >
      {children}
    </WidgetContext.Provider>
  )
}

export function useWidgetContext() {
  const context = useContext(WidgetContext)
  if (context === undefined) {
    throw new Error("useWidgetContext must be used within a WidgetProvider")
  }
  return context
}
