const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A type error now fails the build instead of shipping.
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js hydration needs inline scripts; Vercel Analytics is served same-origin.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // Browser uploads go straight to private Vercel Blob storage.
      "connect-src 'self' https://vercel.com https://*.vercel-storage.com https://*.blob.vercel-storage.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      // Evaluator pages and API answers carry confidential data: never cache them.
      { source: "/evaluator/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      // Private report links: never cached, never indexed, never leak the link in a Referer.
      { source: "/r/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" },
                                       { key: "Referrer-Policy", value: "no-referrer" }] },
    ]
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
