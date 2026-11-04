"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Copyright } from "@/components/copyright";
import { useLanguage } from "@/lib/language-context";

interface Verified {
  report_number: string; subject: string; engagement_type: string; scope: string | null; tier: string | null;
  confidence: string | null; outlook: string | null; domain_tiers: Record<string, string>; methodology_version: string;
  issued_at: string; valid_until: string; status: string; status_note: string | null; fingerprint: string; checked_at: string;
}

const V = {
  en: {
    header: "Report verification", title: "Verify a TBRAC report", verify: "Verify",
    intro: "Enter the report number printed on the report. You will see its current status (Current, Under Review, Withdrawn, Expired or Superseded) and the fingerprint that proves the rating on your copy is unaltered.",
    notFound: (n: string) => `No report with the number ${n}`, notFoundText: "Check the number on your copy. A report not in this register was not issued by TBRAC.",
    checking: "Checking…", inRegister: (n: string, s: string) => `${n} is in the TBRAC register · Status: ${s}`,
    currentUntil: (d: string) => `Current until ${d}.`, doNotRely: "Do not rely on this report's rating without contacting TBRAC.",
    summary: "Public summary as issued", assessment: { design: "Design assessment", operating: "Operating assessment" } as Record<string, string>,
    methodology: "Methodology", issued: "Issued", validUntil: "Valid until", scope: "Scope",
    tier: "Tier", confidence: "Confidence", outlook: "Outlook",
    tiers: { T1: "T1 · Low identified risk", T2: "T2 · Moderate", T3: "T3 · Elevated", T4: "T4 · High", UA: "Unable to assess" } as Record<string, string>,
    conf: { High: "High", Moderate: "Moderate", Low: "Low" } as Record<string, string>,
    outlooks: { stable: "Stable", positive: "Positive", negative: "Negative" } as Record<string, string>,
    statuses: { Current: "Current", "Under Review": "Under Review", Withdrawn: "Withdrawn", Expired: "Expired", Superseded: "Superseded" } as Record<string, string>,
    domains: {
      D1: "Ownership and state / Party / military linkage", D2: "National security, technology and export control", D3: "Data security and PRC access",
      D4: "Supply chain and forced labor", D5: "Integrity, influence and legal history", D6: "Financial integrity and governance", D7: "IP conduct",
    } as Record<string, string>,
    check: "Check your copy", checkText: "Paste the fingerprint printed on your report. If it matches, the rating on your copy is the one TBRAC issued.",
    fpPlaceholder: "64-character fingerprint", match: "✓ Fingerprint matches.", noMatch: "✗ Fingerprint does not match this report. Contact TBRAC before relying on your copy.",
    registerFp: "Register fingerprint",
    disclaimer: (d: string) => `A TBRAC report is an independent risk opinion as of the date stated. It is not a certification, guarantee or approval; not a CFIUS determination or a decision of any government agency; it does not override any statute and is not legal advice. Confidential findings are available only to the named intended users. Checked ${d}.`,
    locale: "en-US",
  },
  zh: {
    header: "报告核验", title: "核验 TBRAC 报告", verify: "核验",
    intro: "请输入报告上印有的报告编号。您将看到报告的当前状态（有效、审查中、已撤回、已过期或已被取代），以及可证明您手中副本的评级未被更改的数字指纹。",
    notFound: (n: string) => `没有编号为 ${n} 的报告`, notFoundText: "请核对副本上的编号。不在本登记册中的报告并非由 TBRAC 出具。",
    checking: "查询中…", inRegister: (n: string, s: string) => `${n} 已列入 TBRAC 登记册 · 状态：${s}`,
    currentUntil: (d: string) => `有效期至 ${d}。`, doNotRely: "在联系 TBRAC 之前，请勿依赖本报告的评级。",
    summary: "出具时的公开摘要", assessment: { design: "设计评估", operating: "运营评估" } as Record<string, string>,
    methodology: "评估方法", issued: "出具日期", validUntil: "有效期至", scope: "范围",
    tier: "评级", confidence: "可信度", outlook: "展望",
    tiers: { T1: "T1 · 已识别风险低", T2: "T2 · 中等", T3: "T3 · 较高", T4: "T4 · 高", UA: "无法评估" } as Record<string, string>,
    conf: { High: "高", Moderate: "中等", Low: "低" } as Record<string, string>,
    outlooks: { stable: "稳定", positive: "正面", negative: "负面" } as Record<string, string>,
    statuses: { Current: "有效", "Under Review": "审查中", Withdrawn: "已撤回", Expired: "已过期", Superseded: "已被取代" } as Record<string, string>,
    domains: {
      D1: "所有权与国家 / 党 / 军方关联", D2: "国家安全、技术与出口管制", D3: "数据安全与中国境内访问", D4: "供应链与强迫劳动",
      D5: "诚信、影响力与法律记录", D6: "财务诚信与治理", D7: "知识产权行为",
    } as Record<string, string>,
    check: "核对您的副本", checkText: "粘贴报告上印有的数字指纹。如一致，则您副本上的评级即为 TBRAC 出具的评级。",
    fpPlaceholder: "64 位数字指纹", match: "✓ 数字指纹一致。", noMatch: "✗ 数字指纹与本报告不一致。在依赖您的副本之前，请联系 TBRAC。",
    registerFp: "登记册数字指纹",
    disclaimer: (d: string) => `TBRAC 报告是截至所述日期的独立风险意见。它不是认证、担保或批准；不是 CFIUS 决定或任何政府机构的决定；不能凌驾于任何法律之上，也不构成法律意见。保密调查结果仅提供给指定的预期使用方。查询时间：${d}。`,
    locale: "zh-CN",
  },
};

function useV() {
  const { language } = useLanguage();
  return V[language] ?? V.en;
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useV();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">{children}</main>
      <Copyright />
    </div>
  );
}

export function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const t = useV();
  const [n, setN] = useState(initial);
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (n.trim()) router.push(`/verify/${encodeURIComponent(n.trim().toUpperCase())}`); }}>
      <input className="h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 font-mono text-sm uppercase" placeholder="TBRAC-2026-0001"
        value={n} onChange={(e) => setN(e.target.value)} aria-label="Report number" />
      <button className="inline-flex items-center gap-2 rounded-md bg-[#0b1f3a] px-4 text-sm font-semibold text-white"><Search className="h-4 w-4" />{t.verify}</button>
    </form>
  );
}

export function VerifyLanding() {
  const t = useV();
  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="text-slate-600">{t.intro}</p>
      <VerifyForm />
    </Shell>
  );
}

export function VerifyResult({ number }: { number: string }) {
  const t = useV();
  const [v, setV] = useState<Verified | null>(null);
  const [missing, setMissing] = useState(false);
  const [fp, setFp] = useState("");
  useEffect(() => {
    fetch(`/api/v1/public/verify/${encodeURIComponent(number)}`).then(async (r) => {
      if (r.ok) setV(await r.json()); else setMissing(true);
    }).catch(() => setMissing(true));
  }, [number]);
  const day = (d: string) => new Date(d).toLocaleDateString(t.locale, { year: "numeric", month: "long", day: "numeric" });

  if (missing) return (
    <Shell>
      <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
        <XCircle className="h-6 w-6 shrink-0" />
        <div><p className="font-semibold">{t.notFound(number)}</p><p className="text-sm">{t.notFoundText}</p></div>
      </div>
      <VerifyForm initial={number} />
    </Shell>
  );
  if (!v) return <Shell><p className="text-slate-500">{t.checking}</p></Shell>;

  const good = v.status === "Current";
  const fpTrim = fp.trim().toLowerCase();
  return (
    <Shell>
      <div className={`flex gap-3 rounded-lg border p-5 ${good ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        {good ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <AlertTriangle className="h-6 w-6 shrink-0" />}
        <div>
          <p className="font-semibold">{t.inRegister(v.report_number, t.statuses[v.status] ?? v.status)}</p>
          <p className="text-sm">{good ? t.currentUntil(day(v.valid_until)) : v.status_note || t.doNotRely}</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t.summary}</p>
        <h1 className="mt-1 text-2xl font-semibold">{v.subject}</h1>
        <p className="text-sm text-slate-600">{t.assessment[v.engagement_type] ?? v.engagement_type} · {t.methodology} {v.methodology_version} · {t.issued} {day(v.issued_at)} · {t.validUntil} {day(v.valid_until)}</p>
        {v.scope && <p className="mt-2 text-sm"><span className="font-medium">{t.scope}:</span> {v.scope}</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[[t.tier, v.tier ? t.tiers[v.tier] ?? v.tier : "—"], [t.confidence, v.confidence ? t.conf[v.confidence] ?? v.confidence : "—"],
            [t.outlook, v.outlook ? t.outlooks[v.outlook] ?? v.outlook : "—"]].map(([k, x]) => (
            <div key={k} className="rounded border border-slate-200 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{k}</p><p className="mt-1 font-semibold">{x}</p></div>
          ))}
        </div>
        <table className="mt-4 w-full text-sm"><tbody className="divide-y divide-slate-100">
          {Object.entries(v.domain_tiers).map(([d, tier]) => <tr key={d}><td className="py-1.5 text-slate-600">{d} {t.domains[d] ?? ""}</td><td className="py-1.5 text-right font-semibold">{tier}</td></tr>)}
        </tbody></table>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 space-y-2">
        <p className="font-semibold">{t.check}</p>
        <p className="text-sm text-slate-600">{t.checkText}</p>
        <input className="h-10 w-full rounded-md border border-slate-300 px-3 font-mono text-xs" placeholder={t.fpPlaceholder} value={fp} onChange={(e) => setFp(e.target.value)} />
        {fpTrim && (fpTrim === v.fingerprint
          ? <p className="text-sm font-medium text-emerald-700">{t.match}</p>
          : <p className="text-sm font-medium text-red-700">{t.noMatch}</p>)}
        <p className="break-all font-mono text-xs text-slate-400">{t.registerFp}: {v.fingerprint}</p>
      </section>

      <p className="text-xs leading-relaxed text-slate-500">{t.disclaimer(new Date(v.checked_at).toLocaleString(t.locale))}</p>
    </Shell>
  );
}
