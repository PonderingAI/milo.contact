"use client"

import { useState } from "react"
import { assignRole, removeRole, type UserRole } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, X, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserRoleManagerProps {
  userId: string
  currentRoles: UserRole[]
}

export default function UserRoleManager({ userId, currentRoles = [] }: UserRoleManagerProps) {
  const [roles, setRoles] = useState<UserRole[]>(currentRoles)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Available roles
  const availableRoles = [
    { id: "admin", name: "admin", description: "Full access to all admin features" },
    { id: "editor", name: "editor", description: "Can edit content but cannot access settings" },
    { id: "viewer", name: "viewer", description: "View-only access to content" },
  ].filter((role) => !roles.some((r) => r.name === role.name))

  const handleAddRole = async () => {
    if (!selectedRole) return

    setIsLoading(true)
    setError(null)

    try {
      const success = await assignRole(userId, selectedRole)

      if (success) {
        // Find the role details from availableRoles
        const roleDetails = availableRoles.find((r) => r.name === selectedRole)

        if (roleDetails) {
          setRoles([...roles, roleDetails])
        }

        setSelectedRole("")
      } else {
        setError("Failed to assign role")
      }
    } catch (err) {
      setError("An error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveRole = async (roleName: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await removeRole(userId, roleName)

      if (success) {
        setRoles(roles.filter((r) => r.name !== roleName))
      } else {
        setError("Failed to remove role")
      }
    } catch (err) {
      setError("An error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Current Roles</h4>
        <div className="flex flex-wrap gap-2">
          {roles.length > 0 ? (
            roles.map((role) => (
              <Badge key={role.id} variant="outline" className="flex items-center gap-1">
                {role.name}
                <button
                  onClick={() => handleRemoveRole(role.name)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-400">No roles assigned</span>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select role to add" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleAddRole}
          disabled={!selectedRole || isLoading}
          size="sm"
          className="bg-white text-black hover:bg-gray-200"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-1" />}
          Add
        </Button>
      </div>
    </div>
  )
}
