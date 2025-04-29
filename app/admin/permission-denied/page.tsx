"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"

export default function PermissionDenied() {
  const { user } = useUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Permission Denied</h1>
          <p className="text-gray-400">You don't have permission to access the admin area.</p>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Signed in as:</p>
              <p className="text-sm text-gray-400">{user?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
          <p className="text-sm text-gray-400">Your account doesn't have administrator privileges.</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
          >
            Return to Website
          </Link>

          <Link
            href="/sign-in"
            className="block w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
          >
            Sign in with a different account
          </Link>

          <div className="text-xs text-gray-500 text-center mt-4">
            If you believe you should have access, please contact the site administrator.
          </div>
        </div>
      </div>
    </div>
  )
}
