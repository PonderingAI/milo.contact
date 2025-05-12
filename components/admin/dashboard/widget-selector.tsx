"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"
import type { WidgetDefinition } from "./widget-container"

interface WidgetSelectorProps {
  open: boolean
  onClose: () => void
  widgets: WidgetDefinition[]
  onSelectWidget: (widgetType: string) => void
}

export function WidgetSelector({ open, onClose, widgets, onSelectWidget }: WidgetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetDefinition[]>(widgets)

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(widgets.map((w) => w.category)))].sort()

  // Filter widgets based on search and category
  useEffect(() => {
    let filtered = widgets

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (w) =>
          w.title.toLowerCase().includes(term) ||
          w.description.toLowerCase().includes(term) ||
          w.category.toLowerCase().includes(term),
      )
    }

    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter((w) => w.category === activeCategory)
    }

    setFilteredWidgets(filtered)
  }, [searchTerm, activeCategory, widgets])

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
  }

  // Handle widget selection
  const handleSelectWidget = (widgetType: string) => {
    onSelectWidget(widgetType)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchTerm && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={clearSearch}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4 flex flex-wrap">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              {filteredWidgets.map((widget) => (
                <Button
                  key={widget.type}
                  variant="outline"
                  className="h-auto p-4 justify-start flex flex-col items-start text-left"
                  onClick={() => handleSelectWidget(widget.type)}
                >
                  <div className="font-medium mb-1">{widget.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 capitalize">{widget.category}</div>
                </Button>
              ))}

              {filteredWidgets.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">No widgets found matching your criteria</div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
