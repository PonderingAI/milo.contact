"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function PermissionDenied() {
  const router = useRouter()
  const { user, isSignedIn } = useUser()

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle>Permission Denied</CardTitle>
          </div>
          <CardDescription>
            You don't have permission to access the admin area. Only users with admin privileges can access this
            section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSignedIn && (
            <p className="text-sm text-muted-foreground">
              Signed in as: <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
            </p>
          )}
          <div className="mt-4 rounded-md bg-amber-50 p-4 text-sm text-amber-800">
            <p>
              If you believe you should have admin access, please contact the site administrator or use the bootstrap
              process if you're setting up the site for the first time.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-2 sm:space-y-0">
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Website
          </Button>
          {isSignedIn ? (
            <Button variant="outline" onClick={() => router.push("/admin/bootstrap")}>
              Bootstrap Admin
            </Button>
          ) : (
            <Button onClick={() => router.push("/sign-in")}>Sign In</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
