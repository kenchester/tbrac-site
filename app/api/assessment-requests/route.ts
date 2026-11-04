import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { backendFetch } from "@/lib/server-api"

interface Created {
  id: string; customer_id: string; contact_name: string; contact_title: string | null; contact_phone: string | null
  project_description: string; relying_party: string | null; timeline: string | null; engagement_type: string
}

/**
 * Company asks for a comprehensive assessment. The API creates the request (and checks
 * ownership); this route then emails the evaluators and sends the company a confirmation.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  const { customer_id, ...body } = (await request.json()) as { customer_id: string; language?: string } & Record<string, unknown>

  const res = await backendFetch(`/api/v1/customers/${encodeURIComponent(customer_id)}/assessment-requests`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
  if (!res) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  if (!res.ok) return new NextResponse(res.body, { status: res.status, headers: res.headers })
  const r = (await res.json()) as Created

  const companyRes = await backendFetch(`/api/v1/customers/${encodeURIComponent(customer_id)}`)
  const company = companyRes?.ok ? ((await companyRes.json()) as { name: string }).name : "a company"
  const base = process.env.BETTER_AUTH_URL || "https://tbrac.org"

  // Email failures don't undo the request: evaluators also see it in the portal.
  const evaluators = (process.env.EVALUATOR_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean)
  const details = [
    `Company: ${company}`,
    `Contact: ${r.contact_name}${r.contact_title ? `, ${r.contact_title}` : ""} <${session.user.email}>${r.contact_phone ? ` · ${r.contact_phone}` : ""}`,
    `Project: ${r.project_description}`,
    `Relying party: ${r.relying_party ?? "—"}`,
    `Timeline: ${r.timeline ?? "—"}`,
    `Type: ${r.engagement_type}`,
  ].join("\n")
  await Promise.allSettled(evaluators.map((to) => sendEmail(to, `New comprehensive assessment request: ${company}`,
    `${details}\n\nOpen it in the evaluator portal: ${base}/evaluator/engagements`)))

  const zh = body.language === "zh"
  const confirm = [
    `Thank you. TBRAC has received your request for a comprehensive assessment of ${company}. An analyst will contact you within two business days to discuss scope, timing and fees.`,
    "",
    details,
    "",
    "Nothing is assessed or published until we agree the engagement terms with you.",
    "",
    "— TBRAC",
  ]
  const confirmZh = [
    `感谢您的申请。TBRAC 已收到为 ${company} 进行全面评估的请求。分析师将在两个工作日内与您联系，商讨评估范围、时间安排和费用。`,
    "",
    "在与您商定评估条款之前，我们不会开展任何评估或发布任何内容。",
    "",
    "— TBRAC",
  ]
  await sendEmail(session.user.email, zh ? `TBRAC 已收到您的全面评估申请 / Request received` : "TBRAC: your comprehensive assessment request",
    (zh ? [...confirmZh, "", "----------------------------------------", "", ...confirm] : [...confirm, "", "----------------------------------------", "", ...confirmZh]).join("\n"))
    .catch(() => {})

  return NextResponse.json(r, { status: 201 })
}
