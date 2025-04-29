"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, UserCheck, UserX } from "lucide-react"
import { assignRole, removeRole } from "@/lib/auth-utils"

interface ClerkUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  roles: string[]
  createdAt: Date
}

export default function UsersPage() {
  const { user: currentUser, isLoaded, isSignedIn } = useUser()
  const [users, setUsers] = useState<ClerkUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Fetch users and check if current user is super admin
  useEffect(() => {
    async function fetchData() {
      if (isLoaded && isSignedIn && currentUser) {
        try {
          // Check if current user is super admin
          const superAdminStatus = currentUser.publicMetadata?.superAdmin === true
          setIsSuperAdmin(superAdminStatus)

          // If not super admin, don't fetch users
          if (!superAdminStatus) {
            setLoading(false)
            return
          }

          // Fetch users (in a real app, this would be an API call)
          // For now, we'll just show the current user
          const userData: ClerkUser = {
            id: currentUser.id,
            email: currentUser.primaryEmailAddress?.emailAddress || "",
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            roles: (currentUser.publicMetadata?.roles as string[]) || [],
            createdAt: new Date(currentUser.createdAt),
          }
          setUsers([userData])
        } catch (error) {
          console.error("Error fetching data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [isLoaded, isSignedIn, currentUser])

  async function toggleAdminRole(userId: string, hasAdminRole: boolean) {
    setActionInProgress(userId)
    try {
      if (hasAdminRole) {
        await removeRole(userId, "admin")
      } else {
        await assignRole(userId, "admin")
      }

      // Update the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id === userId) {
            const updatedRoles = hasAdminRole ? user.roles.filter((role) => role !== "admin") : [...user.roles, "admin"]
            return { ...user, roles: updatedRoles }
          }
          return user
        }),
      )
    } catch (error) {
      console.error("Error toggling admin role:", error)
      alert("Failed to update user role. Please try again.")
    } finally {
      setActionInProgress(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              Only super admins can access the user management page. Please contact the site owner if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <a
          href="https://dashboard.clerk.com/last-active?path=users"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Clerk Dashboard
        </a>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Super Admin Access</h2>
        </div>
        <p className="text-sm text-gray-400">
          You have super admin privileges. You can manage user roles and access the Clerk Dashboard for full user
          management.
        </p>
      </div>

      <Card className="bg-gray-800">
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Roles</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const hasAdminRole = user.roles.includes("admin")
                  return (
                    <tr key={user.id} className="border-b border-gray-700">
                      <td className="py-3">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "User " + user.id.substring(0, 6)}
                      </td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-block px-2 py-1 mr-1 bg-blue-900/50 text-blue-400 rounded-full text-xs"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">No roles</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Button
                          variant={hasAdminRole ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, hasAdminRole)}
                          disabled={actionInProgress === user.id}
                          className="flex items-center gap-1"
                        >
                          {actionInProgress === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : hasAdminRole ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          {hasAdminRole ? "Remove Admin" : "Make Admin"}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">How to Add Users</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>
                Go to the{" "}
                <a
                  href="https://dashboard.clerk.com/last-active?path=users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Clerk Dashboard
                </a>
              </li>
              <li>Click "Add User" to create a new user</li>
              <li>Once created, the user will appear in this list</li>
              <li>Use the "Make Admin" button to grant admin privileges</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Super Admin Setup</h3>
            <p className="text-gray-400 mb-2">
              To set up a super admin, you need to manually update the user's metadata in the Clerk Dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>
                Go to the{" "}
                <a
                  href="https://dashboard.clerk.com/last-active?path=users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Clerk Dashboard
                </a>
              </li>
              <li>Select the user you want to make a super admin</li>
              <li>Go to the "Metadata" tab</li>
              <li>
                Add <code className="bg-gray-800 px-1 rounded">{'{ "superAdmin": true }'}</code> to the public metadata
              </li>
              <li>Save the changes</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
