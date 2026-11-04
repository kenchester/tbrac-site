"use client";

import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import { ArrowRight, FileText, Landmark, ListChecks, ShieldAlert, Search, Scale } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/language-context";

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"] });
const NAVY = "#0b1f3a";

// Methodology §3.1 (tracks), §8 (outputs, conditions), §9 (surveillance), §12.2 (reliance letter).
const C = {
  en: {
    eyebrow: "For counties, state agencies and business partners",
    title: "Using a TBRAC report in your decision",
    lead: "A TBRAC report gives you an independent, documented view of a company's ownership, state links and other risks before an incentive vote, land sale, lease or procurement. It supports your decision; it does not make it for you.",
    getTitle: "What you receive",
    get: [
      { i: FileText, t: "Restricted full report", d: "The rating with its confidence, outlook and status; findings by indicator with the evidence behind each; red-line results and the screening log; the inherent-to-residual bridge; the company's right-of-reply response." },
      { i: Landmark, t: "Statutory Eligibility page", d: "For each jurisdiction you name, explicit statements of whether the company meets a statutory definition (for example a state foreign-adversary land or incentive law), with the counsel opinion relied on. It sits beside the rating and is never combined with it." },
      { i: ListChecks, t: "Recommended agreement conditions", d: "For T2 and T3 ratings, conditions you can write into your agreement, drafted as objective facts." },
      { i: Search, t: "A public summary and a live status", d: "A short public summary, plus a report number you can check at any time at tbrac.org/verify." },
    ],
    tracksTitle: "Two ways to engage",
    tracks: [
      { t: "Government-directed (preferred)", d: "You engage TBRAC and direct the scope. The company funds the work through escrow at the published flat fee. You own the report." },
      { t: "Company-engaged", d: "The company engages TBRAC. You receive the restricted report only after you countersign a reliance letter stating the purpose, as-of date and scope limits." },
    ],
    conditionsTitle: "Conditions you can use",
    conditionsLead: "Typical conditions in T2 and T3 reports (Methodology §8.5):",
    conditions: [
      "Clawback and termination triggers",
      "Change-of-control notice and re-assessment",
      "Notice of ownership changes, government data requests, new listings and auditor changes",
      "Data-localization and access-control covenants with US-side audit rights",
      "Officer certifications with personal liability on the US side",
      "A named US security or compliance officer",
    ],
    monitorTitle: "After the report is issued",
    monitor: [
      "A rating is valid for 12 months and is re-screened against US lists every day.",
      "A new listing, an ownership change, major litigation, an auditor resignation or a material inaccuracy puts the rating Under Review, resolved within 90 days.",
      "Ask for a bring-down re-screen at each decision point, such as an incentive approval or land closing.",
      "Check the live status with the report number before you rely on it.",
    ],
    limitsTitle: "What a report does not do",
    limits: "A TBRAC report is an independent risk opinion as of a date. It is not a certification, guarantee or approval; it is not a CFIUS determination or a decision of any government agency; it does not override any statute; and it is not legal advice. Where a law bars a transaction, no rating changes that result. Your agency makes its own independent decision.",
    ctaVerify: "Verify a report", ctaContact: "Ask about a government-directed assessment", ctaMethod: "Read the methodology",
    home: "Home",
  },
  zh: {
    eyebrow: "供县政府、州机构和商业伙伴参考",
    title: "如何在决策中使用 TBRAC 报告",
    lead: "在激励投票、土地出售、租赁或采购之前，TBRAC 报告为您提供关于企业所有权、国有关联及其他风险的独立且有据可查的评估。报告为您的决策提供支持，但不代替您作出决定。",
    getTitle: "您将收到",
    get: [
      { i: FileText, t: "限制分发的完整报告", d: "评级及其可信度、展望和状态；各指标的调查结果及其证据；红线检查结果和筛查记录；从固有风险到剩余风险的说明；企业的答辩回复。" },
      { i: Landmark, t: "法定资格页面", d: "针对您指定的每个司法管辖区，明确说明企业是否符合某项法定定义（例如州外国对手土地或激励法），并列明所依据的律师意见。该页面与评级并列，绝不与评级合并。" },
      { i: ListChecks, t: "建议的协议条件", d: "对于 T2 和 T3 评级，提供可写入协议的条件，均以客观事实表述。" },
      { i: Search, t: "公开摘要和实时状态", d: "一份简短的公开摘要，以及可随时在 tbrac.org/verify 查询的报告编号。" },
    ],
    tracksTitle: "两种委托方式",
    tracks: [
      { t: "政府主导（推荐）", d: "由您委托 TBRAC 并确定评估范围。企业通过托管按公布的固定费用支付。报告归您所有。" },
      { t: "企业委托", d: "由企业委托 TBRAC。您须先会签一份说明目的、基准日和范围限制的依赖函，才能收到限制分发报告。" },
    ],
    conditionsTitle: "可采用的条件",
    conditionsLead: "T2 和 T3 报告中的典型条件（评估方法第 8.5 节）：",
    conditions: [
      "追回和终止触发条件",
      "控制权变更通知及重新评估",
      "所有权变更、政府数据调取要求、新的列名和审计师变更的通知义务",
      "数据本地化和访问控制承诺，并赋予美方审计权",
      "由美方高级管理人员出具并承担个人责任的证明",
      "指定一名美国安全或合规负责人",
    ],
    monitorTitle: "报告出具之后",
    monitor: [
      "评级有效期为 12 个月，每天按美国名单重新筛查。",
      "新的列名、所有权变更、重大诉讼、审计师辞任或重大不实信息将使评级进入“审查中”，并在 90 天内得出结论。",
      "在每个决策节点（如激励审批或土地交割）要求进行更新筛查。",
      "在依赖报告之前，请用报告编号查询其实时状态。",
    ],
    limitsTitle: "报告不能做什么",
    limits: "TBRAC 报告是截至某一日期的独立风险意见。它不是认证、担保或批准；不是 CFIUS 决定，也不是任何政府机构的决定；不能凌驾于任何法律之上；也不构成法律意见。凡法律禁止的交易，任何评级都不会改变这一结果。贵机构应自行独立作出决定。",
    ctaVerify: "核验报告", ctaContact: "咨询政府主导的评估", ctaMethod: "阅读评估方法",
    home: "首页",
  },
};

export default function RelyingPartiesPage() {
  const { language } = useLanguage();
  const c = C[language] ?? C.en;
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3" aria-label={c.home}>
            <span className="flex h-9 w-9 items-center justify-center rounded-sm text-sm font-bold text-white" style={{ background: NAVY }}>TB</span>
            <span className="text-[15px] font-bold tracking-[0.18em]">TBRAC</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link href="/verify" className="rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.ctaVerify}</Link>
          </div>
        </div>
      </header>

      <section style={{ background: NAVY }} className="text-white">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">{c.eyebrow}</p>
          <h1 className={`${serif.className} mt-4 text-4xl font-semibold tracking-tight sm:text-5xl`}>{c.title}</h1>
          <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-slate-300">{c.lead}</p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-16 px-5 py-16">
        <section>
          <h2 className={`${serif.className} text-3xl font-semibold`}>{c.getTitle}</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {c.get.map(({ i: Icon, t, d }) => (
              <div key={t} className="flex gap-4">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-sky-800" strokeWidth={1.75} />
                <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={`${serif.className} text-3xl font-semibold`}>{c.tracksTitle}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {c.tracks.map((x, i) => (
              <div key={x.t} className={`rounded-lg border p-6 ${i === 0 ? "border-slate-900" : "border-slate-200"}`}>
                <h3 className="font-semibold">{x.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className={`${serif.className} text-2xl font-semibold`}>{c.conditionsTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">{c.conditionsLead}</p>
            <ul className="mt-4 space-y-2 text-[15px] text-slate-700">{c.conditions.map((x) => <li key={x} className="flex gap-2"><Scale className="mt-1 h-4 w-4 shrink-0 text-sky-800" />{x}</li>)}</ul>
          </div>
          <div>
            <h2 className={`${serif.className} text-2xl font-semibold`}>{c.monitorTitle}</h2>
            <ul className="mt-4 space-y-2 text-[15px] text-slate-700">{c.monitor.map((x) => <li key={x} className="flex gap-2"><ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-sky-800" />{x}</li>)}</ul>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{c.limitsTitle}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{c.limits}</p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/verify" className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.ctaVerify} <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/contact" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50">{c.ctaContact}</Link>
          <Link href="/methodology" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50">{c.ctaMethod}</Link>
        </div>
      </main>
    </div>
  );
}
