import type React from "react"
import AdminCheck from "@/components/admin/admin-check"
import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import AdminDatabaseCheck from "./admin-database-check"
import Sidebar from "@/components/admin/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminCheck>
      <AdminDatabaseCheck>
        <div className="min-h-screen bg-gray-950 text-white">
          {/* Responsive Sidebar */}
          <Sidebar />
          
          {/* Main content */}
          <main className="md:ml-64 p-4 md:p-6 overflow-auto">
            {/* User button in top right on mobile */}
            <div className="flex justify-end mb-4 md:hidden">
              <UserButton afterSignOutUrl="/" />
            </div>
            
            {/* User button in sidebar area on desktop */}
            <div className="hidden md:block fixed top-4 right-4 z-30">
              <UserButton afterSignOutUrl="/" />
            </div>
            
            {/* Back to website link for mobile */}
            <div className="mb-4 md:hidden">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Website
              </Link>
            </div>
            
            {children}
          </main>
        </div>
      </AdminDatabaseCheck>
    </AdminCheck>
  )
}
