"use client"

import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

      <div className="mb-8">
        <p className="text-lg">Welcome, {user?.firstName || user?.username || "Admin"}!</p>
        <p className="text-sm text-gray-500">You are signed in as {user?.primaryEmailAddress?.emailAddress}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminCard title="Projects" description="Manage your portfolio projects" link="/admin/projects" />
        <AdminCard title="Media" description="Upload and manage media files" link="/admin/media" />
        <AdminCard title="Settings" description="Configure site settings" link="/admin/settings" />
        <AdminCard title="Users" description="Manage user accounts" link="/admin/users" />
      </div>
    </div>
  )
}

function AdminCard({ title, description, link }: { title: string; description: string; link: string }) {
  return (
    <Link href={link} className="block">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-2 text-xl font-semibold">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </Link>
  )
}
