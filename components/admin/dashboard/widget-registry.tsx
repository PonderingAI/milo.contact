import { ChartWidget } from "./widgets/chart-widget"
import { Users, FileText, HardDrive, Shield, CreditCard } from "lucide-react"
import type { WidgetDefinition, Widget } from "./widget-container"

// Sample data for widgets
const userGrowthData = [
  { name: "Jan", users: 400, target: 300 },
  { name: "Feb", users: 300, target: 350 },
  { name: "Mar", users: 500, target: 400 },
  { name: "Apr", users: 280, target: 450 },
  { name: "May", users: 590, target: 500 },
  { name: "Jun", users: 390, target: 550 },
  { name: "Jul", users: 490, target: 600 },
]

const revenueData = [
  { name: "Jan", amount: 4000 },
  { name: "Feb", amount: 3000 },
  { name: "Mar", amount: 5000 },
  { name: "Apr", amount: 2800 },
  { name: "May", amount: 5900 },
  { name: "Jun", amount: 3900 },
  { name: "Jul", amount: 4900 },
]

const storageData = [
  { name: "Images", size: 42 },
  { name: "Videos", size: 28 },
  { name: "Documents", size: 15 },
  { name: "Other", size: 15 },
]

// Define available widgets
export const availableWidgets: WidgetDefinition[] = [
  {
    type: "user-growth-chart",
    title: "User Growth",
    description: "Chart showing user growth over time",
    category: "Analytics",
    component: (props: any) => (
      <ChartWidget
        title={props.title || "User Growth"}
        data={props.data || userGrowthData}
        type={props.type || "line"}
        colors={props.colors || ["#10b981", "#3b82f6"]}
      />
    ),
    defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "User Growth",
      data: userGrowthData,
      type: "line",
    },
  },
  {
    type: "revenue-chart",
    title: "Monthly Revenue",
    description: "Chart showing monthly revenue",
    category: "Analytics",
    component: (props: any) => (
      <ChartWidget
        title={props.title || "Monthly Revenue"}
        data={props.data || revenueData}
        type={props.type || "bar"}
        colors={props.colors || ["#f59e0b"]}
      />
    ),
    defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "Monthly Revenue",
      data: revenueData,
      type: "bar",
    },
  },
  {
    type: "storage-chart",
    title: "Storage Usage",
    description: "Chart showing storage usage by category",
    category: "Analytics",
    component: (props: any) => (
      <ChartWidget
        title={props.title || "Storage Usage"}
        data={props.data || storageData}
        type={props.type || "bar"}
        colors={props.colors || ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
      />
    ),
    defaultSize: { w: 6, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "Storage Usage",
      data: storageData,
      type: "bar",
    },
  },
  {
    type: "users-stats",
    title: "Total Users",
    description: "Display total number of users",
    category: "Statistics",
    component: (props: any) => (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{props.title || "Total Users"}</span>
        </div>
        <div className="text-4xl font-bold text-primary">{props.value || "1,234"}</div>
        <p className="text-sm text-muted-foreground mt-2">{props.description || "Active accounts"}</p>
      </div>
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Total Users",
      value: "1,234",
      description: "Active accounts",
    },
  },
  {
    type: "revenue-stats",
    title: "Revenue",
    description: "Display total revenue",
    category: "Statistics",
    component: (props: any) => (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground mb-2 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span>{props.title || "Revenue"}</span>
        </div>
        <div className="text-4xl font-bold text-primary">{props.value || "$12,345"}</div>
        <p className="text-sm text-muted-foreground mt-2">{props.description || "Monthly income"}</p>
      </div>
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Revenue",
      value: "$12,345",
      description: "Monthly income",
    },
  },
  {
    type: "projects-stats",
    title: "Projects",
    description: "Display total number of projects",
    category: "Statistics",
    component: (props: any) => (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>{props.title || "Projects"}</span>
        </div>
        <div className="text-4xl font-bold text-primary">{props.value || "48"}</div>
        <p className="text-sm text-muted-foreground mt-2">{props.description || "Active projects"}</p>
      </div>
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Projects",
      value: "48",
      description: "Active projects",
    },
  },
  {
    type: "storage-stats",
    title: "Storage",
    description: "Display total storage used",
    category: "Statistics",
    component: (props: any) => (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground mb-2 flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          <span>{props.title || "Storage"}</span>
        </div>
        <div className="text-4xl font-bold text-primary">{props.value || "128 GB"}</div>
        <p className="text-sm text-muted-foreground mt-2">{props.description || "Total usage"}</p>
      </div>
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Storage",
      value: "128 GB",
      description: "Total usage",
    },
  },
  {
    type: "security-stats",
    title: "Security",
    description: "Display security score",
    category: "Statistics",
    component: (props: any) => (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground mb-2 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>{props.title || "Security"}</span>
        </div>
        <div className="text-4xl font-bold text-primary">{props.value || "92%"}</div>
        <p className="text-sm text-muted-foreground mt-2">{props.description || "Security score"}</p>
      </div>
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Security",
      value: "92%",
      description: "Security score",
    },
  },
]

// Default widgets for the dashboard
export const defaultWidgets: Widget[] = [
  {
    id: "widget-1",
    type: "users-stats",
    title: "Total Users",
    size: { w: 3, h: 2 },
    position: { x: 0, y: 0 },
    props: {
      title: "Total Users",
      value: "1,234",
      description: "Active accounts",
    },
  },
  {
    id: "widget-2",
    type: "revenue-stats",
    title: "Revenue",
    size: { w: 3, h: 2 },
    position: { x: 3, y: 0 },
    props: {
      title: "Revenue",
      value: "$12,345",
      description: "Monthly income",
    },
  },
  {
    id: "widget-3",
    type: "projects-stats",
    title: "Projects",
    size: { w: 3, h: 2 },
    position: { x: 6, y: 0 },
    props: {
      title: "Projects",
      value: "48",
      description: "Active projects",
    },
  },
  {
    id: "widget-4",
    type: "storage-stats",
    title: "Storage",
    size: { w: 3, h: 2 },
    position: { x: 9, y: 0 },
    props: {
      title: "Storage",
      value: "128 GB",
      description: "Total usage",
    },
  },
  {
    id: "widget-5",
    type: "user-growth-chart",
    title: "User Growth",
    size: { w: 6, h: 4 },
    position: { x: 0, y: 2 },
    props: {
      title: "User Growth",
      data: userGrowthData,
      type: "line",
    },
  },
  {
    id: "widget-6",
    type: "revenue-chart",
    title: "Monthly Revenue",
    size: { w: 6, h: 4 },
    position: { x: 6, y: 2 },
    props: {
      title: "Monthly Revenue",
      data: revenueData,
      type: "bar",
    },
  },
]
