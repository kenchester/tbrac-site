import type { Language } from "./translations"

/** Regions that default to Simplified Chinese (Traditional is not offered yet). */
export const SIMPLIFIED_REGIONS = new Set(["CN", "HK", "MO", "TW"])
export const LANGUAGE_COOKIE = "tbrac-language-pref"

/** First of en/zh in the browser's Accept-Language, by quality order. */
export function browserLanguage(acceptLanguage: string | null | undefined): Language | null {
  if (!acceptLanguage) return null
  const tags = acceptLanguage.split(",").map((part, i) => {
    const [tag, ...params] = part.trim().toLowerCase().split(";")
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="))
    return { tag, q: q ? Number(q.slice(2)) || 0 : 1, i }
  }).sort((a, b) => b.q - a.q || a.i - b.i)
  for (const { tag } of tags) {
    if (tag.startsWith("zh")) return "zh"
    if (tag.startsWith("en")) return "en"
  }
  return null
}

/**
 * Manual choice first; then Simplified Chinese in mainland China, Hong Kong, Macao and Taiwan;
 * elsewhere the browser's language (English or Chinese); otherwise English.
 */
export function detectLanguage(opts: { pref?: string | null; country?: string | null; acceptLanguage?: string | null }): Language {
  if (opts.pref === "en" || opts.pref === "zh") return opts.pref
  if (opts.country && SIMPLIFIED_REGIONS.has(opts.country.toUpperCase())) return "zh"
  return browserLanguage(opts.acceptLanguage) ?? "en"
}
