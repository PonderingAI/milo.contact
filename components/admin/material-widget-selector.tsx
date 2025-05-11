"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { getAllWidgetDefinitions, type WidgetType } from "./widget-registry"
import { useGrid } from "./grid-context"

interface MaterialWidgetSelectorProps {
  onAddWidget?: (widgetType: WidgetType) => void
}

export function MaterialWidgetSelector({ onAddWidget }: MaterialWidgetSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { addItem } = useGrid()

  const widgetDefinitions = getAllWidgetDefinitions()

  const filteredWidgets = widgetDefinitions.filter(
    (widget) =>
      widget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddWidget = (widgetType: WidgetType) => {
    const definition = widgetDefinitions.find((w) => w.id === widgetType)

    if (definition) {
      addItem({
        id: `${widgetType}-${Date.now()}`,
        type: widgetType,
        w: definition.defaultSize.w,
        h: definition.defaultSize.h,
      })

      if (onAddWidget) {
        onAddWidget(widgetType)
      }

      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search widgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredWidgets.map((widget) => (
              <div
                key={widget.id}
                className="border rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleAddWidget(widget.id)}
              >
                <div className="flex items-center mb-2">
                  <div className="mr-2 p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">{widget.icon}</div>
                  <h3 className="font-medium">{widget.title}</h3>
                </div>
                <p className="text-sm text-gray-500">{widget.description}</p>
              </div>
            ))}
            {filteredWidgets.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-500">No widgets found matching "{searchTerm}"</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
