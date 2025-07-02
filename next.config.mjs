/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Set body size limit for API routes (Vercel limit is 50MB for serverless functions)
    bodySizeLimit: "50mb",
  },
}

export default nextConfig