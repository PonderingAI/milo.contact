import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupDatabasePage() {
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-serif mb-2">Database Setup</h1>
      <p className="text-gray-400 mb-8">Set up the database tables for your portfolio</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create Tables</CardTitle>
            <CardDescription>Create the necessary database tables</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              This will create the following tables:
              <br />- projects: Store your portfolio projects
              <br />- user_roles: Manage admin users
              <br />- site_settings: Store site configuration
              <br />- bts_images: Store behind-the-scenes images
            </p>
            <form action="/api/setup-database" method="GET">
              <Button type="submit">Create Tables</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Seed Database</CardTitle>
            <CardDescription>Add sample data to your database</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              This will add sample projects to your database. You can edit or delete these later.
            </p>
            <form action="/api/seed-database" method="GET">
              <Button type="submit">Seed Database</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Set Up Storage</CardTitle>
            <CardDescription>Configure Supabase Storage for images</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              This will create the necessary storage buckets for your portfolio images.
            </p>
            <form action="/api/setup-storage" method="GET">
              <Button type="submit">Set Up Storage</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Set Up Settings Table</CardTitle>
            <CardDescription>Create the site settings table</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              This will create the site_settings table to store your site configuration.
            </p>
            <form action="/api/setup-settings-table" method="GET">
              <Button type="submit">Set Up Settings Table</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 5: Set Up BTS Images Table</CardTitle>
            <CardDescription>Create the behind-the-scenes images table</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              This will create the bts_images table to store behind-the-scenes images for your projects.
            </p>
            <form action="/api/setup-bts-images-table" method="GET">
              <Button type="submit">Set Up BTS Images Table</Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Link href="/admin">
            <Button variant="outline">Go to Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
