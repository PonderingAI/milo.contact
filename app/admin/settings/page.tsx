"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Reset states
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match")
      return
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setIsSubmitting(true)

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      // Show success message
      setSuccess("Password updated successfully")
    } catch (error: any) {
      console.error("Error updating password:", error)
      setError(error.message || "Failed to update password")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif mb-8">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-900/20 border-green-800">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-gray-200">
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Management</CardTitle>
            <CardDescription>Manage your media storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Storage Buckets</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Your media is stored in Supabase Storage buckets. Make sure these buckets exist with proper
                  permissions.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                    <div>
                      <p className="font-medium">media</p>
                      <p className="text-xs text-gray-400">Main storage bucket</p>
                    </div>
                    <span className="text-green-500 text-sm">Active</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Storage Folders</h3>
                <p className="text-sm text-gray-400 mb-4">Your media is organized in these folders</p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                    <div>
                      <p className="font-medium">projects</p>
                      <p className="text-xs text-gray-400">Project cover images</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                    <div>
                      <p className="font-medium">bts-images</p>
                      <p className="text-xs text-gray-400">Behind the scenes images</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full">
                <a href="/admin/media">Manage Media Files</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
