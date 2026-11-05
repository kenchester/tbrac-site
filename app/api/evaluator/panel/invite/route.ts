import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { isEvaluator } from "@/lib/evaluators"
import { backendFetch } from "@/lib/server-api"

const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"

// Invites (or re-invites) a panelist: the API returns a one-time token, which goes only into the email.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ error: "Evaluator access required" }, { status: 403 })
  const { round_id, panelist_id, ...person } = (await request.json()) as { round_id: string; panelist_id?: string; name?: string; email?: string; role?: string }
  if (!/^[0-9a-f-]{36}$/.test(round_id ?? "") || (panelist_id && !/^[0-9a-f-]{36}$/.test(panelist_id))) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  const res = await backendFetch(panelist_id ? `/api/v1/panel/rounds/${round_id}/panelists/${panelist_id}/reissue` : `/api/v1/panel/rounds/${round_id}/panelists`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(person) })
  if (!res) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const data = await res.json()
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  const link = `${SITE}/panel/${data.token}`
  const closes = data.closes_at ? ` Please respond by ${new Date(data.closes_at).toLocaleDateString("en-US", { dateStyle: "long" })}.` : ""
  let emailed = true
  try {
    await sendEmail(data.email, `TBRAC expert panel: ${data.title}`, [
      `Dear ${data.name},`,
      "",
      `Thank you for serving on the TBRAC expert panel. In this round (${data.title}, methodology ${data.target_version}) you compare the seven risk domains two at a time: 21 short judgments, about 20 minutes.${closes}`,
      "",
      `Your private link: ${link}`,
      "",
      "The page shows your consistency ratio as you go and points to any comparisons that pull it out of line. You can save and come back before submitting. Your individual answers are seen only by the TBRAC facilitator; published results show the panel's combined weights and its composition by role, never names.",
      "",
      "TBRAC · Assurance Pacific Assessments LLC",
    ].join("\n"))
  } catch { emailed = false }
  return NextResponse.json({ id: data.id, name: data.name, email: data.email, link, emailed }, { status: 201 })
}
