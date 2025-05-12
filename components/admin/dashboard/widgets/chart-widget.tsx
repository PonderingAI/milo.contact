"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface ChartWidgetProps {
  title?: string
  data?: ChartData[]
  type?: "line" | "bar" | "area"
  dataKey?: string
  loading?: boolean
  colors?: string[]
  showGrid?: boolean
  height?: number
}

export function ChartWidget({
  title = "Chart",
  data = [],
  type = "line",
  dataKey = "value",
  loading = false,
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
  showGrid = true,
  height = 300,
}: ChartWidgetProps) {
  const [chartData, setChartData] = useState<ChartData[]>(data)
  const [chartType, setChartType] = useState(type)
  const [isLoading, setIsLoading] = useState(loading)

  useEffect(() => {
    if (data.length > 0) {
      setChartData(data)
      setIsLoading(false)
    }
  }, [data])

  // Get all data keys except 'name'
  const getDataKeys = () => {
    if (chartData.length === 0) return [dataKey]
    const keys = Object.keys(chartData[0]).filter((key) => key !== "name")
    return keys.length > 0 ? keys : [dataKey]
  }

  const dataKeys = getDataKeys()

  return (
    <div className="h-full w-full">
      <Card className="h-full">
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Tabs
            defaultValue={chartType}
            value={chartType}
            onValueChange={(value) => setChartType(value as "line" | "bar" | "area")}
            className="h-8"
          >
            <TabsList className="h-8 p-1">
              <TabsTrigger value="line" className="h-6 px-2 text-xs">
                Line
              </TabsTrigger>
              <TabsTrigger value="bar" className="h-6 px-2 text-xs">
                Bar
              </TabsTrigger>
              <TabsTrigger value="area" className="h-6 px-2 text-xs">
                Area
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0 pl-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="w-full h-[250px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          ) : (
            <div style={{ width: "100%", height }}>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        border: "none",
                        borderRadius: "4px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    {dataKeys.map((key, index) => (
                      <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        border: "none",
                        borderRadius: "4px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    {dataKeys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                        {...(chartType === "area" ? { fill: colors[index % colors.length], fillOpacity: 0.1 } : {})}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
