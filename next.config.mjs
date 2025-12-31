/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export for Azure Static Web Apps
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: {
    // CI/CD for MVP: don't block deploys on lint. Turn this off when you wire real APIs.
    ignoreDuringBuilds: true
  }
}

export default nextConfig
