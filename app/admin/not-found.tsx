import Link from "next/link"

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-serif mb-4">404 - Page Not Found</h1>
        <p className="mb-8">The admin page you're looking for doesn't exist.</p>
        <Link href="/admin" className="text-blue-400 hover:underline">
          Return to Admin Dashboard
        </Link>
      </div>
    </div>
  )
}
