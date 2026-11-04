import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth, authDb } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { isEvaluator } from "@/lib/evaluators"
import { backendFetch } from "@/lib/server-api"

type Params = { params: Promise<{ id: string }> }
interface Notice {
  customer_id: string
  customer_name: string
  contact_user_id: string | null
  requests: { title: string; status: string; due_date: string | null; reviewer_note: string | null }[]
}

const day = (d: string) => d.slice(0, 10)

/** Email the company the document requests awaiting its answer (English and Chinese). */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ detail: "Evaluators only" }, { status: 403 })

  // The API re-checks evaluator access and returns only what the email needs.
  const res = await backendFetch(`/api/v1/engagements/${encodeURIComponent(id)}/document-requests/notice`)
  if (!res?.ok) return NextResponse.json({ detail: "Could not load the engagement" }, { status: res?.status ?? 401 })
  const n = (await res.json()) as Notice
  if (!n.requests.length) return NextResponse.json({ detail: "No requests are awaiting the company's answer" }, { status: 422 })
  if (!n.contact_user_id) return NextResponse.json({ detail: "This company has no account contact" }, { status: 422 })

  const { rows } = await authDb.query<{ email: string; name: string | null }>(
    `select email, name from "user" where id = $1`, [n.contact_user_id])
  const to = rows[0]?.email
  if (!to) return NextResponse.json({ detail: "The company's contact user was not found" }, { status: 422 })

  const base = process.env.BETTER_AUTH_URL || "https://tbrac.org"
  const link = `${base}/customers/${n.customer_id}/requests`
  const en = n.requests.map((r) => `- ${r.title}${r.due_date ? ` (due ${day(r.due_date)})` : ""}${r.status === "returned" ? ` — returned: ${r.reviewer_note ?? ""}` : ""}`).join("\n")
  const zh = n.requests.map((r) => `- ${r.title}${r.due_date ? `（截止 ${day(r.due_date)}）` : ""}${r.status === "returned" ? ` — 已退回：${r.reviewer_note ?? ""}` : ""}`).join("\n")
  const text = [
    `Hello${rows[0].name ? ` ${rows[0].name}` : ""},`,
    "",
    `As part of the comprehensive assessment of ${n.customer_name}, TBRAC has ${n.requests.length} document request(s) awaiting your response:`,
    "",
    en,
    "",
    `Please sign in and respond here: ${link}`,
    "Each response is made under an officer's attestation. If you cannot provide an item, choose \"Cannot provide\" and explain why.",
    "",
    "— TBRAC",
    "",
    "----------------------------------------",
    "",
    `您好，`,
    "",
    `作为对 ${n.customer_name} 的全面评估的一部分，TBRAC 有 ${n.requests.length} 项文件请求等待您回复（文件标题为英文）：`,
    "",
    zh,
    "",
    `请登录并在此回复：${link}`,
    "每项回复均需由一名高级管理人员作出声明。如无法提供某项文件，请选择“无法提供”并说明原因。",
    "",
    "— TBRAC",
  ].join("\n")

  try {
    await sendEmail(to, `TBRAC document requests for ${n.customer_name} / 文件请求`, text)
  } catch (e) {
    return NextResponse.json({ detail: `Email failed: ${e instanceof Error ? e.message : "unknown error"}` }, { status: 502 })
  }
  await backendFetch(`/api/v1/engagements/${encodeURIComponent(id)}/document-requests/notice`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, count: n.requests.length }),
  })
  return NextResponse.json({ to, count: n.requests.length })
}
