"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, CheckCircle2 } from "lucide-react"
import { MarketingShell, NAVY } from "@/components/marketing-shell"
import { EarlyAccessBox } from "@/components/early-access-box"
import { useAuth } from "@/lib/auth-context"
import { earlyAccessApi, savedEarlyCode } from "@/lib/certifications"
import { useLanguage } from "@/lib/language-context"

const C = {
  en: {
    title: "Comprehensive assessment",
    lead: "An independent review of your company's ownership, links and controls, leading to a TBRAC private certification that US counties, state agencies and partners can verify.",
    soon: "Opening to all companies soon. If TBRAC invited you to test it, enter your code below to start now, free of charge.",
    hint: "Enter the code TBRAC gave you.", go: "Continue",
    okTitle: "Code accepted", okText: "Create your company account to continue. It saves your progress, so you can stop and come back at any time.",
    signup: "Create an account", signin: "I already have an account",
    moving: "Code accepted. Opening your dashboard…",
    open: "Requests are open to every company.", start: "Get started",
    what: "What it involves",
    points: [
      "You send a short request describing your project and who will rely on the report.",
      "A TBRAC analyst agrees the scope with you, then asks for documents (company records, ownership, policies) through your dashboard.",
      "Documents are verified, your ownership chain is screened against US lists, and findings are graded by their evidence.",
      "A second reviewer checks the work and a committee with an independent chair decides your rating, which TBRAC certifies.",
    ],
    limit: "A TBRAC certification is private, issued by Assurance Pacific Assessments LLC under its published methodology. It is not a government certification, approval or license.",
  },
  zh: {
    title: "全面评估",
    lead: "对贵公司的所有权、关联关系和内部控制进行独立审查，形成美国县政府、州机构和合作伙伴可以核验的 TBRAC 私营机构认证。",
    soon: "即将向所有企业开放。如您受 TBRAC 邀请参与测试，请在下方输入体验码，即可免费立即开始。",
    hint: "请输入 TBRAC 提供的体验码。", go: "继续",
    okTitle: "体验码已确认", okText: "请创建企业账户以继续。账户会保存您的进度，您可以随时中断后继续。",
    signup: "创建账户", signin: "我已有账户",
    moving: "体验码已确认，正在打开您的概览页面…",
    open: "全面评估现已向所有企业开放。", start: "开始",
    what: "评估流程",
    points: [
      "您提交一份简短申请，说明项目情况以及将依赖报告的机构。",
      "TBRAC 分析师与您确认评估范围，然后通过您的概览页面请求文件（公司登记、所有权、制度等）。",
      "核实文件，按美国名单筛查所有权链，并依据证据强度对调查结果分级。",
      "第二审核人复核，由设独立主席的委员会决定评级，并由 TBRAC 予以认证。",
    ],
    limit: "TBRAC 认证是 Assurance Pacific Assessments LLC 依据其公开评估方法出具的私营机构认证，不是政府认证、批准或许可。",
  },
}

/** The page to send testers: code first, then account, then straight to the request form on their dashboard. */
export default function ComprehensivePage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  const router = useRouter()
  const { user, loading } = useAuth()
  const [open, setOpen] = useState<boolean | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [initial, setInitial] = useState("")

  useEffect(() => {
    earlyAccessApi.status().then((s) => setOpen(s.open))
    setInitial(new URLSearchParams(window.location.search).get("code") ?? "")
  }, [])

  const accept = (code: string) => { savedEarlyCode.set(code); setAccepted(true) }
  // Signed in already: go straight to the dashboard, where the request form opens with the code.
  useEffect(() => { if (accepted && user) router.push("/company/profile") }, [accepted, user, router])

  return (
    <MarketingShell title={c.title} lead={c.lead}>
      <section className="max-w-2xl space-y-5">
        {open === true ? (
          <>
            <p className="text-[15px] text-slate-700">{c.open}</p>
            <Link href={user ? "/company/profile" : "/company/login?tab=signup"} className="inline-block rounded-md px-5 py-3 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.start}</Link>
          </>
        ) : open === false && !accepted ? (
          <>
            <p className="text-[15px] leading-relaxed text-slate-700">{c.soon}</p>
            <EarlyAccessBox key={initial} initial={initial} hint={c.hint} cta={c.go} check={(code) => earlyAccessApi.checkPublic(code)} onAccepted={accept} />
          </>
        ) : accepted && (user || loading) ? (
          <p className="flex items-center gap-2 text-[15px] font-medium text-emerald-800"><CheckCircle2 className="h-5 w-5" />{c.moving}</p>
        ) : accepted ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-950"><CheckCircle2 className="h-5 w-5" />{c.okTitle}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-emerald-950/90">{c.okText}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/company/login?tab=signup" className="rounded-md px-5 py-2.5 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.signup}</Link>
              <Link href="/company/login" className="rounded-md border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-100">{c.signin}</Link>
            </div>
          </div>
        ) : null}
      </section>

      <section className="max-w-3xl">
        <h2 className="text-xl font-semibold">{c.what}</h2>
        <ul className="mt-4 space-y-3">
          {c.points.map((p) => <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-slate-700"><Check className="mt-1 h-4 w-4 shrink-0 text-sky-800" />{p}</li>)}
        </ul>
        <p className="mt-6 text-sm text-slate-500">{c.limit}</p>
      </section>
    </MarketingShell>
  )
}
