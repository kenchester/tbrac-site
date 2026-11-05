"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportDocument } from "@/components/report-document";
import type { EngagementDetail, Methodology } from "@/lib/engagements";
import type { ReportLang } from "@/lib/report-text";
import { useLanguage } from "@/lib/language-context";

interface Info {
  subject: string; report_number: string; relying_party: string; recipient_name: string; expires_at: string; accepted: boolean;
  terms: { en: string[]; zh: string[] }; terms_version: string;
}
interface Shared { engagement: EngagementDetail; methodology: Methodology; shared_with: { name: string; title: string; organization: string; relying_party: string; accepted_at: string } }

const T = {
  en: {
    head: "Restricted TBRAC report", for: (r: string, p: string) => `Shared with ${r} for ${p}.`, expires: (d: string) => `This private link expires on ${d}.`,
    terms: "Reliance terms", name: "Your name", title: "Your title", org: "Organization", agree: "I accept these terms on behalf of the organization above.",
    open: "Accept and open the report", opening: "Opening…", print: "Print or save as PDF",
    banner: (n: string, t: string, o: string, d: string, v: string) => `Restricted report provided to ${n}, ${t}, ${o}, on ${d} under TBRAC reliance terms ${v}. Not for further distribution.`,
    locale: "en-US",
  },
  zh: {
    head: "TBRAC 限制分发报告", for: (r: string, p: string) => `已为 ${p} 分享给 ${r}。`, expires: (d: string) => `此专属链接将于 ${d} 失效。`,
    terms: "依赖条款", name: "您的姓名", title: "您的职务", org: "机构", agree: "本人代表上述机构接受这些条款。",
    open: "接受并打开报告", opening: "正在打开…", print: "打印或另存为 PDF",
    banner: (n: string, t: string, o: string, d: string, v: string) => `本限制分发报告于 ${d} 依据 TBRAC 依赖条款 ${v} 提供给 ${o} 的 ${n}（${t}），不得再行分发。`,
    locale: "zh-CN",
  },
};

export default function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [lang, setLang] = useState<ReportLang>("en");
  const site = useLanguage();
  useEffect(() => site.registerToggle(), []); // eslint-disable-line react-hooks/exhaustive-deps -- this page has its own switch
  const t = T[lang];
  const [info, setInfo] = useState<Info | null>(null);
  const [report, setReport] = useState<Shared | null>(null);
  const [form, setForm] = useState({ name: "", title: "", organization: "", agree: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openReport = useCallback(async () => {
    const r = await fetch(`/api/v1/report-access/${token}/report`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.detail ?? "Could not open the report");
    setReport(j);
  }, [token]);

  useEffect(() => {
    if (navigator.language?.toLowerCase().startsWith("zh")) setLang("zh");
    fetch(`/api/v1/report-access/${token}`, { cache: "no-store" }).then(async (r) => {
      const j = await r.json();
      if (!r.ok) { setError(j.detail ?? "This link is not valid"); return; }
      setInfo(j);
      setForm((f) => ({ ...f, name: j.recipient_name, organization: j.relying_party }));
      if (j.accepted) await openReport().catch((e) => setError(e.message));
    }).catch(() => setError("This link is not valid"));
  }, [token, openReport]);

  const accept = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/v1/report-access/${token}/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error((await r.json()).detail ?? "Could not record acceptance");
      await openReport();
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); }
  };
  const day = (d: string) => new Date(d).toLocaleDateString(t.locale, { dateStyle: "long" });

  const bar = (
    <div className="print:hidden border-b bg-white">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#0b1f3a] text-xs font-bold text-white">TB</span>
        <span className="text-sm font-bold tracking-[0.18em]">TBRAC</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setLang(lang === "en" ? "zh" : "en")}>{lang === "en" ? "中文" : "English"}</Button>
          {report && <Button size="sm" variant="outline" onClick={() => window.print()}>{t.print}</Button>}
        </div>
      </div>
    </div>
  );

  if (report) {
    const w = report.shared_with;
    return (
      <div className="min-h-screen bg-slate-100 print:bg-white" lang={lang === "zh" ? "zh-CN" : "en"}>
        {bar}
        <ReportDocument eng={report.engagement} m={report.methodology} lang={lang} view="restricted"
          sharedWith={t.banner(w.name, w.title, w.organization, day(w.accepted_at), info?.terms_version ?? "")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" lang={lang === "zh" ? "zh-CN" : "en"}>
      {bar}
      <main className="mx-auto max-w-2xl px-5 py-12">
        {error && !info && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-red-900"><ShieldAlert className="h-5 w-5 shrink-0" /><p>{error}</p></div>
        )}
        {!info && !error && <p className="text-slate-500">…</p>}
        {info && (
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-7 py-6">
              <p className="flex items-center gap-2 text-sm text-slate-500"><Lock className="h-4 w-4" />{t.head} · <span className="font-mono">{info.report_number}</span></p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{info.subject}</h1>
              <p className="mt-2 text-sm text-slate-600">{t.for(info.recipient_name, info.relying_party)} {t.expires(day(info.expires_at))}</p>
            </div>
            <div className="px-7 py-6">
              <h2 className="text-sm font-semibold text-slate-900">{t.terms}</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">{info.terms[lang].map((x) => <li key={x}>{x}</li>)}</ol>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <label className="text-sm"><span className="text-slate-600">{t.name}</span><Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label className="text-sm"><span className="text-slate-600">{t.title}</span><Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                <label className="text-sm"><span className="text-slate-600">{t.org}</span><Input className="mt-1" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></label>
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="mt-1" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />{t.agree}
              </label>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <Button className="mt-5" disabled={busy || !form.agree || form.name.trim().length < 2 || form.title.trim().length < 2 || form.organization.trim().length < 2}
                onClick={accept}>{busy ? t.opening : t.open}</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
