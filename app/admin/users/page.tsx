import { auth, currentUser } from "@clerk/nextjs/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function UsersPage() {
  const { userId } = auth()
  const user = await currentUser()

  if (!userId || !user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-serif mb-4">User Management</h1>
        <p className="text-red-500">You must be signed in to view this page.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif">User Management</h1>
      </div>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="font-medium text-lg">{user.emailAddresses[0]?.emailAddress}</h3>
                <p className="text-sm text-gray-400">User ID: {user.id}</p>
                <p className="text-sm text-gray-400">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Current User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-medium mb-4">User Management</h2>
          <p>
            This page currently shows only your user account. To manage users, you'll need to use the Clerk Dashboard.
          </p>
          <div className="mt-4">
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
            >
              Open Clerk Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
