"use client"

import Link from "next/link"
import { Mail } from "lucide-react"
import { H2, MarketingShell, NAVY, SIGNUP } from "@/components/marketing-shell"
import { useLanguage } from "@/lib/language-context"

const EMAIL = "evaluations@tbrac.org"
const C = {
  en: {
    title: "Contact TBRAC",
    lead: "Questions about an assessment, a report or working with TBRAC. We usually reply within one to two business days.",
    write: "Write to us", paths: "Where to start",
    rows: [
      ["Companies", "Start with the free self-assessment. From your results you can request a comprehensive assessment; an analyst will contact you.", SIGNUP, "Start the free self-assessment"],
      ["Counties, agencies and partners", "Ask about a government-directed assessment, a reliance letter, or access to a report a company has shared with you.", `mailto:${EMAIL}?subject=Government-directed%20assessment`, "Email about an assessment"],
      ["Checking a report", "Enter the report number to see its live status, fingerprint and signature, and sign up for status alerts.", "/verify", "Verify a report"],
    ],
    entity: "Assurance Pacific Assessments LLC, a Michigan limited liability company based in California, operates TBRAC.",
  },
  zh: {
    title: "联系 TBRAC",
    lead: "有关评估、报告或与 TBRAC 合作的问题。我们通常在一至两个工作日内回复。",
    write: "发送邮件", paths: "从哪里开始",
    rows: [
      ["企业", "请先进行免费自我评估。您可以根据评估结果申请全面评估，分析师将与您联系。", SIGNUP, "开始免费自我评估"],
      ["县政府、机构和合作伙伴", "咨询政府主导的评估、依赖函，或获取企业已与您分享的报告。", `mailto:${EMAIL}?subject=Government-directed%20assessment`, "就评估发送邮件"],
      ["核验报告", "输入报告编号，查看实时状态、数字指纹和签名，并订阅状态提醒。", "/verify", "核验报告"],
    ],
    entity: "TBRAC 由 Assurance Pacific Assessments LLC 运营，该公司为在密歇根州注册、总部位于加利福尼亚州的有限责任公司。",
  },
}

export default function ContactPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  return (
    <MarketingShell title={c.title} lead={c.lead}>
      <section>
        <H2>{c.write}</H2>
        <a href={`mailto:${EMAIL}`} className="mt-4 inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white" style={{ background: NAVY }}>
          <Mail className="h-4 w-4" />{EMAIL}
        </a>
      </section>
      <section>
        <H2>{c.paths}</H2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {c.rows.map(([who, text, href, cta]) => (
            <div key={who} className="border-t-2 border-slate-900 pt-4">
              <h3 className="font-semibold text-slate-900">{who}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
              <Link href={href} className="mt-3 inline-block text-sm font-semibold text-sky-800 hover:underline">{cta}</Link>
            </div>
          ))}
        </div>
      </section>
      <p className="text-sm text-slate-500">{c.entity}</p>
    </MarketingShell>
  )
}
