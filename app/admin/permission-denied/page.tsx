import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function PermissionDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Permission Denied</CardTitle>
          <CardDescription>You don't have permission to access the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            If you believe you should have access, please use the setup admin page to gain admin privileges.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/setup-admin">
            <Button>Setup Admin</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
