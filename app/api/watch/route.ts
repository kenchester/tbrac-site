import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { allow, clientIp } from "@/lib/rate-limit"

const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8000"
const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"

// Public: start watching a report (confirm by email), or ask for a fresh manage link.
// The answer is the same whether or not the address was known, so it can't be used to probe.
export async function POST(request: Request) {
  if (!(await allow(`watch:${clientIp(request)}`, 10, 3600)) || !(await allow("watch:all", 200, 3600))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string; report_number?: string; organization?: string }
  const path = body.report_number ? "/api/v1/public/watch" : "/api/v1/public/watch/link"
  const res = await fetch(`${API_ORIGIN}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  if (data.token) {
    const link = `${SITE}/watch/${data.token}`
    const lines = body.report_number
      ? [`Open this link to confirm that you want an email whenever the status of TBRAC report ${data.report_number} changes:`, "", link, "",
         "The same link is your private watchlist page: add or remove reports, or unsubscribe. If you didn't ask for this, ignore this email; nothing is sent until the link is opened."]
      : ["Your private TBRAC watchlist link:", "", link, "", "It replaces any earlier link. If you didn't ask for it, you can ignore this email."]
    await sendEmail(data.email, body.report_number ? "Confirm TBRAC status alerts" : "Your TBRAC watchlist link",
      [...lines, "", "Alerts contain only the public status shown at tbrac.org/verify.", "", "TBRAC · Assurance Pacific Assessments LLC"].join("\n")).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
