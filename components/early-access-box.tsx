"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { label: "Early-access code", apply: "Apply code", checking: "Checking…", bad: "That code is not valid.",
        many: "Too many attempts. Please try again in an hour." },
  zh: { label: "抢先体验码", apply: "使用体验码", checking: "正在核验…", bad: "体验码无效。",
        many: "尝试次数过多，请一小时后再试。" },
};

/** Entry box for a tester's early-access code. `check` asks the API; the code itself never ships in the page. */
export function EarlyAccessBox({ hint, check, onAccepted }:
  { hint: string; check: (code: string) => Promise<unknown>; onAccepted: (code: string) => void }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    setBusy(true); setError("");
    try { await check(c); onAccepted(c); }
    catch (err) {
      const status = (err as { status?: number })?.status;
      setError(status === 429 || /too many/i.test(String((err as Error)?.message)) ? t.many : t.bad);
    } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <label htmlFor="early-access-code" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <KeyRound className="h-4 w-4 text-slate-500" />{t.label}
      </label>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input id="early-access-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" inputMode="numeric"
               className="w-40 bg-white font-mono tracking-widest" maxLength={50} aria-invalid={!!error} aria-describedby={error ? "early-access-error" : undefined} />
        <Button type="submit" variant="outline" disabled={busy || !code.trim()}>{busy ? t.checking : t.apply}</Button>
      </div>
      {error && <p id="early-access-error" role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </form>
  );
}
