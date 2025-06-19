"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AppIconsUploader from "@/components/admin/app-icons-uploader"
import SiteInformationForm from "@/components/admin/site-information-form"
import FeaturedProjectSelector from "@/components/admin/featured-project-selector"
import TagOrderManager from "@/components/admin/tag-order-manager"

export default function SettingsClientPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="site-info">
        <TabsList className="mb-4 grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="site-info" className="text-xs md:text-sm">Site Info</TabsTrigger>
          <TabsTrigger value="featured" className="text-xs md:text-sm">Featured</TabsTrigger>
          <TabsTrigger value="tags" className="text-xs md:text-sm">Tag Order</TabsTrigger>
          <TabsTrigger value="app-icons" className="text-xs md:text-sm">App Icons</TabsTrigger>
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
