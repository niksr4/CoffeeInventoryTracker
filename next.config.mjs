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
    serverComponentsExternalPackages: ["groq-sdk"],
  },
  // Increase serverless function timeout
  serverRuntimeConfig: {
    timeout: 60, // seconds
  },
}

export default nextConfig
