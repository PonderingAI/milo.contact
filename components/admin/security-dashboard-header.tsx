"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SecurityDashboardHeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  refreshData: () => void
  isLoading: boolean
  filters: {
    showDev: boolean
    showPeer: boolean
    showOptional: boolean
  }
  setFilters: (filters: any) => void
}

export function SecurityDashboardHeader({
  activeTab,
  setActiveTab,
  refreshData,
  isLoading,
  filters,
  setFilters,
}: SecurityDashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
      <h1 className="text-2xl font-bold">Security Dashboard</h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">
              Overview
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="flex-1 sm:flex-none">
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="audits" className="flex-1 sm:flex-none">
              Audits
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filters.showDev}
                onCheckedChange={(checked) => setFilters({ ...filters, showDev: checked })}
              >
                Show Dev Dependencies
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showPeer}
                onCheckedChange={(checked) => setFilters({ ...filters, showPeer: checked })}
              >
                Show Peer Dependencies
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showOptional}
                onCheckedChange={(checked) => setFilters({ ...filters, showOptional: checked })}
              >
                Show Optional Dependencies
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading} className="h-8">
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
