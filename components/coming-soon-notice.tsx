"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { earlyAccessApi } from "@/lib/certifications";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { title: "Comprehensive assessments: coming soon",
        text: "They open to all companies soon. If TBRAC invited you to take part in early testing, enter your code to start now.",
        signup: "Enter your early-access code" },
  zh: { title: "全面评估：即将推出",
        text: "全面评估即将向所有企业开放。如您受 TBRAC 邀请参与抢先测试，请输入体验码立即开始。",
        signup: "输入抢先体验码" },
};

/** Small "Coming soon" label for the comprehensive assessment, until it opens. */
export function ComingSoonBadge({ className = "" }: { className?: string }) {
  const { language } = useLanguage();
  const [soon, setSoon] = useState(false);
  useEffect(() => { earlyAccessApi.status().then((s) => setSoon(!s.open)); }, []);
  if (!soon) return null;
  return <span className={`inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ${className}`}>{language === "zh" ? "即将推出" : "Coming soon"}</span>;
}

/** Shown on public pages until comprehensive assessments open; sends testers to sign in and use their code. */
export function ComingSoonNotice() {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [soon, setSoon] = useState(false);
  useEffect(() => { earlyAccessApi.status().then((s) => setSoon(!s.open)); }, []);
  if (!soon) return null;
  return (
    <section id="early-access" aria-label={t.title} className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-950"><KeyRound className="h-5 w-5" />{t.title}</h2>
      <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-amber-950/90">{t.text}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/comprehensive" className="rounded-md bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white">{t.signup}</Link>
      </div>
    </section>
  );
}
