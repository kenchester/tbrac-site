"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportDocument, type ReportView } from "@/components/report-document";
import type { EngagementDetail, Methodology } from "@/lib/engagements";
import type { ReportLang } from "@/lib/report-text";
import { useLanguage } from "@/lib/language-context";
import sample from "@/lib/sample-report.json";

const T = {
  en: { banner: "ILLUSTRATIVE SAMPLE · FICTIONAL COMPANY, FINDINGS AND PEOPLE · NOT A TBRAC REPORT", back: "Back", restricted: "Restricted report", pub: "Public summary", cert: "Sample certificate (PDF)", print: "Print or save as PDF" },
  zh: { banner: "示意样本 · 企业、调查结果和人员均为虚构 · 并非 TBRAC 报告", back: "返回", restricted: "限制分发报告", pub: "公开摘要", cert: "认证证书样本（PDF）", print: "打印或另存为 PDF" },
};

/** What a relying party receives, shown with a fictional company. */
export default function SampleReportPage() {
  const site = useLanguage();
  useEffect(() => site.registerToggle(), []); // eslint-disable-line react-hooks/exhaustive-deps -- this page has its own switch
  const [lang, setLang] = useState<ReportLang>(site.language);
  const [view, setView] = useState<ReportView>("restricted");
  const t = T[lang];
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="sticky top-0 z-10 border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href="/for-government" className="text-sm text-sky-800 hover:underline">{t.back}</Link>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant={view === "restricted" ? "default" : "outline"} onClick={() => setView("restricted")}>{t.restricted}</Button>
            <Button size="sm" variant={view === "public" ? "default" : "outline"} onClick={() => setView("public")}>{t.pub}</Button>
            <Button size="sm" variant="outline" asChild><a href="/api/certificate/sample" target="_blank" rel="noopener">{t.cert}</a></Button>
            <Button size="sm" variant="outline" onClick={() => setLang(lang === "en" ? "zh" : "en")}>{lang === "en" ? "中文" : "English"}</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>{t.print}</Button>
          </div>
        </div>
      </div>
      <ReportDocument eng={sample.engagement as unknown as EngagementDetail} m={sample.methodology as unknown as Methodology} lang={lang} view={view} warning={t.banner} />
    </div>
  );
}
