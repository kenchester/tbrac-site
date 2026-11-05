"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { Copyright } from "@/components/copyright";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { authenticatedRequest } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { title: (o: string) => `${o} has asked TBRAC to assess your company`, company: "Company", purpose: "Purpose",
        body: "Accepting opens the assessment on your company account. TBRAC will send your engagement letter next. The report belongs to the public body that asked for it, and you see the draft factual findings and can correct them before any decision.",
        accept: "Accept and continue", accepting: "Opening…", signup: "Create your company account", signin: "Sign in", signedIn: (e: string) => `Signed in as ${e}.` },
  zh: { title: (o: string) => `${o} 已委托 TBRAC 评估贵公司`, company: "企业", purpose: "目的",
        body: "接受后，评估将在贵公司账户中开启，TBRAC 随后将发送委托书。报告归委托的公共机构所有；在作出任何决定前，您可以查看并更正事实性调查结果草稿。",
        accept: "接受并继续", accepting: "正在打开…", signup: "创建企业账户", signin: "登录", signedIn: (e: string) => `当前账户：${e}。` },
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const { user, loading } = useAuth();
  const [info, setInfo] = useState<{ organization: string; purpose: string; company_name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/v1/invites/${token}`, { cache: "no-store" }).then(async (r) => { const j = await r.json(); if (r.ok) setInfo(j); else setError(j.detail ?? "This invitation is not valid"); })
      .catch(() => setError("This invitation is not valid"));
  }, [token]);
  const next = encodeURIComponent(`/invite/${token}`);
  const accept = async () => {
    setBusy(true); setError("");
    try {
      const r = await authenticatedRequest<{ customer_id: string }>(`/api/v1/invites/${token}/accept`, { method: "POST" });
      window.location.assign(`/customers/${r.customer_id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not accept"); setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-2xl space-y-4 px-5 py-12">
        {!info && !error && <p className="text-slate-500">…</p>}
        {!info && error && <p className="rounded-md border border-red-200 bg-red-50 p-5 text-red-900">{error}</p>}
        {info && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-7">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t.title(info.organization)}</h1>
            <p className="text-sm text-slate-600">{t.company}: <b>{info.company_name}</b></p>
            <p className="text-sm text-slate-600">{t.purpose}: {info.purpose}</p>
            <p className="text-[15px] leading-relaxed text-slate-700">{t.body}</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && user && (
              <>
                <VerifyEmailBanner />
                <p className="text-sm text-slate-500">{t.signedIn(user.email)}</p>
                <Button disabled={busy || !user.emailVerified} onClick={accept}>{busy ? t.accepting : t.accept}</Button>
              </>
            )}
            {!loading && !user && (
              <div className="flex flex-wrap gap-3">
                <Button asChild><Link href={`/company/login?tab=signup&next=${next}`}>{t.signup}</Link></Button>
                <Button asChild variant="outline"><Link href={`/company/login?next=${next}`}>{t.signin}</Link></Button>
              </div>
            )}
          </div>
        )}
      </main>
      <Copyright />
    </div>
  );
}
