"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, UserCheck, UserX, RefreshCw, AlertTriangle, CheckCircle, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserWithRoles {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  clerkRoles: string[]
  supabaseRoles: string[]
  isSuperAdmin: boolean
  isOnline?: boolean
  createdAt: string
  lastSyncedAt?: string
}

interface RolesSyncStatus {
  userId: string
  success: boolean
  isSuperAdmin: boolean
  clerkRoles: string[]
  supabaseRoles: string[]
  adminRoleAssigned: boolean
}

export default function RolesPage() {
  const { user: currentUser, isLoaded, isSignedIn } = useUser()
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<RolesSyncStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check current user permissions
  useEffect(() => {
    if (isLoaded && isSignedIn && currentUser) {
      const superAdminStatus = currentUser.publicMetadata?.superAdmin === true
      const adminStatus = superAdminStatus || 
        (Array.isArray(currentUser.publicMetadata?.roles) && 
         (currentUser.publicMetadata?.roles as string[]).includes('admin'))
      
      setIsSuperAdmin(superAdminStatus)
      setIsAdmin(adminStatus)
    }
  }, [isLoaded, isSignedIn, currentUser])

  // Fetch users data
  useEffect(() => {
    async function fetchUsers() {
      if (!isLoaded || !isSignedIn || !currentUser || !isAdmin) {
        setLoading(false)
        return
      }

      try {
        setError(null)
        // For now, show current user as example
        // In a production app, you'd fetch all users from an API
        const userData: UserWithRoles = {
          id: currentUser.id,
          email: currentUser.primaryEmailAddress?.emailAddress || "",
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          clerkRoles: (currentUser.publicMetadata?.roles as string[]) || [],
          supabaseRoles: [], // Will be fetched separately
          isSuperAdmin: currentUser.publicMetadata?.superAdmin === true,
          createdAt: new Date(currentUser.createdAt).toISOString(),
          isOnline: true
        }

        // Fetch Supabase roles for the user
        try {
          const rolesResponse = await fetch('/api/admin/get-user-roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
          })
          
          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json()
            userData.supabaseRoles = rolesData.roles || []
          }
        } catch (rolesError) {
          console.warn('Could not fetch Supabase roles:', rolesError)
        }

        setUsers([userData])
      } catch (error) {
        console.error("Error fetching users:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isLoaded, isSignedIn, currentUser, isAdmin])

  // Sync current user roles
  async function syncCurrentUserRoles() {
    if (!currentUser) return

    setActionInProgress('sync-current')
    setError(null)
    
    try {
      const response = await fetch('/api/admin/sync-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync roles')
      }

      setSyncStatus(data.debug)
      setLastSync(new Date().toLocaleTimeString())

      // Update local user data
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === currentUser.id 
            ? { ...user, supabaseRoles: data.debug.supabaseRoles, lastSyncedAt: new Date().toISOString() }
            : user
        )
      )
    } catch (error) {
      console.error("Error syncing roles:", error)
      setError(error instanceof Error ? error.message : "Failed to sync roles")
    } finally {
      setActionInProgress(null)
    }
  }

  // Toggle admin role
  async function toggleAdminRole(userId: string, hasAdminRole: boolean) {
    if (!isSuperAdmin) {
      setError("Only super admins can modify admin roles")
      return
    }

    setActionInProgress(userId)
    setError(null)
    
    try {
      const response = await fetch("/api/admin/toggle-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: "admin",
          action: hasAdminRole ? "remove" : "add",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update role")
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user.id === userId) {
            const updatedClerkRoles = hasAdminRole 
              ? user.clerkRoles.filter(role => role !== "admin")
              : [...user.clerkRoles, "admin"]
            return { ...user, clerkRoles: updatedClerkRoles }
          }
          return user
        })
      )

      // Trigger a role sync after role change
      await syncCurrentUserRoles()
    } catch (error) {
      console.error("Error toggling admin role:", error)
      setError(error instanceof Error ? error.message : "Failed to update user role")
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

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Role Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              You need admin privileges to access role management. Please contact a super admin if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Role Management</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={syncCurrentUserRoles}
            disabled={actionInProgress === 'sync-current'}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none touch-manipulation"
          >
            {actionInProgress === 'sync-current' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync My Roles
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Permission Info */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-blue-400 mb-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Your Access Level</h2>
        </div>
        <div className="flex gap-4 text-sm">
          <Badge variant={isSuperAdmin ? "default" : "secondary"}>
            {isSuperAdmin ? "Super Admin" : "Not Super Admin"}
          </Badge>
          <Badge variant={isAdmin ? "default" : "secondary"}>
            {isAdmin ? "Admin" : "Not Admin"}
          </Badge>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {isSuperAdmin 
            ? "You have full privileges and can manage all user roles including admin assignments."
            : isAdmin 
              ? "You have admin privileges but cannot assign admin roles to other users."
              : "You have limited access to role management."
          }
        </p>
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <Card className="mb-6 bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Last Role Sync Status
              {lastSync && <span className="text-sm font-normal text-gray-400">({lastSync})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Super Admin</p>
                <Badge variant={syncStatus.isSuperAdmin ? "default" : "secondary"}>
                  {syncStatus.isSuperAdmin ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-gray-400">Clerk Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {syncStatus.clerkRoles.length > 0 ? (
                    syncStatus.clerkRoles.map(role => (
                      <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs">None</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-400">Supabase Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {syncStatus.supabaseRoles.length > 0 ? (
                    syncStatus.supabaseRoles.map(role => (
                      <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="text-xs">None</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-400">Admin Access</p>
                <Badge variant={syncStatus.adminRoleAssigned ? "default" : "destructive"}>
                  {syncStatus.adminRoleAssigned ? "Granted" : "Denied"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Management */}
      <Card className="bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            User Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <div className="min-w-full inline-block align-middle">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-2 px-4 md:px-0">User</th>
                    <th className="pb-2 px-4 md:px-0">Email</th>
                    <th className="pb-2 px-4 md:px-0">Clerk Roles</th>
                    <th className="pb-2 px-4 md:px-0">Supabase Roles</th>
                    <th className="pb-2 px-4 md:px-0">Status</th>
                    <th className="pb-2 px-4 md:px-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const hasAdminRoleInClerk = user.clerkRoles.includes("admin")
                    const hasAdminRoleInSupabase = user.supabaseRoles.includes("admin")
                    const rolesInSync = hasAdminRoleInClerk === hasAdminRoleInSupabase
                    
                    return (
                      <tr key={user.id} className="border-b border-gray-700">
                        <td className="py-3 px-4 md:px-0">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : "User " + user.id.substring(0, 6)}
                              </div>
                              {user.isSuperAdmin && (
                                <Badge variant="default" className="mt-1 text-xs">Super Admin</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 md:px-0">
                          <div className="text-sm break-all">{user.email}</div>
                        </td>
                        <td className="py-3 px-4 md:px-0">
                          <div className="flex flex-wrap gap-1">
                            {user.clerkRoles.length > 0 ? (
                              user.clerkRoles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                            <Badge variant="secondary" className="text-xs">None</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.supabaseRoles.length > 0 ? (
                            user.supabaseRoles.map((role) => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="text-xs">None</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {rolesInSync ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Synced
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Out of Sync
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {isSuperAdmin && (
                            <Button
                              variant={hasAdminRoleInClerk ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleAdminRole(user.id, hasAdminRoleInClerk)}
                              disabled={actionInProgress === user.id}
                              className="flex items-center gap-1"
                            >
                              {actionInProgress === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : hasAdminRoleInClerk ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                              {hasAdminRoleInClerk ? "Remove Admin" : "Make Admin"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

          {/* Instructions */}
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Role Management Instructions</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p><strong>Super Admin Setup:</strong> Set <code>superAdmin: true</code> in user's public metadata via Clerk Dashboard.</p>
                <p><strong>Admin Roles:</strong> Only super admins can assign/remove admin roles to other users.</p>
                <p><strong>Role Sync:</strong> Roles are automatically synced between Clerk and Supabase on admin page visits.</p>
                <p><strong>BTS Access:</strong> Users need admin role in Supabase database to save BTS images during project creation.</p>
              </div>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p><strong>BTS Permission Denied:</strong> Click "Sync My Roles" to ensure Supabase has admin role.</p>
                <p><strong>Out of Sync Roles:</strong> Use the sync button to align Clerk and Supabase roles.</p>
                <p><strong>Can't Assign Admin:</strong> Only users with super admin status can modify admin roles.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}