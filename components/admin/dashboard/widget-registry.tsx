import { ChartWidget } from "./widgets/chart-widget"
import type { WidgetDefinition } from "./widget-container"

// Sample data for widgets
const sampleChartData = [
  { name: "Jan", value: 400, secondValue: 240 },
  { name: "Feb", value: 300, secondValue: 139 },
  { name: "Mar", value: 200, secondValue: 980 },
  { name: "Apr", value: 278, secondValue: 390 },
  { name: "May", value: 189, secondValue: 480 },
  { name: "Jun", value: 239, secondValue: 380 },
  { name: "Jul", value: 349, secondValue: 430 },
]

const sampleTableData = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Inactive" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Active" },
]

// Define available widgets
export const availableWidgets: WidgetDefinition[] = [
  {
    type: "chart",
    title: "Chart",
    description: "Display data in a chart format",
    category: "Data Visualization",
    component: (props: any) => (
      <ChartWidget
        title={props.title || "Data Chart"}
        data={props.data || sampleChartData}
        type={props.type || "line"}
        colors={props.colors || ["#3b82f6", "#10b981"]}
      />
    ),
    defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "Data Chart",
      data: sampleChartData,
      type: "line",
    },
  },
  {
    type: "bar-chart",
    title: "Bar Chart",
    description: "Display data in a bar chart format",
    category: "Data Visualization",
    component: (props: any) => (
      <ChartWidget
        title={props.title || "Bar Chart"}
        data={props.data || sampleChartData}
        type="bar"
        colors={props.colors || ["#f59e0b", "#ef4444"]}
      />
    ),
    defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "Bar Chart",
      data: sampleChartData,
    },
  },
  {
    type: "area-chart",
    title: "Area Chart",
    description: "Display data in an area chart format",
    category: "Data Visualization",
    component: (props: any) => (
      <ChartWidget
        title={props.title || "Area Chart"}
        data={props.data || sampleChartData}
        type="area"
        colors={props.colors || ["#8b5cf6", "#ec4899"]}
      />
    ),
    defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "Area Chart",
      data: sampleChartData,
    },
  },
  {
    type: "stats",
    title: "Stats",
    description: "Display key statistics",
    category: "Data",
    component: (props: any) => (
      <div className="flex flex-col h-full justify-center items-center">
        <h3 className="text-lg font-medium mb-2">{props.title || "Statistics"}</h3>
        <div className="text-4xl font-bold">{props.value || "1,234"}</div>
        <p className="text-sm text-gray-500 mt-2">{props.description || "Total users"}</p>
      </div>
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Statistics",
      value: "1,234",
      description: "Total users",
    },
  },
]

// Default widgets for the dashboard
export const defaultWidgets = [
  {
    id: "widget-1",
    type: "chart",
    title: "User Growth",
    size: { w: 6, h: 4 },
    position: { x: 0, y: 0 },
    props: {
      title: "User Growth",
      data: sampleChartData,
      type: "line",
    },
  },
  {
    id: "widget-2",
    type: "bar-chart",
    title: "Monthly Revenue",
    size: { w: 6, h: 4 },
    position: { x: 6, y: 0 },
    props: {
      title: "Monthly Revenue",
      data: sampleChartData,
    },
  },
  {
    id: "widget-3",
    type: "stats",
    title: "Total Users",
    size: { w: 3, h: 2 },
    position: { x: 0, y: 4 },
    props: {
      title: "Total Users",
      value: "1,234",
      description: "Active accounts",
    },
  },
  {
    id: "widget-4",
    type: "stats",
    title: "Revenue",
    size: { w: 3, h: 2 },
    position: { x: 3, y: 4 },
    props: {
      title: "Revenue",
      value: "$12,345",
      description: "Monthly income",
    },
  },
]
