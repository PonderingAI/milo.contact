export default function AdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p>Welcome to the admin dashboard. This is a static page with no dependencies.</p>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Navigation</h2>
        <ul className="space-y-2">
          <li>
            <a href="/admin/projects" className="text-blue-500 hover:underline">
              Projects
            </a>
          </li>
          <li>
            <a href="/admin/media" className="text-blue-500 hover:underline">
              Media
            </a>
          </li>
          <li>
            <a href="/admin/settings" className="text-blue-500 hover:underline">
              Settings
            </a>
          </li>
          <li>
            <a href="/" className="text-blue-500 hover:underline">
              Back to Website
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
