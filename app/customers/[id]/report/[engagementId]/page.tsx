"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/protected-route";
import { ReportDocument } from "@/components/report-document";
import { authenticatedRequest } from "@/lib/api-client";
import type { EngagementDetail, Methodology } from "@/lib/engagements";
import type { ReportLang } from "@/lib/report-text";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { back: "Back to overview", print: "Print or save as PDF", copy: "Company copy of the restricted report. Share it only with the people the engagement names; use the public link for anyone else." },
  zh: { back: "返回概览", print: "打印或另存为 PDF", copy: "限制分发报告的企业副本。仅可提供给委托书指定的人员；其他人请使用公开链接。" },
};

function Content({ customerId, engagementId }: { customerId: string; engagementId: string }) {
  const site = useLanguage();
  useEffect(() => site.registerToggle(), []); // eslint-disable-line react-hooks/exhaustive-deps -- this page has its own switch
  const [lang, setLang] = useState<ReportLang>(site.language);
  const [r, setR] = useState<{ engagement: EngagementDetail; methodology: Methodology } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    authenticatedRequest<{ engagement: EngagementDetail; methodology: Methodology }>(`/api/v1/customers/${customerId}/reports/${engagementId}`)
      .then(setR).catch((e) => setError(e instanceof Error ? e.message : "Could not load the report"));
  }, [customerId, engagementId]);
  const t = T[lang];
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white" lang={lang === "zh" ? "zh-CN" : "en"}>
      <div className="sticky top-0 z-10 border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href={`/customers/${customerId}`} className="text-sm text-sky-800 hover:underline">{t.back}</Link>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setLang(lang === "en" ? "zh" : "en")}>{lang === "en" ? "中文" : "English"}</Button>
            {r && <Button size="sm" variant="outline" onClick={() => window.print()}>{t.print}</Button>}
          </div>
        </div>
      </div>
      {error && <p className="p-8 text-red-600">{error}</p>}
      {r && <ReportDocument eng={r.engagement} m={r.methodology} lang={lang} view="restricted" sharedWith={t.copy} />}
    </div>
  );
}

export default function CompanyReportPage({ params }: { params: Promise<{ id: string; engagementId: string }> }) {
  const { id, engagementId } = use(params);
  return <ProtectedRoute><Content customerId={id} engagementId={engagementId} /></ProtectedRoute>;
}
