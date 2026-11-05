"use client"

import Link from "next/link"
import { ArrowRight, Check, FileText, Landmark, ListChecks, Search, Bell, Scale, Users, BookOpen, Gavel, MessageSquareText } from "lucide-react"
import { H2, MarketingShell, NAVY } from "@/components/marketing-shell"
import { useLanguage } from "@/lib/language-context"

const GET_ICONS = [FileText, Landmark, ListChecks, Bell, Search]
const TRUST_ICONS = [Scale, Users, BookOpen, MessageSquareText, Gavel]

const C = {
  en: {
    title: "A documented basis for decisions about foreign-linked investment",
    lead: "When a company with Chinese ownership or ties seeks incentives, land, a lease or a public contract, councils, boards and economic development staff must weigh risks they often cannot verify themselves. TBRAC provides an independent private certification under a published methodology, much as an auditor's report supports decisions about a company before an IPO, so the decision rests on documented evidence rather than claims or headlines.",
    cta: "Ask about a government-directed assessment",
    problemTitle: "The problem",
    problem: [
      ["State laws are new and differ", "Restrictions on land, incentives and contracts for companies linked to certain foreign governments vary by state, use different definitions, and keep changing."],
      ["Federal review leaves gaps", "Federal national-security review does not cover every local transaction, and its reasoning is not shared with local decision-makers."],
      ["Self-reporting is unverified", "Questionnaires answered by the company itself cannot tell you what its ownership chain or data flows really are."],
      ["Decisions are scrutinized afterwards", "Elected officials and staff are asked, sometimes years later, what they knew and how they checked it."],
    ],
    getTitle: "What you receive",
    get: [
      ["A certified rating", "A tier from T1 (low identified risk) to T4 (high), with confidence, outlook and status, and the evidence behind each finding."],
      ["A Statutory Eligibility page", "For each statute you name, an explicit statement of whether the company meets its definition, with the counsel opinion relied on. It sits beside the rating and is never combined with it."],
      ["Agreement conditions", "Clawback and termination triggers, change-of-control notice, data-access and reporting covenants you can write into the incentive, land or procurement agreement."],
      ["Twelve months of monitoring", "Daily re-screening against US lists. A new listing or ownership change puts the rating Under Review, and its live status shows it."],
      ["Status you can check", "Every report has a number, a fingerprint and a TBRAC digital signature. Check its live status at any time at tbrac.org/verify, or follow it there to be emailed whenever it changes."],
    ],
    trustTitle: "Why it can be relied on",
    trust: [
      ["Independent", "One flat fee for every company, paid or escrowed before the committee meets and never linked to the result. TBRAC does no consulting for companies it assesses."],
      ["Decided by a committee", "An analyst scores, a second reviewer checks, and a committee of at least three with an independent chair decides. Counsel reviews every elevated or high rating."],
      ["Published, calibrated method", "Red lines, 29 indicators, evidence grades and weights are published and versioned; weights are set by an expert panel. Every report states the version it was rated under."],
      ["Fair to the company", "The company sees the factual findings and can correct them before any decision; its reply is in the report. That makes the result harder to dispute."],
      ["Fully recorded", "Every score, change, document access and decision is in an audit trail. AI helps analysts read and cross-check, but never decides."],
    ],
    fitTitle: "How it fits your process",
    fit: [
      "Make a current TBRAC report part of the application for an incentive, land sale, lease or contract above a threshold you set.",
      "Read the rating, the Statutory Eligibility page and the recommended conditions before the vote or award.",
      "Write the conditions you adopt into the agreement.",
      "Ask for a bring-down re-screen at closing, and check the report's status before each later decision.",
    ],
    costTitle: "Cost and control",
    cost: [
      ["Government-directed (preferred)", "Your body engages TBRAC and directs the scope. The company pays the published flat fee through escrow. You own the report."],
      ["Company-engaged", "The company engages TBRAC. You receive the full report after countersigning a reliance letter that states its purpose, date and scope."],
    ],
    notTitle: "What it is, and is not",
    not: "A TBRAC report is a private certification issued by Assurance Pacific Assessments LLC under its published methodology, as of the date stated. It is not a government certification, approval or license; it is not a CFIUS determination or a decision of any government agency; it is not a guarantee of future conduct; it does not override any statute; and it is not legal advice. Your body makes its own decision.",
    more: "How to use a report", verify: "Verify a report",
  },
  zh: {
    title: "为涉外资投资决策提供有据可查的依据",
    lead: "当具有中国所有权或关联的企业申请激励、土地、租赁或公共合同时，市议会、董事会和经济发展部门需要权衡他们往往无法自行核实的风险。TBRAC 依据公开的评估方法出具独立的私营机构认证，作用类似于上市前审计师报告对决策的支撑，使决策建立在有据可查的证据之上，而非企业自述或新闻报道。",
    cta: "咨询政府主导的评估",
    problemTitle: "面临的问题",
    problem: [
      ["州法律新且各不相同", "针对与某些外国政府有关联企业的土地、激励和合同限制因州而异，定义不同，且不断变化。"],
      ["联邦审查存在空白", "联邦国家安全审查并不涵盖所有地方交易，其理由也不会与地方决策者分享。"],
      ["企业自述未经核实", "由企业自行填写的问卷无法说明其真实的所有权链或数据流向。"],
      ["决策事后会受到审视", "民选官员和工作人员有时在多年后仍会被问及当时掌握了什么信息、如何核实。"],
    ],
    getTitle: "您将收到",
    get: [
      ["认证评级", "从 T1（已识别风险低）到 T4（高）的评级，附可信度、展望和状态，以及每项结论背后的证据。"],
      ["法定资格页面", "针对您指定的每项法律，明确说明企业是否符合其定义，并列明所依据的律师意见。该页面与评级并列，绝不与评级合并。"],
      ["协议条件", "可写入激励、土地或采购协议的追回和终止触发条件、控制权变更通知、数据访问和报告承诺。"],
      ["12 个月持续监测", "每日按美国名单重新筛查。新的列名或所有权变更将使评级进入“审查中”，其实时状态会随之显示。"],
      ["可查询的状态", "每份报告均有编号、数字指纹和 TBRAC 数字签名，可随时在 tbrac.org/verify 查询其实时状态，也可在该页面关注报告，状态变更时将收到电子邮件提醒。"],
    ],
    trustTitle: "为何值得依赖",
    trust: [
      ["独立", "所有企业支付相同的固定费用，在委员会开会前付清或托管，且绝不与结果挂钩。TBRAC 不为其评估的企业提供咨询。"],
      ["由委员会决定", "分析师评分，第二审核人复核，由至少三人组成、设独立主席的委员会作出决定。律师审查每一项较高或高风险评级。"],
      ["公开且经校准的方法", "红线、29 项指标、证据等级和权重均公开并有版本记录；权重由专家小组确定。每份报告均注明其所依据的版本。"],
      ["对企业公平", "企业在任何决定作出前可查看并更正事实性调查结果，其回复纳入报告，使结果更难被质疑。"],
      ["全程记录", "每项评分、更改、文件访问和决定均记入审计记录。AI 协助分析师阅读和交叉核对，但绝不作出决定。"],
    ],
    fitTitle: "如何融入您的流程",
    fit: [
      "将有效的 TBRAC 报告列为超过您设定门槛的激励、土地出售、租赁或合同申请的组成部分。",
      "在表决或授予前阅读评级、法定资格页面和建议条件。",
      "将您采纳的条件写入协议。",
      "在交割时要求更新筛查，并在此后每次决策前查询报告状态。",
    ],
    costTitle: "费用与控制",
    cost: [
      ["政府主导（推荐）", "由贵机构委托 TBRAC 并确定评估范围。企业通过托管支付公布的固定费用。报告归贵机构所有。"],
      ["企业委托", "由企业委托 TBRAC。贵机构会签说明目的、日期和范围的依赖函后，方可收到完整报告。"],
    ],
    notTitle: "报告是什么、不是什么",
    not: "TBRAC 报告是 Assurance Pacific Assessments LLC 依据其公开的评估方法、截至所述日期出具的私营机构认证。它不是政府认证、批准或许可；不是 CFIUS 决定，也不是任何政府机构的决定；不保证企业未来的行为；不能凌驾于任何法律之上；也不构成法律意见。贵机构自行作出决定。",
    more: "如何使用报告", verify: "核验报告",
  },
}

export default function ForGovernmentPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  return (
    <MarketingShell title={c.title} lead={c.lead} cta={{ href: "/contact", label: c.cta }}>
      <section>
        <H2>{c.problemTitle}</H2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {c.problem.map(([t, d]) => <div key={t} className="border-t-2 border-slate-900 pt-4"><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div>)}
        </div>
      </section>

      <section>
        <H2>{c.getTitle}</H2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {c.get.map(([t, d], i) => {
            const Icon = GET_ICONS[i]
            return <div key={t} className="flex gap-4"><Icon className="mt-1 h-5 w-5 shrink-0 text-sky-800" strokeWidth={1.75} /><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div></div>
          })}
        </div>
      </section>

      <section>
        <H2>{c.trustTitle}</H2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {c.trust.map(([t, d], i) => {
            const Icon = TRUST_ICONS[i]
            return <div key={t} className="flex gap-4"><Icon className="mt-1 h-5 w-5 shrink-0 text-sky-800" strokeWidth={1.75} /><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div></div>
          })}
        </div>
      </section>

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <H2>{c.fitTitle}</H2>
          <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-700">{c.fit.map((x, i) => <li key={x} className="flex gap-3"><span className="font-mono text-sm text-slate-400">{i + 1}</span>{x}</li>)}</ol>
        </div>
        <div>
          <H2>{c.costTitle}</H2>
          <div className="mt-4 space-y-4">
            {c.cost.map(([t, d], i) => <div key={t} className={`rounded-lg border p-5 ${i ? "border-slate-200" : "border-slate-900"}`}><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-500">{c.notTitle}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{c.not}</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/contact" className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.cta} <ArrowRight className="h-4 w-4" /></Link>
        <Link href="/relying-parties" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50"><Check className="h-4 w-4" />{c.more}</Link>
        <Link href="/verify" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50">{c.verify}</Link>
      </div>
    </MarketingShell>
  )
}
