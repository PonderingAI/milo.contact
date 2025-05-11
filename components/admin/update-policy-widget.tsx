"use client"
import { Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface UpdatePolicyWidgetProps {
  updateMode: string
  onUpdateModeChange: (mode: string) => void
}

export default function UpdatePolicyWidget({ updateMode, onUpdateModeChange }: UpdatePolicyWidgetProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Globe className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="font-medium">Global Update Policy</h3>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          System-wide setting
        </Badge>
      </div>

      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <RadioGroup value={updateMode} onValueChange={onUpdateModeChange} className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual" className="font-medium">
              Manual Updates
            </Label>
          </div>
          <div className="text-sm text-gray-500 ml-6 mb-2">Only update packages when explicitly requested</div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="security" id="security" />
            <Label htmlFor="security" className="font-medium">
              Security Updates Only
            </Label>
          </div>
          <div className="text-sm text-gray-500 ml-6 mb-2">Automatically apply security patches</div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="minor" id="minor" />
            <Label htmlFor="minor" className="font-medium">
              Minor Version Updates
            </Label>
          </div>
          <div className="text-sm text-gray-500 ml-6 mb-2">Apply security patches and minor version updates</div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="major" id="major" />
            <Label htmlFor="major" className="font-medium">
              All Updates
            </Label>
          </div>
          <div className="text-sm text-gray-500 ml-6">Apply all updates including major version changes</div>
        </RadioGroup>
      </div>

      <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-700">
        <p>
          <strong>Note:</strong> Critical security vulnerabilities will always be patched regardless of your update
          policy.
        </p>
      </div>
    </div>
  )
}
