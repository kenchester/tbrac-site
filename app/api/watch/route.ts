import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { authDb } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { allow, clientIp } from "@/lib/rate-limit"

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000"
const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex")

// Public: start watching a report, or ask for a fresh manage link. The token is created here and
// only ever leaves in the email, so the address must be opened to confirm; the API has no endpoint
// that hands one out. The answer is the same whether or not the address was known.
export async function POST(request: Request) {
  if (!(await allow(`watch:${clientIp(request)}`, 10, 3600)) || !(await allow("watch:all", 200, 3600))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string; report_number?: string; organization?: string }
  const email = (body.email ?? "").trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 320) return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 })
  const number = (body.report_number ?? "").trim().toUpperCase()

  if (number) {
    if (number.length > 30) return NextResponse.json({ detail: "No report with that number" }, { status: 404 })
    const known = await fetch(`${API_ORIGIN}/api/v1/public/verify/${encodeURIComponent(number)}`, { cache: "no-store" })
    if (!known.ok) return NextResponse.json({ detail: "No report with that number" }, { status: 404 })
    const org = (body.organization ?? "").trim().slice(0, 300) || null
    const { rows } = await authDb.query<{ id: string }>(
      `insert into watchers (id, email, token_hash, created_at, organization) values (gen_random_uuid(), $1, $2, now(), $3)
       on conflict (email) do update set email = excluded.email returning id`, [email, sha256(randomBytes(32).toString("hex")), org])
    await authDb.query("insert into watch_items (watcher_id, report_number, added_at) values ($1, $2, now()) on conflict do nothing", [rows[0].id, number])
  }

  // A fresh link replaces the old one, at most every 2 minutes per address.
  const token = randomBytes(32).toString("base64url")
  const { rowCount } = await authDb.query(
    `update watchers set token_hash = $2, link_sent_at = now() where email = $1 and (link_sent_at is null or link_sent_at < now() - interval '2 minutes')`,
    [email, sha256(token)])
  if (rowCount) {
    const link = `${SITE}/watch/${token}`
    const lines = number
      ? [`Open this link to confirm that you want an email whenever the status of TBRAC report ${number} changes:`, "", link, "",
         "The same link is your private watchlist page: add or remove reports, or unsubscribe. If you didn't ask for this, ignore this email; nothing is sent until the link is opened."]
      : ["Your private TBRAC watchlist link:", "", link, "", "It replaces any earlier link. If you didn't ask for it, you can ignore this email."]
    await sendEmail(email, number ? "Confirm TBRAC status alerts" : "Your TBRAC watchlist link",
      [...lines, "", "Alerts contain only the public status shown at tbrac.org/verify.", "", "TBRAC · Assurance Pacific Assessments LLC"].join("\n")).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
