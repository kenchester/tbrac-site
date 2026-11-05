"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { title: "Get status alerts", text: "We'll email you if this report goes Under Review, is withdrawn, expires or is replaced.", email: "Work email",
        org: "Organization (optional)", go: "Email me", done: "Check your inbox and open the link to confirm. Nothing is sent until you do." },
  zh: { title: "接收状态提醒", text: "本报告进入“审查中”、被撤回、过期或被取代时，我们将通过电子邮件通知您。", email: "工作邮箱",
        org: "机构（可选）", go: "通知我", done: "请查收邮件并打开链接确认。确认前不会发送任何提醒。" },
};

/** "Email me if this report's status changes": double opt-in watchlist (verify page). */
export function WatchForm({ reportNumber }: { reportNumber: string }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("busy");
    const r = await fetch("/api/watch", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, report_number: reportNumber, organization: org || undefined }) });
    setState(r.ok ? "done" : "error");
  };
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <p className="flex items-center gap-2 font-semibold"><BellRing className="h-4 w-4" />{t.title}</p>
      <p className="mt-1 text-sm text-slate-600">{t.text}</p>
      {state === "done" ? <p className="mt-3 text-sm text-emerald-700">{t.done}</p> : (
        <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
          <input type="email" required placeholder={t.email} aria-label={t.email} value={email} onChange={(e) => setEmail(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm" />
          <input placeholder={t.org} aria-label={t.org} value={org} onChange={(e) => setOrg(e.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm" />
          <button disabled={state === "busy"} className="h-10 rounded-md bg-[#0b1f3a] px-4 text-sm font-semibold text-white">{t.go}</button>
        </form>
      )}
      {state === "error" && <p className="mt-2 text-sm text-red-600">Something went wrong. Please try again.</p>}
    </section>
  );
}
