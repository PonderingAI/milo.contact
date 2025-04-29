import { auth, currentUser } from "@clerk/nextjs/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin")
  }

  const user = await currentUser()

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <p className="text-lg">
          Welcome, {user?.firstName || user?.username || user?.emailAddresses[0]?.emailAddress || "Admin"}!
        </p>
        <p className="text-sm text-gray-400">You are signed in as {user?.emailAddresses[0]?.emailAddress}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage your portfolio projects</p>
            <Link
              href="/admin/projects"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              View Projects
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage your media files</p>
            <Link
              href="/admin/media"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              View Media
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Configure site settings</p>
            <Link
              href="/admin/settings"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              View Settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
