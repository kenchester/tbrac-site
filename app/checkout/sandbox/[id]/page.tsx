"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FlaskConical, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { companyApi, money, type Payment } from "@/lib/certifications";

/** TBRAC's built-in test checkout for dummy companies: looks and behaves like card checkout, moves no money. */
export default function SandboxCheckout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const customer = useSearchParams().get("customer") ?? "";
  const [p, setP] = useState<Payment | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    companyApi.payments(customer).then((rows) => setP(rows.find((r) => r.id === id) ?? null)).catch(() => setError("Payment not found"));
  }, [customer, id]);

  const finish = async (outcome: "pay" | "decline") => {
    setBusy(outcome); setError("");
    const r = await fetch(`/api/payments/${id}/sandbox-complete`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customer, outcome }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.url) { window.location.href = j.url; return; }
    setError(j.error ?? "Payment failed"); setBusy("");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-sky-50 text-sky-950"><p className="mx-auto flex max-w-4xl items-center gap-2 px-5 py-2 text-sm">
        <FlaskConical className="h-4 w-4" /><b>Test checkout.</b> Dummy data only: no card is charged and no money moves.</p></div>
      <main className="mx-auto grid max-w-4xl gap-8 px-5 py-12 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#0b1f3a] text-sm font-bold text-white">TB</span>
            <span className="text-[15px] font-bold tracking-[0.18em]">TBRAC</span>
          </div>
          {p ? (
            <>
              <p className="mt-8 text-sm text-slate-500">{p.description}</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">{money(p.amount_cents, p.currency)}</p>
              <p className="mt-4 text-sm text-slate-600">Flat fee, the same for every company. It does not depend on the outcome.</p>
              {p.status !== "requested" && <p className="mt-4 text-sm font-medium text-emerald-700">This fee is already {p.status}.</p>}
            </>
          ) : <p className="mt-8 text-sm text-slate-500">{error || "Loading…"}</p>}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-slate-900">Pay with card</p>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block"><span className="text-slate-600">Card number</span>
              <input readOnly value="4242 4242 4242 4242" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 font-mono" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-slate-600">Expiry</span><input readOnly value="12 / 34" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 font-mono" /></label>
              <label className="block"><span className="text-slate-600">CVC</span><input readOnly value="123" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 font-mono" /></label>
            </div>
          </div>
          <Button className="mt-6 w-full" disabled={!p || p.status !== "requested" || !!busy} onClick={() => finish("pay")}>
            <Lock className="mr-2 h-4 w-4" />{busy === "pay" ? "Processing…" : p ? `Pay ${money(p.amount_cents, p.currency)}` : "Pay"}
          </Button>
          <div className="mt-3 flex justify-between text-sm">
            <button type="button" className="text-slate-500 hover:text-slate-900" disabled={!!busy} onClick={() => finish("decline")}>Simulate a declined card</button>
            <Link href={`/customers/${customer}?payment=canceled`} className="text-slate-500 hover:text-slate-900">Cancel</Link>
          </div>
          {error && p && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </main>
    </div>
  );
}
