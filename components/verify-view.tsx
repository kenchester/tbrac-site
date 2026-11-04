"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, XCircle, Search } from "lucide-react";

interface Verified {
  report_number: string; subject: string; engagement_type: string; scope: string | null; tier: string | null;
  confidence: string | null; outlook: string | null; domain_tiers: Record<string, string>; methodology_version: string;
  issued_at: string; valid_until: string; status: string; status_note: string | null; fingerprint: string; checked_at: string;
}

const TIER: Record<string, string> = { T1: "T1 · Low identified risk", T2: "T2 · Moderate", T3: "T3 · Elevated", T4: "T4 · High", UA: "Unable to assess" };
const DOMAINS: Record<string, string> = {
  D1: "Ownership and state / Party / military linkage", D2: "National security, technology and export control", D3: "Data security and PRC access",
  D4: "Supply chain and forced labor", D5: "Integrity, influence and legal history", D6: "Financial integrity and governance", D7: "IP conduct",
};
const day = (d: string) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#0b1f3a] text-sm font-bold text-white">TB</span>
            <span className="text-[15px] font-bold tracking-[0.18em]">TBRAC</span>
          </Link>
          <span className="text-sm text-slate-500">Report verification</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">{children}</main>
    </div>
  );
}

export function VerifyForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [n, setN] = useState(initial);
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (n.trim()) router.push(`/verify/${encodeURIComponent(n.trim().toUpperCase())}`); }}>
      <input className="h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 font-mono text-sm uppercase" placeholder="TBRAC-2026-0001"
        value={n} onChange={(e) => setN(e.target.value)} aria-label="Report number" />
      <button className="inline-flex items-center gap-2 rounded-md bg-[#0b1f3a] px-4 text-sm font-semibold text-white"><Search className="h-4 w-4" />Verify</button>
    </form>
  );
}

export function VerifyLanding() {
  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Verify a TBRAC report</h1>
      <p className="text-slate-600">Enter the report number printed on the report. You will see its current status (Current, Under Review, Withdrawn, Expired or Superseded) and the fingerprint that proves the rating on your copy is unaltered.</p>
      <VerifyForm />
    </Shell>
  );
}

export function VerifyResult({ number }: { number: string }) {
  const [v, setV] = useState<Verified | null>(null);
  const [missing, setMissing] = useState(false);
  const [fp, setFp] = useState("");
  useEffect(() => {
    fetch(`/api/v1/public/verify/${encodeURIComponent(number)}`).then(async (r) => {
      if (r.ok) setV(await r.json()); else setMissing(true);
    }).catch(() => setMissing(true));
  }, [number]);

  if (missing) return (
    <Shell>
      <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
        <XCircle className="h-6 w-6 shrink-0" />
        <div><p className="font-semibold">No report with the number {number}</p><p className="text-sm">Check the number on your copy. A report not in this register was not issued by TBRAC.</p></div>
      </div>
      <VerifyForm initial={number} />
    </Shell>
  );
  if (!v) return <Shell><p className="text-slate-500">Checking…</p></Shell>;

  const good = v.status === "Current";
  const fpTrim = fp.trim().toLowerCase();
  return (
    <Shell>
      <div className={`flex gap-3 rounded-lg border p-5 ${good ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        {good ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <AlertTriangle className="h-6 w-6 shrink-0" />}
        <div>
          <p className="font-semibold">{v.report_number} is in the TBRAC register · Status: {v.status}</p>
          <p className="text-sm">{good ? `Current until ${day(v.valid_until)}.` : v.status_note || "Do not rely on this report's rating without contacting TBRAC."}</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Public summary as issued</p>
        <h1 className="mt-1 text-2xl font-semibold">{v.subject}</h1>
        <p className="text-sm text-slate-600"><span className="capitalize">{v.engagement_type}</span> assessment · Methodology {v.methodology_version} · Issued {day(v.issued_at)} · Valid until {day(v.valid_until)}</p>
        {v.scope && <p className="mt-2 text-sm"><span className="font-medium">Scope:</span> {v.scope}</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[["Tier", v.tier ? TIER[v.tier] ?? v.tier : "—"], ["Confidence", v.confidence ?? "—"], ["Outlook", v.outlook ? v.outlook[0].toUpperCase() + v.outlook.slice(1) : "—"]].map(([k, x]) => (
            <div key={k} className="rounded border border-slate-200 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{k}</p><p className="mt-1 font-semibold">{x}</p></div>
          ))}
        </div>
        <table className="mt-4 w-full text-sm"><tbody className="divide-y divide-slate-100">
          {Object.entries(v.domain_tiers).map(([d, t]) => <tr key={d}><td className="py-1.5 text-slate-600">{d} {DOMAINS[d] ?? ""}</td><td className="py-1.5 text-right font-semibold">{t}</td></tr>)}
        </tbody></table>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 space-y-2">
        <p className="font-semibold">Check your copy</p>
        <p className="text-sm text-slate-600">Paste the fingerprint printed on your report. If it matches, the rating on your copy is the one TBRAC issued.</p>
        <input className="h-10 w-full rounded-md border border-slate-300 px-3 font-mono text-xs" placeholder="64-character fingerprint" value={fp} onChange={(e) => setFp(e.target.value)} />
        {fpTrim && (fpTrim === v.fingerprint
          ? <p className="text-sm font-medium text-emerald-700">✓ Fingerprint matches.</p>
          : <p className="text-sm font-medium text-red-700">✗ Fingerprint does not match this report. Contact TBRAC before relying on your copy.</p>)}
        <p className="break-all font-mono text-xs text-slate-400">Register fingerprint: {v.fingerprint}</p>
      </section>

      <p className="text-xs leading-relaxed text-slate-500">
        A TBRAC report is an independent risk opinion as of the date stated. It is not a certification, guarantee or approval; not a CFIUS determination or a decision of any government agency;
        it does not override any statute and is not legal advice. Confidential findings are available only to the named intended users. Checked {new Date(v.checked_at).toLocaleString()}.
      </p>
    </Shell>
  );
}
