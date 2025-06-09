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
  // Removed the experimental serverComponentsExternalPackages since we're not using groq-sdk anymore
  // Increase serverless function timeout
  serverRuntimeConfig: {
    timeout: 60, // seconds
  },
}

export default nextConfig
