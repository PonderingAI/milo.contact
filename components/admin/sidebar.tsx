"use client"

import Link from "next/link"
import { HomeIcon, PackageIcon } from "@heroicons/react/24/outline"
import { usePathname } from "next/navigation"
import DependencyStatus from "@/components/admin/dependency-status"

export default function AdminSidebar() {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "Projects", href: "/admin/projects", icon: HomeIcon },
    { name: "Media", href: "/admin/media", icon: HomeIcon },
    { name: "Users", href: "/admin/users", icon: HomeIcon },
    { name: "Settings", href: "/admin/settings", icon: HomeIcon },
    { name: "Security", href: "/admin/security", icon: HomeIcon },
    {
      name: "Dependencies",
      href: "/admin/dependencies",
      icon: PackageIcon,
      status: <DependencyStatus />,
    },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
      <div className="mb-8">
        <h2 className="text-xl font-serif">Admin Panel</h2>
      </div>
      <nav>
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`${
                  pathname === item.href ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                } flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium`}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
                  {item.name}
                </div>
                {item.status && <div>{item.status}</div>}
              </Link>
            </li>
          ))}
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
