"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AppIconsUploader from "@/components/admin/app-icons-uploader"
import SiteInformationForm from "@/components/admin/site-information-form"
import FeaturedProjectSelector from "@/components/admin/featured-project-selector"
import TagOrderManager from "@/components/admin/tag-order-manager"

export default function SettingsClientPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="site-info">
        <TabsList className="mb-4">
          <TabsTrigger value="site-info">Site Information</TabsTrigger>
          <TabsTrigger value="featured">Featured Content</TabsTrigger>
          <TabsTrigger value="tags">Tag Order</TabsTrigger>
          <TabsTrigger value="app-icons">App Icons</TabsTrigger>
        </TabsList>

        <TabsContent value="site-info">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Update your site content, images, and contact information.</CardDescription>
            </CardHeader>
            <CardContent>
              <SiteInformationForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Featured Content</CardTitle>
              <CardDescription>Select which content should be featured on your homepage.</CardDescription>
            </CardHeader>
            <CardContent>
              <FeaturedProjectSelector />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <TagOrderManager />
        </TabsContent>

        <TabsContent value="app-icons">
          <Card>
            <CardHeader>
              <CardTitle>App Icons</CardTitle>
              <CardDescription>Upload app icons generated from favicon-generator.org</CardDescription>
            </CardHeader>
            <CardContent>
              <AppIconsUploader />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
