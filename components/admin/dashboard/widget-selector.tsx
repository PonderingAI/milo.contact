"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import type { WidgetDefinition } from "./widget-container"

interface WidgetSelectorProps {
  open: boolean
  onClose: () => void
  widgets: WidgetDefinition[]
  onSelectWidget: (widgetType: string) => void
}

export function WidgetSelector({ open, onClose, widgets, onSelectWidget }: WidgetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetDefinition[]>(widgets)
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")

  // Get unique categories
  useEffect(() => {
    const uniqueCategories = Array.from(new Set(widgets.map((widget) => widget.category)))
    setCategories(uniqueCategories)
  }, [widgets])

  // Filter widgets based on search term and category
  useEffect(() => {
    let filtered = widgets

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (widget) =>
          widget.title.toLowerCase().includes(term) ||
          widget.description.toLowerCase().includes(term) ||
          widget.category.toLowerCase().includes(term),
      )
    }

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter((widget) => widget.category === activeCategory)
    }

    setFilteredWidgets(filtered)
  }, [searchTerm, activeCategory, widgets])

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Tabs
          defaultValue="all"
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="flex-grow overflow-hidden flex flex-col"
        >
          <TabsList className="mb-4 flex flex-wrap h-auto">
            <TabsTrigger value="all" className="rounded-full">
              All
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="rounded-full">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2">
            {filteredWidgets.map((widget) => (
              <div
                key={widget.type}
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onSelectWidget(widget.type)}
              >
                <h3 className="font-medium mb-1">{widget.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</p>
              </div>
            ))}
            {filteredWidgets.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No widgets found. Try a different search term or category.
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
