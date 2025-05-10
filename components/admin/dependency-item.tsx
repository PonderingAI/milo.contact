import { Badge } from "@/components/ui/badge"

interface DependencyProps {
  dependency: {
    id: string
    name: string
    currentVersion: string
    latestVersion: string
    hasUpdate: boolean
    hasVulnerability: boolean
    type: "production" | "development"
  }
}

export default function DependencyItem({ dependency }: DependencyProps) {
  const { name, currentVersion, latestVersion, hasUpdate, hasVulnerability, type } = dependency

  return (
    <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {hasVulnerability ? (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          ) : hasUpdate ? (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
          ) : (
            <span className="inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          )}
        </div>

        <div>
          <div className="font-medium text-sm text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">
            {currentVersion} {hasUpdate && `→ ${latestVersion}`}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant={type === "production" ? "default" : "outline"}>{type === "production" ? "Prod" : "Dev"}</Badge>

        {hasVulnerability && <Badge variant="destructive">Vulnerable</Badge>}

        {hasUpdate && !hasVulnerability && <Badge variant="secondary">Update</Badge>}
      </div>
    </div>
  )
}
