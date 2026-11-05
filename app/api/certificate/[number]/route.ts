import { NextResponse } from "next/server"
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import QRCode from "qrcode"
import fontkit from "@pdf-lib/fontkit"
import { allow, clientIp } from "@/lib/rate-limit"

// Public, like the register: anyone holding a report number can download its certificate.
// It is built from the live register entry, so a rating that is no longer current says so.

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000"
const SITE = "https://tbrac.org"
const NAVY = rgb(0.043, 0.122, 0.227)
const GREY = rgb(0.39, 0.45, 0.53)
const TIER: Record<string, string> = { T1: "T1 · Low identified risk", T2: "T2 · Moderate", T3: "T3 · Elevated", T4: "T4 · High", UA: "Unable to assess" }
const DOMAIN: Record<string, string> = {
  D1: "Ownership and state links", D2: "National security and export control", D3: "Data security", D4: "Supply chain and forced labor",
  D5: "Integrity and legal history", D6: "Financial integrity", D7: "IP conduct",
}

interface Entry {
  report_number: string; subject: string; engagement_type: string; tier: string | null; confidence: string | null; outlook: string | null;
  domain_tiers: Record<string, string>; methodology_version: string; issued_at: string; valid_until: string; status: string;
  status_note: string | null; fingerprint: string; checked_at: string; test?: boolean; signature?: { key_id: string; valid: boolean } | null
  subject_zh?: string
}

const SAMPLE: Entry = {
  report_number: "SAMPLE-NOT-A-REPORT", subject: "Example Battery Materials Co.", engagement_type: "design", tier: "T2", confidence: "Moderate", outlook: "stable",
  domain_tiers: { D1: "T2", D2: "T1", D3: "T2", D4: "T2", D5: "T1", D6: "T2", D7: "T1" }, methodology_version: "1.1 (sample)", issued_at: "2026-06-15T12:00:00Z",
  valid_until: "2027-06-15T12:00:00Z", status: "Sample", status_note: null, fingerprint: "0".repeat(64), checked_at: "2026-06-15T12:00:00Z",
}

/** A Noto Sans SC subset holding just the characters of `text` (Google Fonts serves TrueType subsets on request). */
async function chineseFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@600&text=${encodeURIComponent(text)}`)).text()
    const url = /src:\s*url\(([^)]+)\)\s*format\('truetype'\)/.exec(css)?.[1]
    return url ? await (await fetch(url)).arrayBuffer() : null
  } catch {
    return null
  }
}

// Standard PDF fonts cover Latin text only; anything else becomes "?" rather than failing.
const safe = (s: string, f: PDFFont) => [...s].map((c) => { try { f.encodeText(c); return c } catch { return "?" } }).join("")
const day = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = NAVY) {
  const t = safe(text, font)
  page.drawText(t, { x: (page.getWidth() - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color })
}

export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params
  if (!(await allow(`certificate:${clientIp(request)}`, 60, 60))) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  if (number.length > 30) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const sample = number === "sample"
  const res = sample ? null : await fetch(`${API_ORIGIN}/api/v1/public/verify/${encodeURIComponent(number)}`, { cache: "no-store" })
  if (res && !res.ok) return NextResponse.json({ error: "No report with that number" }, { status: 404 })
  const e = sample ? SAMPLE : ((await res!.json()) as Entry)

  const pdf = await PDFDocument.create()
  pdf.setTitle(`TBRAC certificate ${e.report_number}`)
  pdf.setAuthor("Assurance Pacific Assessments LLC")
  pdf.setSubject(`TBRAC certification of ${e.subject}`)
  const page = pdf.addPage([792, 612]) // US Letter, landscape
  const [serif, serifBold, sans, sansBold, mono] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman), pdf.embedFont(StandardFonts.TimesRomanBold),
    pdf.embedFont(StandardFonts.Helvetica), pdf.embedFont(StandardFonts.HelveticaBold), pdf.embedFont(StandardFonts.Courier)])
  const W = page.getWidth(), H = page.getHeight()

  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: NAVY, borderWidth: 2 })
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: NAVY, borderWidth: 0.5 })
  page.drawRectangle({ x: W / 2 - 18, y: H - 76, width: 36, height: 36, color: NAVY })
  centered(page, "TB", H - 64, sansBold, 14, rgb(1, 1, 1))
  centered(page, "TBRAC", H - 96, sansBold, 13)
  centered(page, "Trans-Border Risk Assessment and Certification", H - 111, sans, 9, GREY)

  centered(page, "Certificate of Risk Rating", H - 150, serifBold, 26)
  centered(page, "This certifies that", H - 178, serif, 12, GREY)
  const name = safe(e.subject, serifBold)
  const nameSize = Math.min(28, (W - 140) / Math.max(1, serifBold.widthOfTextAtSize(name, 1)))
  centered(page, name, H - 214, serifBold, nameSize)
  let shift = 0
  if (e.subject_zh) {
    const bytes = await chineseFont(e.subject_zh)
    if (bytes) {
      pdf.registerFontkit(fontkit)
      const zh = await pdf.embedFont(bytes, { subset: true })
      page.drawText(e.subject_zh, { x: (W - zh.widthOfTextAtSize(e.subject_zh, 15)) / 2, y: H - 236, size: 15, font: zh, color: NAVY })
      shift = 16
    }
  }
  const kind = e.engagement_type === "operating" ? "an operating" : "a design"
  centered(page, `was assessed in ${kind} assessment under TBRAC methodology ${e.methodology_version} and rated`, H - 240 - shift, serif, 12, GREY)
  centered(page, e.tier ? TIER[e.tier] ?? e.tier : "Not rated", H - 276 - shift, serifBold, 24)
  centered(page, `Confidence: ${e.confidence ?? "-"}    ·    Outlook: ${e.outlook ? e.outlook[0].toUpperCase() + e.outlook.slice(1) : "-"}`, H - 298 - shift, sans, 10, GREY)

  // Domain ratings
  const domains = Object.entries(e.domain_tiers)
  const colW = (W - 160) / Math.max(1, domains.length)
  domains.forEach(([d, t], i) => {
    const x = 80 + i * colW
    page.drawText(t, { x: x + colW / 2 - sansBold.widthOfTextAtSize(t, 11) / 2, y: H - 334 - shift, size: 11, font: sansBold, color: NAVY })
    const label = safe(DOMAIN[d] ?? d, sans)
    const words = label.split(" "); let line = "", y = H - 348 - shift
    for (const w of words) {
      const next = line ? `${line} ${w}` : w
      if (sans.widthOfTextAtSize(next, 7) > colW - 8) { page.drawText(line, { x: x + colW / 2 - sans.widthOfTextAtSize(line, 7) / 2, y, size: 7, font: sans, color: GREY }); line = w; y -= 9 }
      else line = next
    }
    if (line) page.drawText(line, { x: x + colW / 2 - sans.widthOfTextAtSize(line, 7) / 2, y, size: 7, font: sans, color: GREY })
  })

  // Facts and QR code
  const url = sample ? `${SITE}/verify` : `${SITE}/verify/${e.report_number}`
  const qr = await pdf.embedPng(await QRCode.toBuffer(url, { margin: 0, width: 300, errorCorrectionLevel: "M" }))
  page.drawImage(qr, { x: W - 80 - 92, y: 104, width: 92, height: 92 })
  const facts: [string, string][] = [
    ["Report number", e.report_number], ["Issued", day(e.issued_at)], ["Valid until", day(e.valid_until)],
    ["Status", `${e.status} (checked ${day(e.checked_at)})`],
  ]
  facts.forEach(([k, v], i) => {
    page.drawText(k, { x: 80, y: 182 - i * 18, size: 9, font: sans, color: GREY })
    page.drawText(safe(v, sansBold), { x: 170, y: 182 - i * 18, size: 10, font: sansBold, color: NAVY })
  })
  page.drawText(`Verify the live status: ${url.replace("https://", "")}`, { x: 80, y: 104, size: 9, font: sans, color: NAVY })
  page.drawText(`Fingerprint ${e.fingerprint}`, { x: 80, y: 92, size: 6.5, font: mono, color: GREY })
  if (e.signature) page.drawText(`Register entry digitally signed by TBRAC (Ed25519, key ${e.signature.key_id})`, { x: 80, y: 82, size: 6.5, font: sans, color: GREY })

  const disclaimer = "A private certification issued by Assurance Pacific Assessments LLC under its published methodology, as of the date stated. It is not a government certification, approval or license, not a CFIUS determination, not legal advice and not a guarantee of future conduct. Check the live status before relying on it."
  const words = disclaimer.split(" "); let line = "", y = 58
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (sans.widthOfTextAtSize(next, 7) > W - 160) { page.drawText(line, { x: 80, y, size: 7, font: sans, color: GREY }); line = w; y -= 9 } else line = next
  }
  page.drawText(line, { x: 80, y, size: 7, font: sans, color: GREY })

  const stamp = sample ? "SAMPLE · FICTIONAL COMPANY" : e.test ? "TEST · NOT A TBRAC OPINION" : e.status !== "Current" ? `NOT CURRENT · ${e.status.toUpperCase()}` : null
  if (stamp) {
    const size = 44
    page.drawText(stamp, { x: W / 2 - sansBold.widthOfTextAtSize(stamp, size) / 2 * 0.87, y: H / 2 - 150, size, font: sansBold,
      color: rgb(0.8, 0.1, 0.1), opacity: 0.22, rotate: degrees(24) })
  }

  const bytes = await pdf.save()
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${e.report_number}-certificate.pdf"`,
               "Cache-Control": "no-store" },
  })
}
