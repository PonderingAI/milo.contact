"use client"

import { useUser } from "@clerk/nextjs"
import Link from "next/link"

export default function PermissionDeniedPage() {
  const { user } = useUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">Permission Denied</h1>

        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            Signed in as: <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
          </p>
        </div>

        <p className="text-gray-600 mb-6">
          You don't have permission to access the admin area. Only users with admin privileges can access this section.
        </p>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-gray-900 text-white py-2 px-4 rounded text-center hover:bg-gray-800"
          >
            Return to Website
          </Link>

          <Link
            href="/admin/bootstrap"
            className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded text-center hover:bg-gray-50"
          >
            Try Bootstrap Process
          </Link>

          <Link href="/sign-in" className="block w-full text-center text-sm text-gray-500 hover:text-gray-700">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  )
}
