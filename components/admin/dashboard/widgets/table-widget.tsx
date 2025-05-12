"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface TableColumn {
  key: string
  title: string
  render?: (value: any, row: any) => React.ReactNode
}

interface TableWidgetProps {
  title?: string
  data?: any[]
  columns?: TableColumn[]
  loading?: boolean
  searchable?: boolean
  pagination?: boolean
  pageSize?: number
}

export function TableWidget({
  title = "Table",
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  pagination = true,
  pageSize = 5,
}: TableWidgetProps) {
  const [tableData, setTableData] = useState<any[]>(data)
  const [filteredData, setFilteredData] = useState<any[]>(data)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(loading)

  useEffect(() => {
    if (data.length > 0) {
      setTableData(data)
      setFilteredData(data)
      setIsLoading(false)
    }
  }, [data])

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(tableData)
      setCurrentPage(1)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = tableData.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(term)
      })
    })

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, tableData])

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = pagination ? filteredData.slice(startIndex, endIndex) : filteredData

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Generate default columns if none provided
  const getColumns = (): TableColumn[] => {
    if (columns.length > 0) return columns
    if (tableData.length === 0) return []

    return Object.keys(tableData[0]).map((key) => ({
      key,
      title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
    }))
  }

  const tableColumns = getColumns()

  return (
    <div className="h-full w-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="p-4 space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {searchable && (
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 w-full sm:w-[200px]"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableColumns.map((column) => (
                        <TableHead key={column.key}>{column.title}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {tableColumns.map((column) => (
                            <TableCell key={`${rowIndex}-${column.key}`}>
                              {column.render
                                ? column.render(row[column.key], row)
                                : row[column.key] !== undefined
                                  ? String(row[column.key])
                                  : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={tableColumns.length} className="text-center py-6">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {pagination && totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
