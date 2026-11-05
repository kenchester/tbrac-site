"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language-context";

interface Info {
  name: string; role: string; round: number; target_version: string; title: string; feedback: string | null; status: string;
  closes_at: string | null; domains: Record<string, { name: string; indicators: string[] }>; pairs: [string, string][];
  judgments: number[] | null; comments: string | null; conflicts: string | null; confirmed_independent: boolean;
  submitted_at: string | null; max_cr: number;
}
interface Check { weights: Record<string, number>; cr: number; consistent: boolean; reconsider: number[] }

// Position -8..8 on the scale: negative = the left domain counts more (9 at -8), 0 = equal, positive = the right counts more.
const toValue = (p: number) => (p <= 0 ? 1 - p : 1 / (1 + p));
const toPos = (v: number) => (v >= 1 ? 1 - Math.round(v) : Math.round(1 / v) - 1);
const POSITIONS = Array.from({ length: 17 }, (_, i) => i - 8);
const WORD: Record<number, string> = { 1: "equal", 3: "moderately", 5: "strongly", 7: "very strongly", 9: "extremely" };

export default function PanelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const site = useLanguage();
  useEffect(() => site.registerToggle(), []); // eslint-disable-line react-hooks/exhaustive-deps -- English-only page
  const [info, setInfo] = useState<Info | null>(null);
  const [pos, setPos] = useState<number[]>(Array(21).fill(0));
  const [check, setCheck] = useState<Check | null>(null);
  const [comments, setComments] = useState("");
  const [conflicts, setConflicts] = useState("");
  const [indep, setIndep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/v1/panel/access/${token}`, { cache: "no-store" }).then(async (r) => {
      const j = await r.json();
      if (!r.ok) { setError(j.detail ?? "This link is not valid"); return; }
      setInfo(j);
      if (j.judgments) setPos(j.judgments.map(toPos));
      setComments(j.comments ?? ""); setConflicts(j.conflicts ?? ""); setIndep(j.confirmed_independent);
    }).catch(() => setError("This link is not valid"));
  }, [token]);

  const runCheck = useCallback((p: number[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/v1/panel/access/${token}/check`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgments: p.map(toValue) }) }).then((r) => r.json()).then((j) => { if (j.weights) setCheck(j); }).catch(() => {});
    }, 300);
  }, [token]);
  useEffect(() => { if (info) runCheck(pos); }, [pos, info, runCheck]);

  const save = async (submit: boolean) => {
    setBusy(true); setError(""); setMsg("");
    try {
      const r = await fetch(`/api/v1/panel/access/${token}/save`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgments: pos.map(toValue), comments, conflicts, confirmed_independent: indep, submit }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail ?? "Could not save");
      setInfo((i) => (i ? { ...i, submitted_at: j.submitted_at } : i));
      setMsg(submit ? "Submitted. Thank you. You can still change and resubmit until the round closes." : "Saved. Not yet submitted.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); } finally { setBusy(false); }
  };

  if (!info) return <main className="mx-auto max-w-3xl px-5 py-16 text-slate-600">{error || "Loading…"}</main>;
  const closed = info.status !== "open";
  const name = (d: string) => info.domains[d]?.name ?? d;
  const maxW = check ? Math.max(...Object.values(check.weights)) : 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#0b1f3a] text-xs font-bold text-white">TB</span>
          <span className="text-sm font-bold tracking-[0.18em]">TBRAC</span>
          <span className="ml-2 text-sm text-slate-500">Expert panel</span>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{info.title}</h1>
            <p className="mt-1 text-sm text-slate-600">Methodology {info.target_version} · round {info.round} · {info.name}, {info.role}
              {info.closes_at && ` · closes ${new Date(info.closes_at).toLocaleDateString("en-US", { dateStyle: "long" })}`}</p>
          </div>
          {closed && <p className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm">This round has closed. Your answers are shown for reference.</p>}
          <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-5 text-[15px] leading-relaxed text-slate-700">
            <p>For a US county, state agency or partner deciding whether to rely on a company with Chinese ownership or ties, how much should each risk domain
              count in the overall rating? Compare the domains two at a time: pick the side that should count more, and by how much.</p>
            <p className="text-sm text-slate-500">Scale: 1 equal · 3 moderately more · 5 strongly more · 7 very strongly more · 9 extremely more (even numbers in between).
              Your answers should hang together: if A counts more than B and B more than C, A should count more than C. The consistency ratio (CR) must be at most {info.max_cr} to submit.</p>
            {info.feedback && <div className="rounded-md bg-slate-50 p-3 text-sm"><p className="font-medium text-slate-900">From the facilitator</p><p className="whitespace-pre-wrap">{info.feedback}</p></div>}
            <details className="text-sm"><summary className="cursor-pointer font-medium text-slate-900">What each domain covers</summary>
              <ul className="mt-2 space-y-2">{Object.entries(info.domains).map(([d, x]) => (
                <li key={d}><b>{d} {x.name}</b><span className="block text-slate-500">{x.indicators.join("; ")}</span></li>
              ))}</ul>
            </details>
          </section>

          <section className="space-y-3">
            {info.pairs.map(([a, b], k) => {
              const flag = check?.reconsider.includes(k);
              const p = pos[k];
              const v = toValue(p);
              const strength = v >= 1 ? Math.round(v) : Math.round(1 / v);
              return (
                <div key={k} className={`rounded-lg border bg-white p-4 ${flag ? "border-amber-400 ring-1 ring-amber-300" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between gap-4 text-sm font-medium text-slate-900">
                    <span className={p < 0 ? "text-[#0b1f3a]" : "text-slate-500"}>{a} {name(a)}</span>
                    <span className={`text-right ${p > 0 ? "text-[#0b1f3a]" : "text-slate-500"}`}>{b} {name(b)}</span>
                  </div>
                  <div className="mt-3 flex gap-0.5" role="radiogroup" aria-label={`${name(a)} compared with ${name(b)}`}>
                    {POSITIONS.map((x) => (
                      <button key={x} type="button" role="radio" aria-checked={p === x} disabled={closed}
                        aria-label={x === 0 ? "Equal" : `${x < 0 ? name(a) : name(b)} ${1 + Math.abs(x)} times`}
                        onClick={() => setPos(pos.map((y, i) => (i === k ? x : y)))}
                        className={`h-8 flex-1 rounded-sm text-[11px] tabular-nums transition-colors ${p === x ? "bg-[#0b1f3a] text-white"
                          : x === 0 ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {x === 0 ? "=" : 1 + Math.abs(x)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {p === 0 ? "Equal importance" : `${p < 0 ? name(a) : name(b)} counts ${WORD[strength] ?? ""} more (${strength})`}
                    {flag && <span className="ml-2 font-medium text-amber-700">Reconsider: this comparison disagrees most with your other answers.</span>}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
            <label className="block text-sm font-medium text-slate-900">Reasons or comments (shared anonymously with the panel in the next round)
              <Textarea className="mt-1" rows={3} value={comments} disabled={closed} onChange={(e) => setComments(e.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-900">Interests to disclose (clients, employers or holdings related to companies TBRAC may assess)
              <Textarea className="mt-1" rows={2} value={conflicts} disabled={closed} onChange={(e) => setConflicts(e.target.value)} placeholder="None" /></label>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-1" checked={indep} disabled={closed} onChange={(e) => setIndep(e.target.checked)} />
              My judgments are my own professional view. No company TBRAC may assess, and no one with a financial interest in the weights, has influenced them.
            </label>
            {msg && <p className="text-sm text-green-700">{msg}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!closed && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={busy} onClick={() => save(false)}>Save without submitting</Button>
                <Button disabled={busy || !check?.consistent || !indep} onClick={() => save(true)}>{info.submitted_at ? "Resubmit" : "Submit"}</Button>
              </div>
            )}
            {info.submitted_at && <p className="text-xs text-slate-500">Submitted {new Date(info.submitted_at).toLocaleString()}.</p>}
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Your implied weights</p>
            <ul className="mt-3 space-y-2">
              {Object.keys(info.domains).map((d) => (
                <li key={d} className="text-xs">
                  <div className="flex justify-between text-slate-600"><span>{d} {name(d)}</span><span className="tabular-nums">{check ? `${(check.weights[d] * 100).toFixed(1)}%` : ""}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0b1f3a]" style={{ width: `${check ? (check.weights[d] / maxW) * 100 : 0}%` }} /></div>
                </li>
              ))}
            </ul>
            {check && (
              <p className={`mt-4 flex items-center gap-2 text-sm font-medium ${check.consistent ? "text-emerald-700" : "text-amber-700"}`}>
                {check.consistent ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                CR {check.cr.toFixed(3)} {check.consistent ? "· consistent" : `· above ${info.max_cr}; adjust the highlighted rows`}
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
