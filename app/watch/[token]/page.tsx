"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Copyright } from "@/components/copyright";

interface Item { report_number: string; subject: string | null; tier: string | null; status: string | null; status_note: string | null; valid_until: string | null; test: boolean }
interface View { email: string; organization: string | null; confirmed_at: string | null; items: Item[] }

/** Private watchlist page (from the emailed link): confirm, add or remove reports, unsubscribe. */
export default function WatchPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [v, setV] = useState<View | null>(null);
  const [number, setNumber] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const call = useCallback(async (path = "", init?: RequestInit) => {
    setError("");
    const r = await fetch(`/api/v1/public/watch/${token}${path}`, { cache: "no-store", ...init, headers: { "Content-Type": "application/json" } });
    const j = await r.json();
    if (!r.ok) { setError(j.detail ?? "Something went wrong"); return null; }
    return j;
  }, [token]);
  useEffect(() => { call().then((j) => j && setV(j)); }, [call]);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const j = await call("/items", { method: "POST", body: JSON.stringify({ report_number: number }) });
    if (j) { setV(j); setNumber(""); }
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl space-y-6 px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Status alerts</h1>
        {error && !v && <p className="rounded-md border border-red-200 bg-red-50 p-4 text-red-900">{error} <Link className="underline" href="/watch">Request a new link</Link>.</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {v && (
          <>
            <p className="text-slate-600">Alerts go to <b>{v.email}</b>{v.organization ? ` (${v.organization})` : ""} whenever a report below goes Under Review, is affirmed, withdrawn,
              replaced or expires. They contain only the public status.</p>
            <div className="divide-y rounded-lg border border-slate-200 bg-white">
              {v.items.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No reports on your watchlist.</p>}
              {v.items.map((i) => (
                <div key={i.report_number} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <Link href={`/verify/${i.report_number}`} className="font-medium text-slate-900 hover:underline">{i.subject ?? i.report_number}</Link>
                    <p className="font-mono text-xs text-slate-500">{i.report_number}{i.test ? " · test report" : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${i.status === "Current" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{i.tier ? `${i.tier} · ` : ""}{i.status}</span>
                    <button type="button" className="text-sm text-slate-500 hover:text-red-700"
                      onClick={async () => { const j = await call(`/items/${i.report_number}`, { method: "DELETE" }); if (j) setV(j); }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={add} className="flex gap-2">
              <input className="h-10 flex-1 rounded-md border border-slate-300 px-3 font-mono text-sm uppercase" placeholder="Add a report number, e.g. TBRAC-2026-0001-K7Q4M"
                aria-label="Report number" value={number} onChange={(e) => setNumber(e.target.value)} />
              <button className="h-10 rounded-md bg-[#0b1f3a] px-4 text-sm font-semibold text-white" disabled={!number.trim()}>Add</button>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" className="text-sm text-slate-500 hover:text-red-700"
              onClick={async () => { if (await call("/unsubscribe", { method: "POST" })) { setV(null); setMsg("Unsubscribed. You will not receive further alerts."); } }}>Unsubscribe from all alerts</button>
          </>
        )}
      </main>
      <Copyright />
    </div>
  );
}
