import Link from "next/link"

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
      <div className="mb-8">
        <h2 className="text-xl font-serif">Admin Panel</h2>
      </div>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link href="/admin" className="block py-2 px-4 rounded hover:bg-gray-800">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/projects" className="block py-2 px-4 rounded hover:bg-gray-800">
              Projects
            </Link>
          </li>
          <li>
            <Link href="/admin/media" className="block py-2 px-4 rounded hover:bg-gray-800">
              Media
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="block py-2 px-4 rounded hover:bg-gray-800">
              Users
            </Link>
          </li>
          <li>
            <Link href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-800">
              Settings
            </Link>
          </li>
          <li>
            <Link href="/admin/security" className="block py-2 px-4 rounded hover:bg-gray-800">
              Security
            </Link>
          </li>
          <li className="mt-8">
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="w-full text-left py-2 px-4 rounded hover:bg-gray-800 text-red-400">
                Sign Out
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
