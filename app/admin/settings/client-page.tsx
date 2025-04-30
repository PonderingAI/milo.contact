"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FaviconUploader from "@/components/admin/favicon-uploader"
import AppIconsUploader from "@/components/admin/app-icons-uploader"
import SiteInformationForm from "@/components/admin/site-information-form"

export default function SettingsClientPage() {
  const [activeTab, setActiveTab] = useState("site-info")

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-serif mb-6">Site Settings</h1>

      <Tabs defaultValue="site-info" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="site-info">Site Information</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="site-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Manage your site's content and images</CardDescription>
            </CardHeader>
            <CardContent>
              <SiteInformationForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Favicon</CardTitle>
              <CardDescription>Upload a favicon for your site</CardDescription>
            </CardHeader>
            <CardContent>
              <FaviconUploader />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Icons</CardTitle>
              <CardDescription>Upload app icons for iOS, Android, and other platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <AppIconsUploader />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Advanced configuration options</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">Coming soon: Custom CSS, analytics integration, and more</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
