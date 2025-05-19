"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface ChartWidgetProps {
  title?: string
  data: any[]
  type?: "line" | "bar" | "area"
  colors?: string[]
}

export function ChartWidget({ title, data, type = "line", colors = ["#10b981", "#3b82f6"] }: ChartWidgetProps) {
  const [chartType, setChartType] = useState(type)

  // Get all keys except 'name' for rendering multiple lines/bars
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== "name")

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType("line")}
            className={`px-2 py-1 text-xs rounded ${
              chartType === "line" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-2 py-1 text-xs rounded ${
              chartType === "bar" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`px-2 py-1 text-xs rounded ${
              chartType === "area" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Area
          </button>
        </div>
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: "#333", border: "none" }} labelStyle={{ color: "#fff" }} />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: "#333", border: "none" }} labelStyle={{ color: "#fff" }} />
              {dataKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: "#333", border: "none" }} labelStyle={{ color: "#fff" }} />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={`${colors[index % colors.length]}33`}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
