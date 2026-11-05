import { NextResponse } from "next/server"
import { authDb } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { allow, clientIp } from "@/lib/rate-limit"

const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ORG_TYPES = ["county", "city", "edc", "state_agency", "port_authority", "other"]
const DECISIONS = ["incentive", "land", "lease", "contract", "permit", "other"]
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "") || null

// Public form for public bodies. Stored for staff, who are told by email. Nothing is emailed to the
// address typed in, so the form can't be used to send mail to strangers.
export async function POST(request: Request) {
  if (!(await allow(`agency:${clientIp(request)}`, 5, 3600))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  if (b.website) return NextResponse.json({ ok: true }) // hidden field: only bots fill it in
  const organization = clip(b.organization, 300), contact = clip(b.contact_name, 200), email = clip(b.email, 320)?.toLowerCase()
  if (!organization || !contact || !email || !EMAIL.test(email) || !ORG_TYPES.includes(String(b.org_type)) || !DECISIONS.includes(String(b.decision))) {
    return NextResponse.json({ error: "Please complete the required fields." }, { status: 422 })
  }
  await authDb.query(
    `insert into agency_inquiries (organization, org_type, contact_name, contact_title, email, phone, company, decision, deadline, jurisdiction, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [organization, b.org_type, contact, clip(b.contact_title, 200), email, clip(b.phone, 50), clip(b.company, 300), b.decision, clip(b.deadline, 200), clip(b.jurisdiction, 300), clip(b.notes, 5000)])
  const staff = (process.env.EVALUATOR_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean)
  await Promise.allSettled(staff.map((to) => sendEmail(to, `New inquiry from a public body: ${organization}`,
    `${contact} at ${organization} asked about a government-directed assessment (${b.decision}).\n\nReview it: ${SITE}/evaluator/engagements\n\nTBRAC`)))
  return NextResponse.json({ ok: true })
}
