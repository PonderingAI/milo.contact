import Link from "next/link"

export default function StaticFallback() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-4">Welcome to the admin dashboard. This is a static page with no dependencies.</p>

      <h2 className="text-xl font-bold mt-8 mb-4">Navigation</h2>
      <ul className="space-y-2">
        <li>
          <Link href="/admin/projects" className="text-blue-500 hover:underline">
            Projects
          </Link>
        </li>
        <li>
          <Link href="/admin/media" className="text-blue-500 hover:underline">
            Media
          </Link>
        </li>
        <li>
          <Link href="/admin/settings" className="text-blue-500 hover:underline">
            Settings
          </Link>
        </li>
        <li>
          <Link href="/" className="text-blue-500 hover:underline">
            Back to Website
          </Link>
        </li>
      </ul>
    </div>
  )
}
