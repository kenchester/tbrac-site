"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { notFound: ["Page not found", "This page doesn't exist or has moved. If you followed a report link, check the number at tbrac.org/verify."],
        error: ["Something went wrong", "It's on our side, and it has been recorded. Please try again; your saved work is safe."],
        home: "Back to the homepage", verify: "Verify a report", retry: "Try again", contact: "Still stuck? Contact TBRAC" },
  zh: { notFound: ["页面未找到", "此页面不存在或已移动。如果您是通过报告链接访问的，请在 tbrac.org/verify 核对编号。"],
        error: ["出现了问题", "问题出在我们这边，已被记录。请重试；您已保存的内容不受影响。"],
        home: "返回首页", verify: "核验报告", retry: "重试", contact: "仍有问题？联系 TBRAC" },
};

export function ErrorScreen({ kind, retry }: { kind: "notFound" | "error"; retry?: () => void }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [title, text] = t[kind];
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-sm bg-[#0b1f3a] text-sm font-bold text-white">TB</span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{text}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {retry && <button type="button" onClick={retry} className="rounded-md bg-[#0b1f3a] px-4 py-2 text-sm font-semibold text-white">{t.retry}</button>}
          <Link href="/" className={`rounded-md px-4 py-2 text-sm font-semibold ${retry ? "border border-slate-300 hover:bg-white" : "bg-[#0b1f3a] text-white"}`}>{t.home}</Link>
          {!retry && <Link href="/verify" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-white">{t.verify}</Link>}
        </div>
        <Link href="/contact" className="mt-5 inline-block text-sm text-slate-500 hover:text-slate-900">{t.contact}</Link>
      </div>
    </main>
  );
}
