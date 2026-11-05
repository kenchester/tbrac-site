import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/evaluator", "/evaluator-login", "/customers", "/company", "/r/", "/panel/", "/watch/", "/checkout", "/recalculate"] },
    sitemap: "https://tbrac.org/sitemap.xml",
  }
}
