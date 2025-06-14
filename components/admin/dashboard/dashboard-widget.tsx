"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, GripVertical, Settings } from "lucide-react"
import type { Widget } from "./widget-container"
import { cn } from "@/lib/utils"

interface DashboardWidgetProps {
  widget: Widget
  children: React.ReactNode
  onRemove: (id: string) => void
  className?: string
  showRemoveButton?: boolean
  showSettings?: boolean
  onSettings?: (id: string) => void
}

export function DashboardWidget({
  widget,
  children,
  onRemove,
  className,
  showRemoveButton = true,
  showSettings = false,
  onSettings,
}: DashboardWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove(widget.id)
  }

  const handleSettings = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSettings?.(widget.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn("relative group h-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Widget Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            {widget.title}
          </CardTitle>
          
          {/* Widget Controls */}
          <div className={cn(
            "flex items-center gap-1 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            {showSettings && onSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettings}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Widget settings"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
            
            {showRemoveButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                title="Remove widget"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Widget Content */}
        <CardContent className="flex-1 p-4 overflow-hidden">
          <div className="h-full w-full">
            {children}
          </div>
        </CardContent>
      </Card>
      
      {/* Resize indicator for react-grid-layout */}
      <div className="absolute bottom-0 right-0 w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
        <svg
          className="w-full h-full text-gray-400"
          fill="currentColor"
          viewBox="0 0 6 6"
        >
          <path d="m5 5h-4v-4h4v4zm-3-3h2v2h-2v-2z" fillRule="evenodd" />
        </svg>
      </div>
    </motion.div>
  )
}