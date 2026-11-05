import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { isEvaluator } from "@/lib/evaluators"
import { backendFetch } from "@/lib/server-api"

const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"

// Creates a private report link through the API and emails it to the recipient. The token is
// only ever in this response and the email; the API stores its hash.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ error: "Evaluator access required" }, { status: 403 })
  const body = await request.text()
  const res = await backendFetch(`/api/v1/engagements/${id}/shares`, { method: "POST", headers: { "Content-Type": "application/json" }, body })
  if (!res) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const data = await res.json()
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  const link = `${SITE}/r/${data.token}`
  const expires = new Date(data.expires_at).toLocaleDateString("en-US", { dateStyle: "long" })
  let emailed = true
  try {
    await sendEmail(data.recipient_email, `TBRAC restricted report ${data.report_number}`, [
      `Dear ${data.recipient_name},`,
      "",
      `TBRAC has shared restricted report ${data.report_number} with you for ${data.relying_party}.`,
      "",
      `Open it here: ${link}`,
      "",
      `Before the report opens you will be asked to accept TBRAC's reliance terms. The link is for you only, expires on ${expires}, and every view is recorded.`,
      `You can check the report's live public status at any time at ${SITE}/verify/${data.report_number}.`,
      "",
      "A TBRAC report is a private certification issued by Assurance Pacific Assessments LLC under its published methodology. It is not a government certification, approval or license.",
      "",
      "TBRAC · Assurance Pacific Assessments LLC",
    ].join("\n"))
  } catch { emailed = false }
  const { token: _omit, ...share } = data
  void _omit
  return NextResponse.json({ ...share, link, emailed }, { status: 201 })
}
