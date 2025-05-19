"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Trash2, FileText, X } from "lucide-react"

interface DatabaseTableManagerProps {
  tables: string[]
  selectedTables: string[]
  onTableSelection: (tableName: string, checked: boolean) => void
  onGenerateSelect: () => void
  onGenerateDrop: () => void
  onGenerateTruncate: () => void
}

export function DatabaseTableManager({
  tables,
  selectedTables,
  onTableSelection,
  onGenerateSelect,
  onGenerateDrop,
  onGenerateTruncate,
}: DatabaseTableManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectAll, setSelectAll] = useState(false)

  // Filter tables based on search query
  const filteredTables = tables.filter((table) => table.toLowerCase().includes(searchQuery.toLowerCase()))

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)

    if (checked) {
      // Select all filtered tables
      const newSelection = [...selectedTables]
      filteredTables.forEach((table) => {
        if (!newSelection.includes(table)) {
          newSelection.push(table)
        }
      })
      // Update selected tables through the parent component
      filteredTables.forEach((table) => {
        if (!selectedTables.includes(table)) {
          onTableSelection(table, true)
        }
      })
    } else {
      // Deselect all filtered tables
      filteredTables.forEach((table) => {
        if (selectedTables.includes(table)) {
          onTableSelection(table, false)
        }
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search tables..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {selectedTables.length > 0 && (
        <div className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
          <span className="text-sm">{selectedTables.length} table(s) selected</span>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={onGenerateSelect}>
              <FileText className="h-4 w-4 mr-2" />
              Select
            </Button>
            <Button size="sm" variant="outline" onClick={onGenerateTruncate}>
              <X className="h-4 w-4 mr-2" />
              Truncate
            </Button>
            <Button size="sm" variant="destructive" onClick={onGenerateDrop}>
              <Trash2 className="h-4 w-4 mr-2" />
              Drop
            </Button>
          </div>
        </div>
      )}

      {filteredTables.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? "No tables match your search" : "No tables found"}
        </div>
      ) : (
        <div className="border border-gray-700 rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredTables.length > 0 && filteredTables.every((table) => selectedTables.includes(table))
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all tables"
                  />
                </TableHead>
                <TableHead>Table Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTables.map((table) => (
                <TableRow key={table}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTables.includes(table)}
                      onCheckedChange={(checked) => onTableSelection(table, checked === true)}
                      aria-label={`Select ${table}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{table}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
