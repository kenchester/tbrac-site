// Server-side read of the public register (used for link previews and page metadata).
const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000"

export interface PublicReport { report_number: string; subject: string; subject_zh?: string; tier: string | null; status: string; valid_until: string; test?: boolean }

export async function publicReport(number: string): Promise<PublicReport | null> {
  if (!number || number.length > 30) return null
  try {
    const r = await fetch(`${API_ORIGIN}/api/v1/public/verify/${encodeURIComponent(number.toUpperCase())}`, { next: { revalidate: 300 } })
    return r.ok ? ((await r.json()) as PublicReport) : null
  } catch {
    return null
  }
}

export const TIER_LABEL: Record<string, string> = { T1: "T1 · Low identified risk", T2: "T2 · Moderate", T3: "T3 · Elevated", T4: "T4 · High", UA: "Unable to assess" }
