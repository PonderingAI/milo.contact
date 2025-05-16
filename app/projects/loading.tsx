export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="h-12 w-48 bg-gray-800 rounded-md animate-pulse mb-8"></div>

        <div className="h-10 w-full bg-gray-800 rounded-md animate-pulse mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg aspect-video animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
