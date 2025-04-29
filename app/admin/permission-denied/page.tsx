import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export default function PermissionDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center max-w-md p-8">
        <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-red-500" />
        <h1 className="text-4xl font-serif mb-4">Access Denied</h1>
        <p className="mb-8">
          You don't have permission to access the admin panel. Please contact an administrator if you believe this is an
          error.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="px-6 py-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors">
            Return to Homepage
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="px-6 py-3 bg-red-900 text-white rounded-full hover:bg-red-800 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
