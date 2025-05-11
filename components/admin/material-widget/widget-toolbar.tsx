"use client"
import { useWidgetContext } from "./widget-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function WidgetToolbar() {
  const { isEditing, toggleEditMode, saveLayouts, updateMode, setUpdateMode, saveUpdateMode } = useWidgetContext()

  const handleSave = async () => {
    try {
      await saveLayouts()
      await saveUpdateMode()
      toggleEditMode()
    } catch (error) {
      console.error("Error saving dashboard:", error)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-medium">Dashboard</h2>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Update Mode:</span>
          <Select value={updateMode} onValueChange={(value) => setUpdateMode(value)} disabled={!isEditing}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select update mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="auto">Automatic</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="prompt">Prompt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={toggleEditMode}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Layout</Button>
          </>
        ) : (
          <Button onClick={toggleEditMode}>Edit Layout</Button>
        )}
      </div>
    </div>
  )
}
