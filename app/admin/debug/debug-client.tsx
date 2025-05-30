"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DebugClientProps {
  user: {
    id: string
    email: string
    createdAt: string
  } | null
  profileExists: boolean
  userRoles: string[]
  envVars: Record<string, boolean>
}

export default function DebugClient({ user, profileExists, userRoles, envVars }: DebugClientProps) {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-serif">Debug Information</h1>

      <Card>
        <CardHeader>
          <CardTitle>Clerk Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p>
                <strong>Status:</strong> <span className="text-green-500">Authenticated</span>
              </p>
              <p>
                <strong>User ID:</strong> {user.id}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-red-500">Not authenticated with Clerk</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supabase Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Profile in Supabase:</strong>{" "}
              {profileExists ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>}
            </p>
            <p>
              <strong>User Roles:</strong> {userRoles.length > 0 ? userRoles.join(", ") : "None"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, exists]) => (
              <p key={key}>
                <strong>{key}:</strong>{" "}
                {exists ? <span className="text-green-500">Set</span> : <span className="text-red-500">Missing</span>}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button asChild>
          <Link href="/sign-in">Go to Sign In</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}
