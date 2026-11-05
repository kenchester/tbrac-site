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
  id: string; engagement_id: string; report_number: string | null; kind: string; recipient_name: string | null; recipient_email: string
  audience: "relying_party" | "company"; subject_name: string; status: string; status_note: string | null; test: boolean
}

const LINE_EN: Record<string, string> = {
  under_review: "The rating is Under Review and may change. Do not rely on it for new decisions until the review is resolved.",
  affirmed: "The review is complete and the rating was affirmed. It is current again.",
  reopened: "The rating has been reopened for re-rating and is no longer current.",
  withdrawn: "The rating has been withdrawn and must not be relied on.",
  expired: "The rating has expired at the end of its validity period and must not be relied on.",
  superseded: "This rating has been replaced by a re-evaluation on new evidence. Rely on the new report named in the status note.",
}
const LINE_ZH: Record<string, string> = {
  under_review: "该评级目前处于“审查中”，可能发生变化。在审查结束前，请勿据此作出新的决定。",
  affirmed: "审查已完成，评级已获确认，现重新有效。",
  reopened: "该评级已重新开启评级程序，目前不再有效。",
  withdrawn: "该评级已被撤回，不得再予依赖。",
  expired: "该评级已在有效期届满时过期，不得再予依赖。",
  superseded: "该评级已被基于新证据的重新评估所取代，请以状态说明中所列的新报告为准。",
}
const STATUS_ZH: Record<string, string> = { Current: "有效", "Under Review": "审查中", Withdrawn: "已撤回", Expired: "已过期", Superseded: "已被取代" }

const SIGN = "TBRAC · Assurance Pacific Assessments LLC"
const longDate = (iso: string, zh = false) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(zh ? "zh-CN" : "en-US", { dateStyle: "long", timeZone: "UTC" })

/** Reminders (expiry, overdue requests, reply waiting, Under Review deadline). Null for status-change notices. */
function reminder(n: Notice): { subject: string; text: string } | null {
  const test = n.test ? "[TEST] " : ""
  const dash = `${SITE}/company/profile`
  const [a, b] = (n.status_note ?? "").split("|")
  if (n.kind.startsWith("expiry_")) {
    return { subject: `${test}Your TBRAC rating expires on ${longDate(a)}`, text: [
      `The TBRAC rating for ${n.subject_name} (report ${n.report_number}) is valid until ${longDate(a)}, ${b} days from now.`,
      "To keep a current rating for the counties, agencies and partners who rely on it, request a re-evaluation from your dashboard. It rates you again on up-to-date evidence and starts a new 12-month validity.",
      `Your dashboard: ${dash}`, "", "———", "",
      `${n.subject_name} 的 TBRAC 评级（报告 ${n.report_number}）有效期至 ${longDate(a, true)}，距今 ${b} 天。`,
      "如需继续向依赖该评级的县政府、机构和合作伙伴提供有效评级，请在概览页面申请重新评估。重新评估将依据最新证据重新评级，并重新开始 12 个月有效期。",
      `您的概览页面：${dash}`, "", SIGN].join("\n") }
  }
  if (n.kind === "requests_overdue") {
    return { subject: `${test}TBRAC: ${a} document request${a === "1" ? "" : "s"} past due`, text: [
      `${a} document request${a === "1" ? " is" : "s are"} past due in the comprehensive assessment of ${n.subject_name}. Please answer, or tell TBRAC why an item can't be provided; a refusal with a reason is recorded, not held against you without explanation.`,
      `Your requests: ${dash}`, "", "———", "",
      `${n.subject_name} 的全面评估中有 ${a} 项文件请求已逾期。请尽快回复，或告知 TBRAC 无法提供的原因；附理由的拒绝将被如实记录。`,
      `您的文件请求：${dash}`, "", SIGN].join("\n") }
  }
  if (n.kind === "reply_waiting") {
    const overdue = b === "overdue"
    return { subject: `${test}TBRAC: your reply to the draft findings ${overdue ? "is overdue" : `is due ${longDate(a)}`}`, text: [
      `TBRAC shared draft factual findings with ${n.subject_name} for correction before the committee decides. ${overdue ? `The reply was due on ${longDate(a)}.` : `Your reply is due by ${longDate(a)}.`} Your response appears in the report.`,
      `Review and reply: ${dash}`, "", "———", "",
      `TBRAC 已向 ${n.subject_name} 提供事实性调查结果草稿，供委员会决定前更正。${overdue ? `回复期限为 ${longDate(a, true)}，现已逾期。` : `请于 ${longDate(a, true)} 前回复。`}您的回复将纳入报告。`,
      `查看并回复：${dash}`, "", SIGN].join("\n") }
  }
  if (n.kind === "review_deadline") {
    const overdue = b === "overdue"
    return { subject: `${test}Under Review ${overdue ? "overdue" : "deadline"}: ${n.subject_name} (${longDate(a)})`, text: [
      `${n.subject_name} (report ${n.report_number}) has been Under Review and must be resolved ${overdue ? `since ${longDate(a)}; it is overdue` : `by ${longDate(a)}`} (Methodology §9: 90 days).`,
      "Affirm, reopen for re-rating, or withdraw in the Monitoring tab.",
      `${SITE}/evaluator/engagements/${n.engagement_id}`, "", SIGN].join("\n") }
  }
  return null
}

function compose(n: Notice): { subject: string; text: string } {
  const r = reminder(n)
  if (r) return r
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
    returning id, engagement_id, report_number, kind, recipient_name, recipient_email, audience, subject_name, status, status_note, test`, [MAX_ATTEMPTS])
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
