import { clerkClient } from "@clerk/nextjs/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function UsersPage() {
  try {
    const users = await clerkClient.users.getUserList()

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif">User Management</h1>
        </div>

        <div className="space-y-6">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{user.emailAddresses[0]?.emailAddress || "No email"}</h3>
                    <p className="text-sm text-gray-400">User ID: {user.id}</p>
                    <p className="text-sm text-gray-400">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-serif mb-4">User Management</h1>
        <p className="text-red-500">Error loading users. Please try again later.</p>
      </div>
    )
  }
}
