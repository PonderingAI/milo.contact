import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default function PermissionDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Permission Denied</h1>

        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 mb-2">You are signed in but don't have admin privileges.</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your account:</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            If you believe you should have admin access, you can try the bootstrap process:
          </p>

          <Link
            href="/bootstrap-admin"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700"
          >
            Go to Bootstrap Page
          </Link>

          <Link
            href="/sign-in?redirect_url=/bootstrap-admin"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded text-center hover:bg-gray-300"
          >
            Sign in with a different account
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-800 text-white py-2 px-4 rounded text-center hover:bg-gray-700"
          >
            Return to Website
          </Link>
        </div>
      </div>
    </div>
  )
}
