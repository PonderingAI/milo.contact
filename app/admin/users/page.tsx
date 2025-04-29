"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { UserButton } from "@clerk/nextjs"
import Link from "next/link"

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  isAdmin: boolean
}

export default function UsersPage() {
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        // In a real app, you would fetch users from your API
        // For now, we'll just show the current user
        if (currentUser) {
          const userData: User = {
            id: currentUser.id,
            email: currentUser.emailAddresses[0].emailAddress,
            firstName: currentUser.firstName || undefined,
            lastName: currentUser.lastName || undefined,
            isAdmin: true, // Current user is admin since they can access this page
          }
          setUsers([userData])
        }
        setLoading(false)
      } catch (err) {
        setError("Failed to load users")
        setLoading(false)
      }
    }

    fetchUsers()
  }, [currentUser])

  if (loading) {
    return <div>Loading users...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Link
          href="https://dashboard.clerk.com/last-active?path=users"
          target="_blank"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Clerk Dashboard
        </Link>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-400">
          For full user management, please use the Clerk Dashboard. This page provides basic information about users
          with admin access.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-700">
          <h2 className="text-xl font-bold">Current Administrators</h2>
        </div>

        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-2">User</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <UserButton userId={user.id} />
                      </div>
                      <div>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "User"}</div>
                    </div>
                  </td>
                  <td className="py-3">{user.email}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded-full text-xs">Admin</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-700">
          <p className="text-sm text-gray-400">
            To add more administrators, invite them through Clerk and then assign the admin role using the bootstrap
            process.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Add New Administrator</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="mb-4">To add a new administrator:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            <li>
              Invite the user through the{" "}
              <a
                href="https://dashboard.clerk.com/last-active?path=users"
                target="_blank"
                className="text-blue-400 hover:underline"
                rel="noreferrer"
              >
                Clerk Dashboard
              </a>
            </li>
            <li>Have them sign in to the website</li>
            <li>
              Use the{" "}
              <Link href="/admin/bootstrap" className="text-blue-400 hover:underline">
                bootstrap process
              </Link>{" "}
              with the admin secret
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
