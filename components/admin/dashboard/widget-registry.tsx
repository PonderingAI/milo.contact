import { ChartWidget } from "./widgets/chart-widget"
import { ProjectStatsWidget } from "./widgets/project-stats-widget"
import { RealTimeStatsWidget } from "./widgets/real-time-stats-widget"
import { SecurityOverviewWidget } from "./widgets/security-overview-widget"
import { SystemActivityWidget } from "./widgets/system-activity-widget"
import { GlobalUpdatePolicyWidget } from "./widgets/global-update-policy-widget"
import { SecurityWidget } from "@/components/admin/security-widgets"
import { 
  Users, 
  FileText, 
  HardDrive, 
  Shield, 
  CreditCard, 
  Activity,
  AlertTriangle,
  Package,
  Settings,
  History,
  TrendingUp,
  BarChart3
} from "lucide-react"
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
  // === ANALYTICS & CHARTS ===
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

  // === REAL-TIME STATISTICS ===
  {
    type: "projects-stats-live",
    title: "Live Project Stats",
    description: "Real-time project statistics with trend data",
    category: "Statistics",
    component: (props: any) => (
      <RealTimeStatsWidget
        title={props.title}
        metric="projects"
        icon={<FileText className="h-4 w-4" />}
      />
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Projects",
    },
  },
  {
    type: "media-stats-live",
    title: "Live Media Stats",
    description: "Real-time media file statistics",
    category: "Statistics",
    component: (props: any) => (
      <RealTimeStatsWidget
        title={props.title}
        metric="media"
        icon={<HardDrive className="h-4 w-4" />}
      />
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Media Files",
    },
  },
  {
    type: "storage-stats-live",
    title: "Live Storage Stats",
    description: "Real-time storage usage statistics",
    category: "Statistics",
    component: (props: any) => (
      <RealTimeStatsWidget
        title={props.title}
        metric="storage"
        icon={<HardDrive className="h-4 w-4" />}
      />
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Storage Usage",
    },
  },
  {
    type: "dependencies-stats-live",
    title: "Live Dependencies",
    description: "Real-time dependency statistics",
    category: "Statistics",
    component: (props: any) => (
      <RealTimeStatsWidget
        title={props.title}
        metric="dependencies"
        icon={<Package className="h-4 w-4" />}
      />
    ),
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      title: "Dependencies",
    },
  },

  // === PROJECT INSIGHTS ===
  {
    type: "project-overview",
    title: "Project Overview",
    description: "Detailed project statistics and insights",
    category: "Projects",
    component: (props: any) => (
      <ProjectStatsWidget title={props.title} />
    ),
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    defaultProps: {
      title: "Project Overview",
    },
  },

  // === DEPENDENCY MANAGEMENT ===
  {
    type: "global-update-policy",
    title: "Global Update Policy",
    description: "Manage global dependency update policy and settings",
    category: "Dependencies",
    component: (props: any) => (
      <GlobalUpdatePolicyWidget
        title={props.title}
      />
    ),
    defaultSize: { w: 3, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "Global Update Policy",
    },
  },

  // === SECURITY WIDGETS ===
  {
    type: "security-overview",
    title: "Security Overview",
    description: "Complete security status overview",
    category: "Security",
    component: (props: any) => (
      <SecurityOverviewWidget
        title={props.title}
        showActions={props.showActions}
      />
    ),
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    defaultProps: {
      title: "Security Overview",
      showActions: true,
    },
  },
  {
    type: "security-score",
    title: "Security Score",
    description: "Overall security rating of your application",
    category: "Security",
    component: (props: any) => {
      // Create mock security stats for the SecurityWidget
      const mockSecurityStats = {
        securityScore: props.securityScore || 92,
        vulnerabilities: props.vulnerabilities || 0,
        dependabotAlerts: props.dependabotAlerts || 0,
        outdatedPackages: props.outdatedPackages || 3,
        lastScan: props.lastScan || new Date().toLocaleDateString()
      }
      
      return (
        <SecurityWidget
          type="security-score"
          id={props.id || "security-score"}
          securityStats={mockSecurityStats}
          dependencies={[]}
          updateResults={[]}
          globalUpdateMode="conservative"
          globalDependenciesCount={0}
          dependabotAlertCount={0}
          setActiveTab={() => {}}
          setFilter={() => {}}
          updateGlobalMode={() => {}}
          resetAllSettings={() => {}}
          runSecurityAudit={() => {}}
          auditRunning={false}
          applyChanges={() => {}}
          handleAddWidget={() => {}}
        />
      )
    },
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      securityScore: 92,
    },
  },
  {
    type: "vulnerabilities",
    title: "Vulnerabilities",
    description: "Known security issues in your dependencies",
    category: "Security",
    component: (props: any) => {
      const mockSecurityStats = {
        securityScore: 92,
        vulnerabilities: props.vulnerabilities || 0,
        dependabotAlerts: 0,
        outdatedPackages: 3,
        lastScan: new Date().toLocaleDateString()
      }
      
      return (
        <SecurityWidget
          type="vulnerabilities"
          id={props.id || "vulnerabilities"}
          securityStats={mockSecurityStats}
          dependencies={[]}
          updateResults={[]}
          globalUpdateMode="conservative"
          globalDependenciesCount={0}
          dependabotAlertCount={0}
          setActiveTab={() => {}}
          setFilter={() => {}}
          updateGlobalMode={() => {}}
          resetAllSettings={() => {}}
          runSecurityAudit={() => {}}
          auditRunning={false}
          applyChanges={() => {}}
          handleAddWidget={() => {}}
        />
      )
    },
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    defaultProps: {
      vulnerabilities: 0,
    },
  },
  {
    type: "dependabot-alerts",
    title: "Dependabot Alerts",
    description: "GitHub Dependabot security alerts",
    category: "Security",
    component: (props: any) => {
      const mockSecurityStats = {
        securityScore: 92,
        vulnerabilities: 0,
        dependabotAlerts: props.dependabotAlerts || 0,
        outdatedPackages: 3,
        lastScan: new Date().toLocaleDateString()
      }
      
      return (
        <SecurityWidget
          type="dependabot-alerts"
          id={props.id || "dependabot-alerts"}
          securityStats={mockSecurityStats}
          dependencies={[]}
          updateResults={[]}
          globalUpdateMode="conservative"
          globalDependenciesCount={0}
          dependabotAlertCount={props.dependabotAlerts || 0}
          setActiveTab={() => {}}
          setFilter={() => {}}
          updateGlobalMode={() => {}}
          resetAllSettings={() => {}}
          runSecurityAudit={() => {}}
          auditRunning={false}
          applyChanges={() => {}}
          handleAddWidget={() => {}}
        />
      )
    },
    defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
    defaultProps: {
      dependabotAlerts: 0,
    },
  },

  // === SYSTEM MONITORING ===
  {
    type: "system-activity",
    title: "System Activity",
    description: "Recent system activity and events",
    category: "System",
    component: (props: any) => (
      <SystemActivityWidget
        title={props.title}
        maxItems={props.maxItems}
      />
    ),
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultProps: {
      title: "Recent Activity",
      maxItems: 5,
    },
  },

  // === LEGACY WIDGETS (kept for compatibility but improved) ===
  {
    type: "users-stats",
    title: "Total Users",
    description: "Display total number of users (legacy)",
    category: "Legacy",
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
    description: "Display total revenue (legacy)",
    category: "Legacy",
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
]

// Default widgets for the dashboard
export const defaultWidgets: Widget[] = [
  {
    id: "widget-1",
    type: "projects-stats-live",
    title: "Projects",
    size: { w: 3, h: 2 },
    position: { x: 0, y: 0 },
    props: {
      title: "Projects",
    },
  },
  {
    id: "widget-2",
    type: "media-stats-live",
    title: "Media Files",
    size: { w: 3, h: 2 },
    position: { x: 3, y: 0 },
    props: {
      title: "Media Files",
    },
  },
  {
    id: "widget-3",
    type: "storage-stats-live",
    title: "Storage",
    size: { w: 3, h: 2 },
    position: { x: 6, y: 0 },
    props: {
      title: "Storage Usage",
    },
  },
  {
    id: "widget-4",
    type: "global-update-policy",
    title: "Global Update Policy",
    size: { w: 3, h: 4 },
    position: { x: 9, y: 0 },
    props: {
      title: "Global Update Policy",
    },
  },
  {
    id: "widget-5",
    type: "security-overview",
    title: "Security",
    size: { w: 3, h: 2 },
    position: { x: 0, y: 4 },
    props: {
      title: "Security Overview",
      showActions: true,
    },
  },
  {
    id: "widget-6",
    type: "project-overview",
    title: "Project Insights",
    size: { w: 6, h: 3 },
    position: { x: 3, y: 4 },
    props: {
      title: "Project Insights",
    },
  },
  {
    id: "widget-7",
    type: "system-activity",
    title: "Recent Activity",
    size: { w: 6, h: 3 },
    position: { x: 6, y: 2 },
    props: {
      title: "Recent Activity",
      maxItems: 5,
    },
  },
]
