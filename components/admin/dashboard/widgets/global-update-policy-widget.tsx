"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Shield, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface GlobalUpdatePolicyWidgetProps {
  title?: string
}

export function GlobalUpdatePolicyWidget({ title = "Global Update Policy" }: GlobalUpdatePolicyWidgetProps) {
  const [settings, setSettings] = useState<{
    update_mode: string
    auto_update_enabled: boolean
    update_schedule: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const updateModes = [
    {
      value: "off",
      label: "Off",
      description: "No automatic updates",
      color: "bg-gray-500",
      icon: <AlertCircle className="h-4 w-4" />
    },
    {
      value: "conservative",
      label: "Conservative",
      description: "Security patches and minor updates only",
      color: "bg-blue-500",
      icon: <Shield className="h-4 w-4" />
    },
    {
      value: "aggressive",
      label: "Aggressive",
      description: "Updates to latest compatible versions with testing",
      color: "bg-green-500",
      icon: <RefreshCw className="h-4 w-4" />
    }
  ]

  const schedules = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "never", label: "Never" }
  ]

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dependencies/settings")
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // Use default values if settings don't exist
        setSettings({
          update_mode: "conservative",
          auto_update_enabled: false,
          update_schedule: "weekly"
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      // Use default values on error
      setSettings({
        update_mode: "conservative",
        auto_update_enabled: false,
        update_schedule: "weekly"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    if (!settings) return

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    setUpdating(true)

    try {
      const response = await fetch("/api/dependencies/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      })

      if (!response.ok) {
        throw new Error("Failed to update settings")
      }

      toast({
        title: "Settings Updated",
        description: `Global update policy has been updated`,
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      // Revert on error
      await fetchSettings()
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getCurrentMode = () => {
    return updateModes.find(mode => mode.value === settings?.update_mode) || updateModes[1]
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentMode = getCurrentMode()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Mode Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${currentMode.color} text-white`}>
              {currentMode.icon}
            </div>
            <div>
              <div className="font-medium">{currentMode.label}</div>
              <div className="text-sm text-muted-foreground">{currentMode.description}</div>
            </div>
          </div>
          <Badge variant="outline">{settings?.auto_update_enabled ? "Auto" : "Manual"}</Badge>
        </div>

        {/* Update Mode Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Update Mode:</label>
          <div className="grid grid-cols-1 gap-1">
            {updateModes.map((mode) => (
              <Button
                key={mode.value}
                variant={settings?.update_mode === mode.value ? "default" : "ghost"}
                size="sm"
                className="justify-start h-auto p-2"
                onClick={() => updateSetting("update_mode", mode.value)}
                disabled={updating}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${mode.color} text-white`}>
                    {mode.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-xs">{mode.label}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Auto Update Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Auto Updates</div>
            <div className="text-xs text-muted-foreground">
              {schedules.find(s => s.value === settings?.update_schedule)?.label || "Weekly"}
            </div>
          </div>
          <Button
            variant={settings?.auto_update_enabled ? "default" : "outline"}
            size="sm"
            onClick={() => updateSetting("auto_update_enabled", !settings?.auto_update_enabled)}
            disabled={updating}
          >
            {settings?.auto_update_enabled ? "On" : "Off"}
          </Button>
        </div>

        {/* Schedule Selection (if auto updates enabled) */}
        {settings?.auto_update_enabled && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Schedule:</label>
            <div className="flex gap-1">
              {schedules.filter(s => s.value !== "never").map((schedule) => (
                <Button
                  key={schedule.value}
                  variant={settings?.update_schedule === schedule.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("update_schedule", schedule.value)}
                  disabled={updating}
                >
                  {schedule.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          All dependencies use this global policy by default
        </div>
      </CardContent>
    </Card>
  )
}