import { StatsWidget } from "./widgets/stats-widget"
import { ChartWidget } from "./widgets/chart-widget"
import { TableWidget } from "./widgets/table-widget"
import { Users, Activity, FileText, CreditCard, Package } from "lucide-react"
import type { WidgetDefinition } from "./widget-container"

// Sample data for widgets
const sampleChartData = [
  { name: "Jan", value: 400, value2: 240 },
  { name: "Feb", value: 300, value2: 139 },
  { name: "Mar", value: 200, value2: 980 },
  { name: "Apr", value: 278, value2: 390 },
  { name: "May", value: 189, value2: 480 },
  { name: "Jun", value: 239, value2: 380 },
  { name: "Jul", value: 349, value2: 430 },
]

const sampleTableData = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Inactive" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Active" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "Pending" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", status: "Active" },
]

// Define all available widgets
export const widgetRegistry: WidgetDefinition[] = [
  // Stats widgets
  {
    type: "stats-users",
    title: "Total Users",
    description: "Display the total number of users",
    category: "statistics",
    component: StatsWidget,
    defaultSize: { w: 3, h: 1, minW: 2, minH: 1, maxW: 4, maxH: 2 },
    defaultProps: {
      title: "Total Users",
      value: 1234,
      previousValue: 1100,
      icon: <Users className="h-4 w-4" />,
    },
  },
  {
    type: "stats-projects",
    title: "Total Projects",
    description: "Display the total number of projects",
    category: "statistics",
    component: StatsWidget,
    defaultSize: { w: 3, h: 1, minW: 2, minH: 1, maxW: 4, maxH: 2 },
    defaultProps: {
      title: "Total Projects",
      value: 48,
      previousValue: 42,
      icon: <FileText className="h-4 w-4" />,
    },
  },
  {
    type: "stats-media",
    title: "Media Files",
    description: "Display the total number of media files",
    category: "statistics",
    component: StatsWidget,
    defaultSize: { w: 3, h: 1, minW: 2, minH: 1, maxW: 4, maxH: 2 },
    defaultProps: {
      title: "Media Files",
      value: 567,
      previousValue: 489,
      icon: <Package className="h-4 w-4" />,
    },
  },
  {
    type: "stats-storage",
    title: "Storage Used",
    description: "Display the total storage used",
    category: "statistics",
    component: StatsWidget,
    defaultSize: { w: 3, h: 1, minW: 2, minH: 1, maxW: 4, maxH: 2 },
    defaultProps: {
      title: "Storage Used",
      value: 2.4,
      previousValue: 1.8,
      suffix: " GB",
      icon: <CreditCard className="h-4 w-4" />,
    },
  },

  // Chart widgets
  {
    type: "chart-users",
    title: "User Growth",
    description: "Chart showing user growth over time",
    category: "charts",
    component: ChartWidget,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 2, maxW: 12, maxH: 6 },
    defaultProps: {
      title: "User Growth",
      data: sampleChartData,
      type: "line",
      dataKey: "value",
    },
  },
  {
    type: "chart-projects",
    title: "Projects by Month",
    description: "Chart showing projects created by month",
    category: "charts",
    component: ChartWidget,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 2, maxW: 12, maxH: 6 },
    defaultProps: {
      title: "Projects by Month",
      data: sampleChartData,
      type: "bar",
      dataKey: "value",
    },
  },
  {
    type: "chart-comparison",
    title: "Comparison Chart",
    description: "Chart comparing multiple metrics",
    category: "charts",
    component: ChartWidget,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 2, maxW: 12, maxH: 6 },
    defaultProps: {
      title: "Comparison Chart",
      data: sampleChartData,
      type: "line",
    },
  },

  // Table widgets
  {
    type: "table-users",
    title: "Recent Users",
    description: "Table showing recent users",
    category: "tables",
    component: TableWidget,
    defaultSize: { w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 8 },
    defaultProps: {
      title: "Recent Users",
      data: sampleTableData,
      columns: [
        { key: "id", title: "ID" },
        { key: "name", title: "Name" },
        { key: "email", title: "Email" },
        { key: "status", title: "Status" },
      ],
    },
  },
  {
    type: "table-projects",
    title: "Recent Projects",
    description: "Table showing recent projects",
    category: "tables",
    component: TableWidget,
    defaultSize: { w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 8 },
    defaultProps: {
      title: "Recent Projects",
      data: [
        { id: 1, title: "Website Redesign", category: "Web Design", status: "In Progress" },
        { id: 2, title: "Mobile App", category: "Development", status: "Completed" },
        { id: 3, title: "Marketing Campaign", category: "Marketing", status: "Planned" },
        { id: 4, title: "E-commerce Platform", category: "Development", status: "In Progress" },
        { id: 5, title: "Brand Identity", category: "Design", status: "Completed" },
      ],
      columns: [
        { key: "id", title: "ID" },
        { key: "title", title: "Title" },
        { key: "category", title: "Category" },
        { key: "status", title: "Status" },
      ],
    },
  },

  // Security widgets
  {
    type: "security-overview",
    title: "Security Overview",
    description: "Overview of security status",
    category: "security",
    component: StatsWidget,
    defaultSize: { w: 3, h: 1, minW: 2, minH: 1, maxW: 4, maxH: 2 },
    defaultProps: {
      title: "Security Score",
      value: 92,
      suffix: "%",
      previousValue: 88,
      icon: <Activity className="h-4 w-4" />,
    },
  },
  {
    type: "security-issues",
    title: "Security Issues",
    description: "Table of security issues",
    category: "security",
    component: TableWidget,
    defaultSize: { w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 8 },
    defaultProps: {
      title: "Security Issues",
      data: [
        { id: 1, issue: "Outdated Dependency", severity: "High", status: "Open" },
        { id: 2, issue: "Missing Authentication", severity: "Medium", status: "Fixed" },
        { id: 3, issue: "Insecure API Endpoint", severity: "High", status: "In Progress" },
        { id: 4, issue: "Weak Password Policy", severity: "Low", status: "Open" },
        { id: 5, issue: "Unencrypted Data", severity: "Medium", status: "Fixed" },
      ],
      columns: [
        { key: "id", title: "ID" },
        { key: "issue", title: "Issue" },
        { key: "severity", title: "Severity" },
        { key: "status", title: "Status" },
      ],
    },
  },
]

// Default widgets for new dashboard
export const defaultDashboardWidgets = [
  {
    id: "widget-1",
    type: "stats-users",
    title: "Total Users",
    size: { w: 3, h: 1 },
    position: { x: 0, y: 0 },
    props: {
      title: "Total Users",
      value: 1234,
      previousValue: 1100,
      icon: <Users className="h-4 w-4" />,
    },
  },
  {
    id: "widget-2",
    type: "stats-projects",
    title: "Total Projects",
    size: { w: 3, h: 1 },
    position: { x: 3, y: 0 },
    props: {
      title: "Total Projects",
      value: 48,
      previousValue: 42,
      icon: <FileText className="h-4 w-4" />,
    },
  },
  {
    id: "widget-3",
    type: "stats-media",
    title: "Media Files",
    size: { w: 3, h: 1 },
    position: { x: 6, y: 0 },
    props: {
      title: "Media Files",
      value: 567,
      previousValue: 489,
      icon: <Package className="h-4 w-4" />,
    },
  },
  {
    id: "widget-4",
    type: "stats-storage",
    title: "Storage Used",
    size: { w: 3, h: 1 },
    position: { x: 9, y: 0 },
    props: {
      title: "Storage Used",
      value: 2.4,
      previousValue: 1.8,
      suffix: " GB",
      icon: <CreditCard className="h-4 w-4" />,
    },
  },
  {
    id: "widget-5",
    type: "chart-users",
    title: "User Growth",
    size: { w: 6, h: 3 },
    position: { x: 0, y: 1 },
    props: {
      title: "User Growth",
      data: sampleChartData,
      type: "line",
      dataKey: "value",
    },
  },
  {
    id: "widget-6",
    type: "chart-projects",
    title: "Projects by Month",
    size: { w: 6, h: 3 },
    position: { x: 6, y: 1 },
    props: {
      title: "Projects by Month",
      data: sampleChartData,
      type: "bar",
      dataKey: "value",
    },
  },
  {
    id: "widget-7",
    type: "table-users",
    title: "Recent Users",
    size: { w: 6, h: 4 },
    position: { x: 0, y: 4 },
    props: {
      title: "Recent Users",
      data: sampleTableData,
      columns: [
        { key: "id", title: "ID" },
        { key: "name", title: "Name" },
        { key: "email", title: "Email" },
        { key: "status", title: "Status" },
      ],
    },
  },
  {
    id: "widget-8",
    type: "security-issues",
    title: "Security Issues",
    size: { w: 6, h: 4 },
    position: { x: 6, y: 4 },
    props: {
      title: "Security Issues",
      data: [
        { id: 1, issue: "Outdated Dependency", severity: "High", status: "Open" },
        { id: 2, issue: "Missing Authentication", severity: "Medium", status: "Fixed" },
        { id: 3, issue: "Insecure API Endpoint", severity: "High", status: "In Progress" },
        { id: 4, issue: "Weak Password Policy", severity: "Low", status: "Open" },
        { id: 5, issue: "Unencrypted Data", severity: "Medium", status: "Fixed" },
      ],
      columns: [
        { key: "id", title: "ID" },
        { key: "issue", title: "Issue" },
        { key: "severity", title: "Severity" },
        { key: "status", title: "Status" },
      ],
    },
  },
]
