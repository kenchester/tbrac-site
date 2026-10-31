const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // The FastAPI project is served under this site's origin, so the browser
  // never makes cross-origin API calls.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` },
      { source: "/health/:path*", destination: `${API_ORIGIN}/health/:path*` },
      { source: "/health", destination: `${API_ORIGIN}/health` },
    ]
  },
}

export default nextConfig
