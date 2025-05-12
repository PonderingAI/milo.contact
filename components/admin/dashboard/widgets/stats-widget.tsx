"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"

interface StatsWidgetProps {
  title?: string
  value?: number
  previousValue?: number
  icon?: React.ReactNode
  prefix?: string
  suffix?: string
  loading?: boolean
}

export function StatsWidget({
  title = "Total Users",
  value,
  previousValue,
  icon = <Activity className="h-4 w-4" />,
  prefix = "",
  suffix = "",
  loading = false,
}: StatsWidgetProps) {
  const [currentValue, setCurrentValue] = useState(value || 0)
  const [isLoading, setIsLoading] = useState(loading)

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value)
      setIsLoading(false)
    }
  }, [value])

  // Calculate percentage change
  const calculateChange = () => {
    if (!previousValue) return 0
    return ((currentValue - previousValue) / previousValue) * 100
  }

  const percentChange = calculateChange()
  const isPositive = percentChange >= 0

  return (
    <div className="h-full w-full">
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">{icon}</div>
          </div>

          {isLoading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <div className="text-3xl font-bold">
              {prefix}
              {currentValue.toLocaleString()}
              {suffix}
            </div>
          )}

          {previousValue && (
            <div className="mt-2 flex items-center">
              <div className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                <span className="text-sm font-medium">{Math.abs(percentChange).toFixed(1)}%</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">vs previous period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
