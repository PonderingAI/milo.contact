"use client"

import { ArrowDown, ArrowUp, Grid, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Widget {
  id: string
  name: string
  type: string
  position: number
  enabled: boolean
  config?: any
}

interface DraggableWidgetProps {
  widget: Widget
  onToggle: () => void
  onMove?: (direction: "up" | "down") => void
  active: boolean
  readOnly?: boolean
}

export function DraggableWidget({ widget, onToggle, onMove, active, readOnly = false }: DraggableWidgetProps) {
  return (
    <div className={`flex items-center justify-between p-2 rounded ${active ? "bg-gray-700" : "bg-gray-900"}`}>
      <div className="flex items-center">
        <Grid className="h-4 w-4 mr-2 text-gray-400" />
        <span>{widget.name}</span>
      </div>

      <div className="flex items-center space-x-1">
        {active && onMove && !readOnly && (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove("up")} title="Move up">
              <ArrowUp className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove("down")} title="Move down">
              <ArrowDown className="h-4 w-4" />
            </Button>
          </>
        )}

        {!readOnly && (
          <Button
            variant={active ? "destructive" : "outline"}
            size="sm"
            className="h-7 px-2 flex items-center gap-1"
            onClick={onToggle}
          >
            {active ? (
              <>
                <Trash2 className="h-3 w-3" />
                <span className="text-xs">Remove</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                <span className="text-xs">Add</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
