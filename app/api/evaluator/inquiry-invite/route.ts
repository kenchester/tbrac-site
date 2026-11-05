import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { isEvaluator } from "@/lib/evaluators"
import { backendFetch } from "@/lib/server-api"

const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"

// Invites the company named in an agency inquiry. The token goes only into this email.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ error: "Evaluator access required" }, { status: 403 })
  const { inquiry_id, ...body } = (await request.json()) as { inquiry_id: string } & Record<string, unknown>
  if (!/^[0-9a-f-]{36}$/.test(inquiry_id ?? "")) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  const res = await backendFetch(`/api/v1/agency-inquiries/${inquiry_id}/invite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  if (!res) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const d = await res.json()
  if (!res.ok) return NextResponse.json(d, { status: res.status })
  const link = `${SITE}/invite/${d.token}`
  let emailed = true
  try {
    await sendEmail(d.email, `${d.organization} has asked TBRAC to assess ${d.company_name}`, [
      `Dear ${d.contact_name},`, "",
      `${d.organization} has asked TBRAC for a comprehensive assessment of ${d.company_name}. To take part, open this link and sign in or create your company's account:`, "", link, "",
      "The link is valid for 30 days. TBRAC will then send your engagement letter. A TBRAC report is a private certification under a published methodology, not a government certification or approval.", "",
      "———", "",
      `${d.organization} 已委托 TBRAC 对 ${d.company_name} 进行全面评估。如需参与，请打开以下链接，登录或创建企业账户：`, "", link, "",
      "链接 30 天内有效。TBRAC 随后将向您发送委托书。", "",
      "TBRAC · Assurance Pacific Assessments LLC",
    ].join("\n"))
  } catch { emailed = false }
  return NextResponse.json({ email: d.email, link, emailed }, { status: 201 })
}
