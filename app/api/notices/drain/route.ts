import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth, authDb } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { isEvaluator } from "@/lib/evaluators"

// Sends queued status-change notices (Methodology §9). The API queues them in status_notices;
// this route holds the email key. Called by the daily Vercel cron (after the monitoring run) and
// right after an evaluator changes a rating's status.

const SITE = process.env.BETTER_AUTH_URL || "https://tbrac.org"
const MAX_ATTEMPTS = 5

interface Notice {
  id: string; report_number: string | null; kind: string; recipient_name: string | null; recipient_email: string
  audience: "relying_party" | "company"; subject_name: string; status: string; status_note: string | null; test: boolean
}

const LINE_EN: Record<string, string> = {
  under_review: "The rating is Under Review and may change. Do not rely on it for new decisions until the review is resolved.",
  affirmed: "The review is complete and the rating was affirmed. It is current again.",
  reopened: "The rating has been reopened for re-rating and is no longer current.",
  withdrawn: "The rating has been withdrawn and must not be relied on.",
  expired: "The rating has expired at the end of its validity period and must not be relied on.",
}
const LINE_ZH: Record<string, string> = {
  under_review: "该评级目前处于“审查中”，可能发生变化。在审查结束前，请勿据此作出新的决定。",
  affirmed: "审查已完成，评级已获确认，现重新有效。",
  reopened: "该评级已重新开启评级程序，目前不再有效。",
  withdrawn: "该评级已被撤回，不得再予依赖。",
  expired: "该评级已在有效期届满时过期，不得再予依赖。",
}
const STATUS_ZH: Record<string, string> = { Current: "有效", "Under Review": "审查中", Withdrawn: "已撤回", Expired: "已过期", Superseded: "已被取代" }

function compose(n: Notice): { subject: string; text: string } {
  const url = `${SITE}/verify/${n.report_number}`
  const test = n.test ? "[TEST] " : ""
  const subject = `${test}TBRAC report ${n.report_number}: ${n.status} (${n.subject_name})`
  const en = [
    n.test ? "TEST NOTICE: this concerns a dummy company used by TBRAC staff, not a real report.\n" : "",
    `The status of TBRAC report ${n.report_number} for ${n.subject_name} has changed.`,
    "",
    `Current status: ${n.status}`,
    n.status_note ? n.status_note : "",
    LINE_EN[n.kind] ?? "",
    "",
    `Check the live status, fingerprint and TBRAC signature at ${url}`,
    "",
    n.audience === "company"
      ? "You receive this as the company assessed in this report."
      : "You receive this because you are listed as a party relying on this report.",
    "A TBRAC report is a private certification issued by Assurance Pacific Assessments LLC under its published methodology. It is not a government certification, approval or license.",
  ].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n")
  if (n.audience !== "company") return { subject, text: `${en}\n\nTBRAC · Assurance Pacific Assessments LLC` }
  const zh = [
    `TBRAC 报告 ${n.report_number}（${n.subject_name}）的状态已更新。`,
    `当前状态：${STATUS_ZH[n.status] ?? n.status}`,
    LINE_ZH[n.kind] ?? "",
    `请在 ${url} 查询实时状态、数字指纹和 TBRAC 签名。`,
  ].join("\n")
  return { subject, text: `${en}\n\n———\n\n${zh}\n\nTBRAC · Assurance Pacific Assessments LLC` }
}

async function drain(): Promise<{ sent: number; failed: number }> {
  // Claim a batch atomically, so overlapping runs never send the same notice twice.
  const { rows } = await authDb.query<Notice>(`
    update status_notices set attempts = attempts + 1
    where id in (select id from status_notices where sent_at is null and attempts < $1 order by created_at limit 50 for update skip locked)
    returning id, report_number, kind, recipient_name, recipient_email, audience, subject_name, status, status_note, test`, [MAX_ATTEMPTS])
  let sent = 0, failed = 0
  for (const n of rows) {
    try {
      const { subject, text } = compose(n)
      await sendEmail(n.recipient_email, subject, text)
      await authDb.query("update status_notices set sent_at = now(), last_error = null where id = $1", [n.id])
      sent++
    } catch (e) {
      await authDb.query("update status_notices set last_error = $2 where id = $1", [n.id, (e instanceof Error ? e.message : String(e)).slice(0, 500)])
      failed++
    }
  }
  return { sent, failed }
}

// Vercel cron (Authorization: Bearer $CRON_SECRET).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 })
  }
  return NextResponse.json(await drain())
}

// An evaluator, right after changing a rating's status.
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!isEvaluator(session?.user)) return NextResponse.json({ error: "Evaluator access required" }, { status: 403 })
  return NextResponse.json(await drain())
}
