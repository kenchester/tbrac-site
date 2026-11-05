"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportDocument, type ReportView } from "@/components/report-document";
import { engagementsApi, type EngagementDetail, type Methodology } from "@/lib/engagements";
import { REPORT_TEXT, type ReportLang } from "@/lib/report-text";
import { useLanguage } from "@/lib/language-context";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [eng, setEng] = useState<EngagementDetail | null>(null);
  const [m, setM] = useState<Methodology | null>(null);
  const [view, setView] = useState<ReportView>("restricted");
  const site = useLanguage();
  const [lang, setLang] = useState<ReportLang>(site.language);
  useEffect(() => site.registerToggle(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("view") === "public") setView("public");
    if (q.get("lang") === "zh") setLang("zh");
    engagementsApi.get(id).then(setEng).catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
    engagementsApi.methodology().then(setM).catch(() => {});
  }, [id]);

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!eng || !m) return <p className="p-8 text-slate-500">Loading…</p>;
  const t = REPORT_TEXT[lang];

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="print:hidden sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href={`/evaluator/engagements/${eng.id}`} className="text-sm text-primary hover:underline">{t.back}</Link>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant={view === "restricted" ? "default" : "outline"} onClick={() => setView("restricted")}>{t.restricted}</Button>
            <Button size="sm" variant={view === "public" ? "default" : "outline"} onClick={() => setView("public")}>{t.public}</Button>
            <Button size="sm" variant="outline" onClick={() => setLang(lang === "en" ? "zh" : "en")}>{lang === "en" ? "中文" : "English"}</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>{t.print}</Button>
          </div>
        </div>
      </div>
      <ReportDocument eng={eng} m={m} lang={lang} view={view} />
    </div>
  );
}
