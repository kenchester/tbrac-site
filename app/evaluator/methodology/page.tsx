"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { engagementsApi, type MethodologyVersionInfo } from "@/lib/engagements";

const DOMAINS = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** Parse one panelist per line: 21 values from the workbook's column F (comma, tab or space separated; "1/3" allowed). */
function parseJudgments(text: string): number[][] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) =>
    line.split(/[\s,;]+/).filter(Boolean).map((tok) => {
      const m = tok.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
      return m ? Number(m[1]) / Number(m[2]) : Number(tok);
    }));
}

function Weights({ w, base }: { w: Record<string, number>; base?: Record<string, number> }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-muted-foreground"><tr><th className="py-1">Domain</th><th>Weight</th>{base && <th>Starting</th>}</tr></thead>
      <tbody className="divide-y">{DOMAINS.map((d) => (
        <tr key={d}><td className="py-1 font-mono text-xs">{d}</td><td>{pct(w[d] ?? 0)}</td>{base && <td className="text-muted-foreground">{pct(base[d] ?? 0)}</td>}</tr>
      ))}</tbody>
    </table>
  );
}

export default function MethodologyAdminPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof engagementsApi.versions>> | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [f, setF] = useState({ version: "", judgments: "", roles: "Former CFIUS / Commerce official: 3\nState economic-development officer: 3\nSanctions counsel: 2\nChina governance specialist: 2",
    rounds: "2", consensus: "", sensitivity: "", changelog: "" });
  const load = useCallback(() => { engagementsApi.versions().then(setData).catch((e) => setError(errMsg(e))); }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (f2: () => Promise<unknown>, done: string) => {
    setError(""); setMsg("");
    try { await f2(); setMsg(done); load(); } catch (e) { setError(errMsg(e)); }
  };
  const save = () => run(() => engagementsApi.saveVersion({
    version: f.version.trim(), judgments: parseJudgments(f.judgments), rounds: Number(f.rounds) || 2,
    composition: f.roles.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = l.match(/^(.*?)[:\t]\s*(\d+)\s*$/); return { role: (m ? m[1] : l).trim(), count: m ? Number(m[2]) : 1 };
    }),
    consensus_notes: f.consensus || undefined, sensitivity: f.sensitivity || undefined, changelog: f.changelog,
  }), "Draft saved. Weights and consistency ratios were computed from the judgments.");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-10">
        <Link href="/evaluator/engagements" className="text-sm text-primary hover:underline">← Comprehensive assessments</Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Methodology calibration</h1>
          <p className="text-muted-foreground">Methodology §10 and §13. Domain weights come from the expert panel&apos;s pairwise judgments (AHP), computed here exactly as in the panel workbook.
            A different evaluator publishes. Published versions never change; new engagements use the latest one.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        {data && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Versions · new engagements use <span className="font-mono">{data.current}</span></CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">{data.builtin.version} <Badge variant="outline">built-in, provisional weights</Badge></p>
              </div>
              {data.versions.map((v: MethodologyVersionInfo) => (
                <div key={v.version} className="rounded-md border p-3 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold">{v.version}</span>
                    <Badge variant="outline" className={v.status === "published" ? "border-green-400 text-green-700" : v.status === "draft" ? "border-amber-400 text-amber-700" : ""}>{v.status}</Badge>
                    <span className="text-muted-foreground">drafted by {v.created_by}{v.published_by ? ` · published by ${v.published_by} ${v.published_at ? new Date(v.published_at).toLocaleDateString() : ""}` : ""}</span>
                    <div className="ml-auto flex gap-2">
                      {v.status === "draft" && <Button size="sm" onClick={() => run(() => engagementsApi.publishVersion(v.version), `Published ${v.version}.`)}>Publish</Button>}
                      {v.status === "published" && <Button size="sm" variant="outline" onClick={() => run(() => engagementsApi.retireVersion(v.version), `Retired ${v.version}.`)}>Retire</Button>}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                    <Weights w={v.domain_weights} base={data.builtin.domain_weights} />
                    <div className="space-y-1">
                      <p>Panel: {v.panel.size} members ({v.panel.composition.map((c) => `${c.role} ${c.count}`).join("; ")}), {v.panel.rounds} rounds.</p>
                      <p>Aggregate CR <b className={v.panel.aggregate_cr > 0.1 ? "text-red-700" : ""}>{v.panel.aggregate_cr.toFixed(3)}</b> (λmax {v.panel.lambda_max.toFixed(3)}).
                        Panelist CRs: {v.panel.panelist_crs.map((c, i) => <span key={i} className={c > 0.1 ? "text-red-700 font-medium" : ""}>{i ? ", " : ""}{c.toFixed(3)}</span>)}</p>
                      {!!v.panel.inconsistent_panelists?.length && <p className="text-red-700">Return workbooks to panelists {v.panel.inconsistent_panelists.join(", ")} (CR &gt; 0.10).</p>}
                      <p className="text-muted-foreground whitespace-pre-wrap">{v.changelog}</p>
                      {v.sensitivity && <p className="text-muted-foreground">Sensitivity: {v.sensitivity}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Draft a calibrated version</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1"><Label>Version</Label><Input placeholder="1.2" value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} /></div>
              <div className="space-y-1"><Label>Delphi rounds</Label><Input type="number" min="1" max="5" value={f.rounds} onChange={(e) => setF({ ...f, rounds: e.target.value })} /></div>
            </div>
            <div className="space-y-1">
              <Label>Panel judgments: one line per panelist, the 21 values from the workbook&apos;s column F (rows 5–25)</Label>
              <Textarea rows={8} className="font-mono text-xs" placeholder={"2\t3\t4\t3\t3\t5\t1\t2\t2\t2\t4\t2\t2\t2\t3\t1\t1/2\t2\t1/2\t2\t2"} value={f.judgments} onChange={(e) => setF({ ...f, judgments: e.target.value })} />
              {data && <p className="text-xs text-muted-foreground">Pair order: {data.pairs.map(([a, b]) => `${a}/${b}`).join(", ")}. Values must be on the 1–9 scale or reciprocals. Parsed: {parseJudgments(f.judgments).length} panelist(s).</p>}
            </div>
            <div className="space-y-1">
              <Label>Panel composition by role (published; never names), one per line as &quot;Role: count&quot;</Label>
              <Textarea rows={4} value={f.roles} onChange={(e) => setF({ ...f, roles: e.target.value })} />
            </div>
            <div className="space-y-1"><Label>Consensus status of each Delphi item</Label><Textarea rows={2} value={f.consensus} onChange={(e) => setF({ ...f, consensus: e.target.value })} /></div>
            <div className="space-y-1"><Label>Sensitivity analysis (§10.4): weights varied ±25–50%, additive vs geometric, tier stability</Label><Textarea rows={2} value={f.sensitivity} onChange={(e) => setF({ ...f, sensitivity: e.target.value })} /></div>
            <div className="space-y-1"><Label>Changelog</Label><Textarea rows={2} value={f.changelog} onChange={(e) => setF({ ...f, changelog: e.target.value })} /></div>
            <Button onClick={save} disabled={!f.version.trim() || f.changelog.trim().length < 10 || !f.judgments.trim()}>Save draft and compute weights</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
