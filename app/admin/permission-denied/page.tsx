import Link from "next/link"

export default function PermissionDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Permission Denied</h1>

        <p className="mb-6 text-gray-700">
          You don't have permission to access the admin area. Only users with admin privileges can access this section.
        </p>

        <div className="space-y-4">
          <Link
            href="/bootstrap-admin"
            className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600"
          >
            Go to Bootstrap Page
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-800 text-center py-2 px-4 rounded hover:bg-gray-300"
          >
            Return to Website
          </Link>

          <Link href="/sign-in" className="block text-blue-500 hover:underline text-center">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  )
}
