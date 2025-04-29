"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

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
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-2">Welcome, {user.firstName || user.emailAddresses[0].emailAddress}</h2>
        <p>You are signed in as {user.emailAddresses[0].emailAddress}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard title="Projects" description="Manage your portfolio projects" link="/admin/projects" />
        <AdminCard title="Media" description="Upload and manage media files" link="/admin/media" />
        <AdminCard title="Settings" description="Configure site settings" link="/admin/settings" />
        <AdminCard title="Users" description="Manage user access and permissions" link="/admin/users" />
      </div>
    </div>
  )
}

function AdminCard({ title, description, link }: { title: string; description: string; link: string }) {
  return (
    <Link href={link} className="block">
      <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p>{description}</p>
      </div>
    </Link>
  )
}
