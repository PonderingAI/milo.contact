"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import FaviconUploader from "@/components/admin/favicon-uploader"

export default function ClientSettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif">Site Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Favicon</CardTitle>
        </CardHeader>
        <CardContent>
          <FaviconUploader />
        </CardContent>
      </Card>

      {/* Add more settings cards here as needed */}
    </div>
  )
}
