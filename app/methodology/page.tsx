"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Source_Serif_4 } from "next/font/google"
import { ArrowRight } from "lucide-react"
import { LanguageToggle } from "@/components/language-toggle"
import { Copyright } from "@/components/copyright"
import { useLanguage } from "@/lib/language-context"

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"] })
const NAVY = "#0b1f3a"
const BUILTIN = { version: "1.1-DRAFT", weights: { D1: 0.25, D2: 0.2, D3: 0.2, D4: 0.1, D5: 0.1, D6: 0.1, D7: 0.05 } as Record<string, number> }

interface PublicVersion {
  version: string; status: string; domain_weights: Record<string, number>; changelog: string; sensitivity: string | null; published_at: string | null
  panel: { composition: { role: string; count: number }[]; size: number; rounds: number; panelist_crs: number[]; aggregate_cr: number; consensus_notes: string | null }
}

const C = {
  en: { title: "How TBRAC assesses risk",
    lead: "The comprehensive assessment applies a published, versioned methodology: red lines first, then 29 indicators across seven domains, each graded by the strength of its evidence. The rules below are the ones every rating is computed under.",
    domainsTitle: "Seven domains and their weights", weightsNote: (v: string, cal: boolean) => cal ? `Weights of version ${v}, set by the expert panel.` : `Weights of version ${v} are provisional until the expert panel calibrates them (see below).`,
    domains: { D1: "Ownership and state / Party / military linkage", D2: "National security, technology and export control", D3: "Data security and PRC access", D4: "Supply chain and forced labor", D5: "Integrity, influence and legal history", D6: "Financial integrity and governance", D7: "IP conduct" } as Record<string, string>,
    rulesTitle: "How a rating is reached",
    rules: [
      ["Red lines first", "Eight hard red lines (for example an SDN or Entity List listing, a UFLPA listing, refusal to disclose ownership) make the rating T4 or Unable to Assess. Seven soft red lines cap the best attainable tier. No score can offset a red line."],
      ["Anchored indicators", "Each of the 29 indicators is scored 0–4 against written descriptions of each level, published in the methodology."],
      ["Evidence grades", "Every indicator carries a grade: E1 verified by two or more independent sources, E2 cross-checked, E3 attested only, E4 unverifiable or refused. A grade can never exceed what the evidence register supports."],
      ["Limited compensation", "Domains combine by weight, but a single very poor indicator or domain sets a floor the rest cannot average away."],
      ["Confidence", "High, Moderate or Low, from the share of verified evidence. Too little verifiable evidence means Unable to Assess: no opinion is given."],
      ["People decide", "An analyst scores, a second reviewer checks, and a committee of at least three with an independent chair decides. AI assists with a blind second reading and consistency checks, but never sets a score."],
    ],
    calTitle: "Calibration and version history",
    calLead: "Domain weights are set by an expert panel (former federal officials, state economic-development officers, sanctions counsel, China governance specialists) through a two-round Delphi and pairwise comparison (AHP). Each panelist's judgments must be consistent (CR ≤ 0.10). Published versions never change; each report states the version it was rated under.",
    noVersions: "No calibrated version has been published yet. The current version uses provisional starting weights.",
    published: "Published", panel: "Panel", members: "members", rounds: "rounds", cr: "Consistency ratio", sensitivity: "Sensitivity analysis",
    selfTitle: "The free self-assessment",
    selfText: "The self-assessment covers the same ground in 10 short modules and gives an indicative score from your own answers. It is not verified, uses simpler scoring and is not suitable for reliance by third parties. It shows where a comprehensive assessment is likely to focus.",
    selfCta: "Start the free self-assessment", fullCta: "For relying parties",
  },
  zh: { title: "TBRAC 如何评估风险",
    lead: "全面评估采用公开且有版本记录的评估方法：先适用红线规则，再评估七个领域的 29 项指标，每项均按证据强度分级。以下规则即每项评级的计算依据。",
    domainsTitle: "七个领域及其权重", weightsNote: (v: string, cal: boolean) => cal ? `版本 ${v} 的权重，由专家小组确定。` : `版本 ${v} 的权重为临时权重，待专家小组校准（见下文）。`,
    domains: { D1: "所有权与国家 / 党 / 军方关联", D2: "国家安全、技术与出口管制", D3: "数据安全与中国境内访问", D4: "供应链与强迫劳动", D5: "诚信、影响力与法律记录", D6: "财务诚信与治理", D7: "知识产权行为" } as Record<string, string>,
    rulesTitle: "评级如何得出",
    rules: [
      ["先适用红线", "八条硬红线（例如被列入 SDN 或实体清单、UFLPA 清单、拒绝披露所有权）使评级为 T4 或无法评估。七条软红线限制可获得的最佳等级。任何分数都无法抵消红线。"],
      ["有明确标准的指标", "29 项指标中的每一项均按各等级的书面描述评分（0–4），这些描述已在评估方法中公开。"],
      ["证据等级", "每项指标均有证据等级：E1 经两个以上独立来源核实，E2 经交叉核对，E3 仅有声明，E4 无法核实或拒绝提供。等级绝不能超出证据登记册所支持的程度。"],
      ["有限补偿", "各领域按权重合并，但单项极差的指标或领域会设定下限，其他部分无法将其平均掉。"],
      ["可信度", "根据经核实证据的比例分为高、中、低。可核实证据过少则为无法评估，不发表意见。"],
      ["由人作出决定", "分析师评分，第二审核人复核，由至少三人组成、设独立主席的委员会作出决定。AI 提供盲审式第二意见和一致性检查，但绝不设定分数。"],
    ],
    calTitle: "校准与版本历史",
    calLead: "领域权重由专家小组（前联邦官员、州经济发展官员、制裁法律师、中国治理专家）通过两轮德尔菲法和成对比较（AHP）确定。每位专家的判断须保持一致（CR ≤ 0.10）。已发布版本不会更改；每份报告均注明其所依据的版本。",
    noVersions: "尚未发布经校准的版本。当前版本使用临时初始权重。",
    published: "发布日期", panel: "专家小组", members: "名成员", rounds: "轮", cr: "一致性比率", sensitivity: "敏感性分析",
    selfTitle: "免费自我评估",
    selfText: "自我评估以 10 个简短模块涵盖相同领域，并根据您自己的回答给出参考分数。它未经核实，评分方式更简单，不适合供第三方依赖。它能显示全面评估可能关注的重点。",
    selfCta: "开始免费自我评估", fullCta: "依赖方指南",
  },
}

export default function MethodologyPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  const [versions, setVersions] = useState<PublicVersion[] | null>(null)
  useEffect(() => { fetch("/api/v1/public/methodology").then((r) => (r.ok ? r.json() : [])).then(setVersions).catch(() => setVersions([])) }, [])
  const current = versions?.find((v) => v.status === "published")
  const weights = current?.domain_weights ?? BUILTIN.weights
  const day = (d: string) => new Date(d).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm text-sm font-bold text-white" style={{ background: NAVY }}>TB</span>
            <span className="text-[15px] font-bold tracking-[0.18em]">TBRAC</span>
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section style={{ background: NAVY }} className="text-white">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h1 className={`${serif.className} text-4xl font-semibold tracking-tight sm:text-5xl`}>{c.title}</h1>
          <p className="mt-5 max-w-3xl text-[17px] leading-relaxed text-slate-300">{c.lead}</p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-16 px-5 py-16">
        <section>
          <h2 className={`${serif.className} text-3xl font-semibold`}>{c.domainsTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">{c.weightsNote(current?.version ?? BUILTIN.version, !!current)}</p>
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            {Object.entries(weights).map(([d, w]) => (
              <div key={d} className="grid grid-cols-[48px_1fr_160px] items-center gap-4 border-b border-slate-100 px-5 py-3 last:border-b-0">
                <span className="font-mono text-sm text-slate-500">{d}</span>
                <span className="text-[15px]">{c.domains[d]}</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 flex-1 rounded-full bg-slate-100"><span className="block h-2 rounded-full bg-sky-800" style={{ width: `${Math.min(100, w * 250)}%` }} /></span>
                  <span className="w-12 text-right text-sm font-semibold">{(w * 100).toFixed(1)}%</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={`${serif.className} text-3xl font-semibold`}>{c.rulesTitle}</h2>
          <div className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
            {c.rules.map(([t, d]) => <div key={t}><h3 className="font-semibold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-slate-600">{d}</p></div>)}
          </div>
        </section>

        <section>
          <h2 className={`${serif.className} text-3xl font-semibold`}>{c.calTitle}</h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">{c.calLead}</p>
          <div className="mt-6 space-y-4">
            {versions && versions.length === 0 && <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">{c.noVersions}</p>}
            {versions?.map((v) => (
              <div key={v.version} className="rounded-lg border border-slate-200 p-5 text-sm">
                <p className="font-semibold"><span className="font-mono">{v.version}</span>{v.published_at && <span className="font-normal text-slate-500"> · {c.published} {day(v.published_at)}</span>}{v.status === "retired" && <span className="font-normal text-slate-500"> · retired</span>}</p>
                <p className="mt-1 text-slate-600">{c.panel}: {v.panel.size} {c.members}, {v.panel.rounds} {c.rounds} — {v.panel.composition.map((r) => `${r.role} (${r.count})`).join("; ")}</p>
                <p className="text-slate-600">{c.cr}: {v.panel.aggregate_cr.toFixed(3)}</p>
                {v.sensitivity && <p className="text-slate-600">{c.sensitivity}: {v.sensitivity}</p>}
                <p className="mt-1 whitespace-pre-wrap text-slate-500">{v.changelog}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <h2 className={`${serif.className} text-2xl font-semibold`}>{c.selfTitle}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{c.selfText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/company/login?tab=signup" className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white" style={{ background: NAVY }}>{c.selfCta} <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/relying-parties" className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">{c.fullCta}</Link>
          </div>
        </section>
      </main>
      <Copyright />
    </div>
  )
}
