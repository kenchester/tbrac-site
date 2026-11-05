import type { MetadataRoute } from "next"

const PAGES: [string, number][] = [
  ["", 1], ["/for-companies", 0.9], ["/for-government", 0.9], ["/for-government/inquiry", 0.6], ["/methodology", 0.8], ["/sample-report", 0.7], ["/relying-parties", 0.7], ["/verify", 0.7],
  ["/case-studies", 0.5], ["/faq", 0.6], ["/about", 0.5], ["/contact", 0.5], ["/watch", 0.3], ["/privacy", 0.3], ["/terms", 0.3],
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(([path, priority]) => ({ url: `https://tbrac.org${path}`, changeFrequency: "monthly", priority }))
}
