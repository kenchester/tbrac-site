"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { engagementsApi, stageLabel, type EngagementSummary } from "@/lib/engagements";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

function NewEngagement({ onCreated }: { onCreated: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; chinese_name: string | null }[]>([]);
  const [subject, setSubject] = useState<{ id: string; name: string } | null>(null);
  const [type, setType] = useState("design");
  const [track, setTrack] = useState("subject_engaged");
  const [project, setProject] = useState("");
  const [relying, setRelying] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (subject) return;
    const t = setTimeout(() => {
      engagementsApi.subjects(search).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search, subject]);

  const create = async () => {
    if (!subject) return;
    setBusy(true);
    setError("");
    try {
      const e = await engagementsApi.create({
        customer_id: subject.id,
        engagement_type: type,
        track,
        project_description: project || undefined,
        relying_parties: relying.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onCreated(e.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the engagement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">New engagement</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="subject-search">Subject company</Label>
          {subject ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">{subject.name}</Badge>
              <Button variant="ghost" size="sm" onClick={() => setSubject(null)}>Change</Button>
            </div>
          ) : (
            <>
              <Input id="subject-search" placeholder="Search registered companies by name" value={search}
                onChange={(e) => setSearch(e.target.value)} />
              <div className="max-h-48 overflow-auto rounded-md border divide-y">
                {results.length === 0 && <p className="p-3 text-sm text-muted-foreground">No matching companies.</p>}
                {results.map((r) => (
                  <button key={r.id} type="button" onClick={() => setSubject(r)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted outline-none">
                    {r.name}{r.chinese_name ? <span className="text-muted-foreground"> · {r.chinese_name}</span> : null}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="eng-type">Engagement type</Label>
          <select id="eng-type" className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="design">Design assessment (point in time)</option>
            <option value="operating">Operating assessment (6–12 month observation)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eng-track">Engagement track</Label>
          <select id="eng-track" className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="subject_engaged">Subject-engaged (reliance letters required)</option>
            <option value="government_directed">Government-directed (escrow-funded)</option>
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="eng-project">Project (site, asset, data, technology)</Label>
          <Textarea id="eng-project" rows={3} value={project} onChange={(e) => setProject(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="eng-relying">Relying parties (comma-separated)</Label>
          <Input id="eng-relying" placeholder="e.g. Example County Economic Development Corporation" value={relying}
            onChange={(e) => setRelying(e.target.value)} />
        </div>
        {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
        <div className="md:col-span-2">
          <Button onClick={create} disabled={!subject || busy}>{busy ? "Creating…" : "Create engagement"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EngagementsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<EngagementSummary[] | null>(null);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => {
    engagementsApi.list().then(setRows).catch((e) => setError(e instanceof Error ? e.message : "Could not load engagements"));
  }, []);
  useEffect(load, [load]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-6 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Independent assessments</h1>
            <p className="text-muted-foreground">Engagements scored under the TBRAC methodology.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/evaluator/dashboard">Self-assessment review</Link></Button>
            <Button onClick={() => setShowNew((v) => !v)}>{showNew ? "Cancel" : "New engagement"}</Button>
          </div>
        </div>

        {showNew && <NewEngagement onCreated={(id) => router.push(`/evaluator/engagements/${id}`)} />}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Lead analyst</th>
                  <th className="px-4 py-3 font-medium">Valid until</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows === null && !error && (
                  <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">Loading…</td></tr>
                )}
                {rows?.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">No engagements yet. Use “New engagement” to open one.</td></tr>
                )}
                {rows?.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link className="font-medium text-primary hover:underline" href={`/evaluator/engagements/${r.id}`}>{r.customer_name}</Link>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline">{stageLabel(r.stage)}</Badge></td>
                    <td className="px-4 py-3 capitalize">{r.engagement_type}</td>
                    <td className="px-4 py-3">{r.lead_analyst ?? "—"}</td>
                    <td className="px-4 py-3">{fmt(r.valid_until)}</td>
                    <td className="px-4 py-3">{fmt(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
