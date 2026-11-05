"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authenticatedRequest } from "@/lib/api-client";

interface Summary {
  funnel: { step: string; count: number }[]; new_companies_30_days: number; requests: Record<string, number>;
  engagements_by_stage: Record<string, number>; revenue_cents: { last_30_days: number; last_365_days: number; all_time: number };
  open_payments: { id: string; company: string; description: string; amount_cents: number; requested_at: string }[];
  expiring_90_days: { engagement_id: string; company: string; report_number: string | null; valid_until: string; days_left: number; reevaluation_requested: boolean }[];
}
const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(c / 100);
const day = (d: string) => new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" });

/** Business view for TBRAC staff. Dummy companies are excluded. */
export default function BusinessPage() {
  const [s, setS] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { authenticatedRequest<Summary>("/api/v1/business/summary").then(setS).catch((e) => setError(e instanceof Error ? e.message : "Could not load")); }, []);
  return (
    <div className="min-h-screen bg-background">
      <Header minimal />
      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-10">
        <Link href="/evaluator/engagements" className="text-sm text-primary hover:underline">← Comprehensive assessments</Link>
        <div><h1 className="text-3xl font-bold tracking-tight">Business</h1>
          <p className="text-muted-foreground">Real clients only; dummy companies are left out.</p></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!s && !error && <p className="text-muted-foreground">Loading…</p>}
        {s && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[["Revenue, last 30 days", usd(s.revenue_cents.last_30_days)], ["Revenue, last 12 months", usd(s.revenue_cents.last_365_days)],
                ["Fees awaiting payment", usd(s.open_payments.reduce((n, p) => n + p.amount_cents, 0))], ["New companies, last 30 days", String(s.new_companies_30_days)]]
                .map(([k, v]) => (
                  <Card key={k}><CardContent className="py-5"><p className="text-sm text-muted-foreground">{k}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p></CardContent></Card>
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">From sign-up to rating</CardTitle></CardHeader>
                <CardContent>
                  <table className="w-full text-sm"><tbody className="divide-y">
                    {s.funnel.map((f, i) => (
                      <tr key={f.step}><td className="py-2">{f.step}</td><td className="py-2 text-right font-semibold tabular-nums">{f.count}</td>
                        <td className="w-24 py-2 text-right text-xs text-muted-foreground tabular-nums">{i && s.funnel[i - 1].count ? `${Math.round((f.count / s.funnel[i - 1].count) * 100)}% of above` : ""}</td></tr>
                    ))}
                  </tbody></table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Requests and engagements</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">{Object.entries(s.requests).map(([k, v]) => <Badge key={k} variant="outline">{k.replace("_", " ")}: {v}</Badge>)}</div>
                  <div className="flex flex-wrap gap-2">{Object.entries(s.engagements_by_stage).map(([k, v]) => <Badge key={k} variant="secondary">{k.replace("_", " ")}: {v}</Badge>)}</div>
                  <p className="text-muted-foreground">All-time revenue: {usd(s.revenue_cents.all_time)}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Ratings expiring in the next 90 days</CardTitle>
                <p className="text-xs text-muted-foreground">Each company is reminded at 90, 60 and 30 days. Those without a re-evaluation request are renewal opportunities.</p></CardHeader>
              <CardContent>
                {s.expiring_90_days.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                  <table className="w-full text-sm"><tbody className="divide-y">{s.expiring_90_days.map((e) => (
                    <tr key={e.engagement_id}><td className="py-2"><Link href={`/evaluator/engagements/${e.engagement_id}`} className="text-primary hover:underline">{e.company}</Link>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{e.report_number}</span></td>
                      <td className="py-2">{day(e.valid_until)} ({e.days_left} days)</td>
                      <td className="py-2 text-right">{e.reevaluation_requested ? <Badge>Re-evaluation requested</Badge> : <Badge variant="outline">No request yet</Badge>}</td></tr>
                  ))}</tbody></table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Fees awaiting payment</CardTitle></CardHeader>
              <CardContent>
                {s.open_payments.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                  <table className="w-full text-sm"><tbody className="divide-y">{s.open_payments.map((p) => (
                    <tr key={p.id}><td className="py-2">{p.company}</td><td className="py-2">{p.description}</td><td className="py-2 tabular-nums">{usd(p.amount_cents)}</td>
                      <td className="py-2 text-right text-muted-foreground">requested {day(p.requested_at)}</td></tr>
                  ))}</tbody></table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
