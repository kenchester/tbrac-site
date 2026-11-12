"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { earlyAccessApi } from "@/lib/certifications";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { title: "Comprehensive assessments: coming soon",
        text: "They open to all companies soon. If you are taking part in early testing, create an account or sign in, then enter your early-access code on your dashboard. Your progress is saved in your account, so you can stop and come back.",
        signup: "Create an account", signin: "Sign in" },
  zh: { title: "全面评估：即将推出",
        text: "全面评估即将向所有企业开放。如您参与抢先测试，请创建账户或登录，然后在概览页面输入抢先体验码。您的进度会保存在账户中，可随时中断后继续。",
        signup: "创建账户", signin: "登录" },
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
        <Link href="/company/login?tab=signup" className="rounded-md bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white">{t.signup}</Link>
        <Link href="/company/login" className="rounded-md border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">{t.signin}</Link>
      </div>
    </section>
  );
}
