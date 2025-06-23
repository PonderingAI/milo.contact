"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AppIconsUploader from "@/components/admin/app-icons-uploader"
import SiteInformationForm from "@/components/admin/site-information-form"

export default function SettingsClientPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="site-info">
        <TabsList className="mb-4 grid grid-cols-2 w-full">
          <TabsTrigger value="site-info" className="text-xs md:text-sm">Site Info</TabsTrigger>
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
