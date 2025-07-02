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
    // Set body size limit for API routes (Vercel hobby plan limit is ~4.5MB)
    bodySizeLimit: "4.5mb",
  },
}

export default nextConfig