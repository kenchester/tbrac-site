"use client"

import { FeeSchedule } from "@/components/fee-schedule"
import { ComingSoonNotice } from "@/components/coming-soon-notice"
import Link from "next/link"
import { ArrowRight, Check, Lock, Scale, FileText, Eye, ShieldCheck, MessageSquareText } from "lucide-react"
import { H2, MarketingShell, NAVY, SIGNUP } from "@/components/marketing-shell"
import { useLanguage } from "@/lib/language-context"

const ICONS = [Lock, Eye, ShieldCheck, FileText]

const C = {
  en: {
    title: "Answer US partners' questions once, on the record",
    lead: "Counties, states, landlords, lenders and customers increasingly ask companies with Chinese ownership or ties about ownership, state links, data and supply chains before they sign. A TBRAC assessment answers those questions with verified evidence, in a report they can rely on.",
    ctaFree: "Start the free self-assessment", ctaFull: "Explore a comprehensive assessment",
    whyTitle: "Why you are being asked",
    why: [
      "Many US states now restrict land purchases, incentives or contracts for companies linked to certain foreign governments, and the definitions differ from state to state.",
      "Local officials must explain their decisions to the public, and often cannot verify a company's own answers themselves.",
      "Federal review, where it applies, does not answer every question a county or partner has, and its reasoning is not shared with them.",
      "A clear, documented answer early in the process is usually faster than repeated questionnaires from each counterparty.",
    ],
    stepsTitle: "Two steps",
    steps: [
      ["1. Free self-assessment", "Ten short modules, in English or Chinese, covering the same risk areas as the full assessment. You get an indicative score and the issues to address first. It is private and nothing is published."],
      ["2. Comprehensive assessment", "TBRAC verifies your information against official registries and independent sources, screens your ownership chain against US lists, and a committee with an independent chair decides a rated report with a public summary, valid for 12 months."],
    ],
    provideTitle: "What you will be asked to provide",
    provideLead: "A standard document list, scaled to your project. Every production is made under an officer's attestation.",
    provide: [
      "Your full ownership chain, to natural persons and any state bodies",
      "Articles of association and shareholder agreements",
      "Director and officer backgrounds, including government roles",
      "Export-control and data-handling arrangements",
      "Supplier information for high-risk inputs",
      "Audited financial statements and banking relationships",
    ],
    provideNote: "You can decline any item and explain why, for example where PRC law prevents export. A refusal is recorded as such; TBRAC never tries to obtain the information another way.",
    protectTitle: "How your information is protected",
    protect: [
      ["Confidential by default", "The full report goes only to the parties you agree, each of whom signs a reliance letter. The public summary contains the rating, confidence, status, validity and scope, and no confidential findings."],
      ["Controlled access", "Documents are kept in private storage. TBRAC staff sign in with two-factor authentication, and every time anyone opens one of your documents it is logged."],
      ["Lawful methods only", "No pretext calls, no purchased non-public data and no mainland proxies. Where material leaves China, it does so under a PRC-law opinion that it may lawfully be exported."],
      ["AI only with your consent", "AI tools help analysts read documents and check consistency, but only if your engagement letter allows it, and they never decide anything."],
    ],
    fairTitle: "A fair process",
    fair: [
      ["Right of reply", "Before any decision, you see the draft factual findings and can correct them. Your response is included in the report."],
      ["One flat fee", "The same fee for every company, whatever its size, agreed in advance and never linked to the result."],
      ["No conflicts", "TBRAC does not provide consulting to companies it assesses, which is what makes the report credible to the other side."],
      ["Decided by a committee", "Analysts score; a second reviewer checks; a committee with an independent chair decides and records its reasons."],
    ],
    limitsTitle: "What to expect",
    limits: [
      "The rating reflects the evidence. Some companies will receive an elevated rating, and the report will say what conditions would address it.",
      "A TBRAC report is a private certification, not a government certification, approval or guarantee, and it cannot override a state or federal law.",
      "Each counterparty makes its own decision. The report gives them documented evidence to make it with.",
    ],
    feesTitle: "Fees",
    faqTitle: "Common questions",
    faq: [
      ["Do I see the rating before it is issued?", "You see the factual findings and can correct them. The rating is decided by the committee and shown in the issued report."],
      ["Who can see the report?", "The full report: only the parties you agreed. The public summary: anyone with the report number, who can also check whether it is still current."],
      ["What if something changes after the report?", "Ratings are monitored for 12 months. A new listing or ownership change puts the rating Under Review, and anyone checking the report sees the new status."],
      ["Can I do the self-assessment in Chinese?", "Yes. The self-assessment, your dashboard, document requests and the report are available in Simplified Chinese."],
    ],
  },
  zh: {
    title: "一次性、有据可查地回答美国合作方的问题",
    lead: "越来越多的美国县政府、州政府、房东、贷款方和客户在签约前，会询问具有中国所有权或关联的企业有关所有权、国有关联、数据和供应链的问题。TBRAC 评估以经核实的证据回答这些问题，并形成对方可以依赖的报告。",
    ctaFree: "开始免费自我评估", ctaFull: "了解全面评估",
    whyTitle: "为什么您会被问到这些问题",
    why: [
      "美国许多州现在限制与某些外国政府有关联的企业购买土地、获得激励或签订合同，且各州的定义各不相同。",
      "地方官员需要向公众解释其决定，而他们往往无法自行核实企业的自述。",
      "联邦审查（如适用）并不能回答县政府或合作方的所有问题，其理由也不会与他们分享。",
      "在流程早期给出清晰、有据可查的答复，通常比逐一应付各方的问卷更快。",
    ],
    stepsTitle: "两个步骤",
    steps: [
      ["1. 免费自我评估", "10 个简短模块，提供中英文版本，涵盖与完整评估相同的风险领域。您将获得参考分数及需要优先处理的问题。自我评估不公开，也不会发布任何内容。"],
      ["2. 全面评估", "TBRAC 根据官方登记机构和独立来源核实您的信息，按美国名单筛查您的所有权链，由设独立主席的委员会决定带评级的报告和公开摘要，有效期 12 个月。"],
    ],
    provideTitle: "您需要提供什么",
    provideLead: "一份按项目调整的标准文件清单。每次提交均需由一名高级管理人员作出声明。",
    provide: [
      "完整的所有权链，直至自然人及任何国家机构",
      "公司章程和股东协议",
      "董事及高级管理人员背景，包括任何政府职务",
      "出口管制和数据处理安排",
      "高风险投入品的供应商信息",
      "经审计的财务报表和银行关系",
    ],
    provideNote: "您可以拒绝提供任何项目并说明原因，例如中国法律禁止出境的情形。拒绝会如实记录；TBRAC 绝不会以其他方式获取这些信息。",
    protectTitle: "您的信息如何受到保护",
    protect: [
      ["默认保密", "完整报告仅提供给您同意的各方，且每一方均须签署依赖函。公开摘要包含评级、可信度、状态、有效期和范围，不含任何保密调查结果。"],
      ["受控访问", "文件保存在私有存储中。TBRAC 工作人员须通过双重身份验证登录，任何人每次打开您的文件都会被记录。"],
      ["仅采用合法方法", "不使用伪装电话、不购买非公开数据、不借助境内代理。资料出境须依据中国法律意见，确认其可以合法出境。"],
      ["仅在您同意时使用 AI", "AI 工具协助分析师阅读文件和检查一致性，但须您的委托书允许，且 AI 绝不作出任何决定。"],
    ],
    fairTitle: "公平的流程",
    fair: [
      ["答辩权", "在任何决定作出之前，您可以查看初步事实性调查结果并加以更正。您的回复将纳入报告。"],
      ["一个固定费用", "无论企业规模大小，费用均相同，事先约定，且绝不与结果挂钩。"],
      ["没有利益冲突", "TBRAC 不为其评估的企业提供咨询，这正是报告能获得对方信任的原因。"],
      ["由委员会决定", "分析师评分，第二审核人复核，设独立主席的委员会作出决定并记录理由。"],
    ],
    limitsTitle: "您可以预期什么",
    limits: [
      "评级反映证据。部分企业会获得较高风险评级，报告将说明哪些条件可以解决相关问题。",
      "TBRAC 报告是私营机构认证，而非政府认证、批准或担保，也不能凌驾于州法或联邦法律之上。",
      "各合作方自行作出决定。报告为其决定提供有据可查的证据。",
    ],
    feesTitle: "费用",
    faqTitle: "常见问题",
    faq: [
      ["评级出具前我能看到吗？", "您可以看到事实性调查结果并加以更正。评级由委员会决定，并在出具的报告中列明。"],
      ["谁能看到报告？", "完整报告：仅限您同意的各方。公开摘要：任何持有报告编号的人均可查看，并可查询其是否仍然有效。"],
      ["报告出具后如有变化怎么办？", "评级在 12 个月内持续监测。新的列名或所有权变更将使评级进入“审查中”，查询报告的任何人都会看到新的状态。"],
      ["可以用中文完成自我评估吗？", "可以。自我评估、您的控制台、文件请求和报告均提供简体中文版本。"],
    ],
  },
}

export default function ForCompaniesPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  return (
    <MarketingShell title={c.title} lead={c.lead} cta={{ href: SIGNUP, label: c.ctaFree }}>
      <ComingSoonNotice />
      <section>
        <H2>{c.whyTitle}</H2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {c.why.map((x) => <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-slate-700"><Check className="mt-1 h-4 w-4 shrink-0 text-sky-800" />{x}</li>)}
        </ul>
      </section>

      <section>
        <H2>{c.stepsTitle}</H2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {c.steps.map(([t, d], i) => (
            <div key={t} className={`rounded-lg border p-6 ${i ? "border-slate-900" : "border-slate-200"}`}>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <H2>{c.provideTitle}</H2>
          <p className="mt-3 text-[15px] text-slate-600">{c.provideLead}</p>
          <ul className="mt-4 space-y-2 text-[15px] text-slate-700">{c.provide.map((x) => <li key={x} className="flex gap-2"><FileText className="mt-1 h-4 w-4 shrink-0 text-sky-800" />{x}</li>)}</ul>
          <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{c.provideNote}</p>
        </div>
        <div>
          <H2>{c.limitsTitle}</H2>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-700">{c.limits.map((x) => <li key={x} className="flex gap-2"><Scale className="mt-1 h-4 w-4 shrink-0 text-sky-800" />{x}</li>)}</ul>
        </div>
      </section>

      <section>
        <H2>{c.protectTitle}</H2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {c.protect.map(([t, d], i) => {
            const Icon = ICONS[i]
            return <div key={t} className="flex gap-4"><Icon className="mt-1 h-5 w-5 shrink-0 text-sky-800" strokeWidth={1.75} /><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div></div>
          })}
        </div>
      </section>

      <section>
        <H2>{c.fairTitle}</H2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {c.fair.map(([t, d]) => <div key={t} className="border-t-2 border-slate-900 pt-4"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div>)}
        </div>
      </section>

      <section id="fees" className="scroll-mt-24">
        <H2>{c.feesTitle}</H2>
        <div className="mt-6"><FeeSchedule /></div>
      </section>

      <section>
        <H2>{c.faqTitle}</H2>
        <dl className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {c.faq.map(([q, a]) => <div key={q} className="p-5"><dt className="flex gap-2 font-semibold"><MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-sky-800" />{q}</dt><dd className="mt-1 pl-6 text-[15px] leading-relaxed text-slate-600">{a}</dd></div>)}
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href={SIGNUP} className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.ctaFree} <ArrowRight className="h-4 w-4" /></Link>
        <Link href={SIGNUP} className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50">{c.ctaFull}</Link>
      </div>
    </MarketingShell>
  )
}
