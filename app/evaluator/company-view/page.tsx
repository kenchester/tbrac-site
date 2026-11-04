"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, UserRoundCheck, ArrowRight, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { companyViewApi, type AssistedSession, type ClientRow, type Sandbox } from "@/lib/company-view";

const fmt = (d: string) => new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

type Mode = "sandbox" | "assist" | null;

export default function CompanyViewPage() {
  const [mode, setMode] = useState<Mode>(null);
  return (
    <div className="min-h-screen bg-background">
      <Header minimal />
      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-10">
        <Link href="/evaluator/engagements" className="text-sm text-primary hover:underline">← Comprehensive assessments</Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company view</h1>
          <p className="text-muted-foreground">Use the company side exactly as a client sees it: the free self-assessment, document requests,
            draft findings and the comprehensive assessment. First choose what you are opening.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2" role="radiogroup" aria-label="What are you opening?">
          <Choice active={mode === "sandbox"} onClick={() => setMode("sandbox")} icon={<FlaskConical className="h-5 w-5" />}
            title="Dummy data" text="A test company shared by all staff. Nothing you do affects a real client, and reports issued for it are numbered TEST-… and marked as tests on the public register." />
          <Choice active={mode === "assist"} onClick={() => setMode("assist")} icon={<UserRoundCheck className="h-5 w-5" />}
            title="Actual client" text="Work on a real client's pages for them, when they need help. The session lasts 4 hours, every change is recorded, and the client sees the session on their dashboard." />
        </div>

        {mode === "sandbox" && <SandboxPanel />}
        {mode === "assist" && <AssistPanel />}
      </main>
    </div>
  );
}

function Choice({ active, onClick, icon, title, text }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button type="button" role="radio" aria-checked={active} onClick={onClick}
      className={`rounded-lg border p-5 text-left transition-colors ${active ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted/50"}`}>
      <span className="flex items-center gap-2 font-semibold">{icon}{title}</span>
      <span className="mt-2 block text-sm text-muted-foreground">{text}</span>
    </button>
  );
}

function SandboxPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<Sandbox[] | null>(null);
  const [name, setName] = useState("");
  const [sample, setSample] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(() => { companyViewApi.sandboxes().then(setRows).catch((e) => setError(msg(e))); }, []);
  useEffect(load, [load]);

  const create = async () => {
    setBusy(true); setError("");
    try { const c = await companyViewApi.createSandbox(name.trim(), sample); router.push(`/customers/${c.id}`); }
    catch (e) { setError(msg(e)); setBusy(false); }
  };
  const remove = async (s: Sandbox) => {
    try { await companyViewApi.deleteSandbox(s.id); load(); } catch (e) { setError(msg(e)); }
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Dummy companies</CardTitle>
        <p className="text-sm text-muted-foreground">Open one to take the self-assessment and request a comprehensive assessment as the company would.
          Then open its engagement under Comprehensive assessments to run the evaluator side. Dummy engagements are labelled throughout.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows === null && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows?.length === 0 && <p className="text-sm text-muted-foreground">No dummy companies yet.</p>}
        {rows && rows.length > 0 && (
          <ul className="divide-y rounded-md border">
            {rows.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-medium">{s.name} <Badge variant="outline" className="ml-1">Dummy data</Badge></p>
                  <p className="text-xs text-muted-foreground">Created {fmt(s.created_at)} · {s.engagements} engagement{s.engagements === 1 ? "" : "s"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" asChild><Link href={`/customers/${s.id}`}>Open company view <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
                  {s.engagements === 0 && <Button size="sm" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2 rounded-md border border-dashed p-4">
          <p className="text-sm font-medium">New dummy company</p>
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-sm" placeholder="Name (optional), e.g. Demo Battery Co." value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
            <Button onClick={create} disabled={busy}>{busy ? "Creating…" : "Create and open"}</Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} /> Fill in a sample company profile (fictional)
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

function AssistPanel() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [picked, setPicked] = useState<ClientRow | null>(null);
  const [reason, setReason] = useState("");
  const [sessions, setSessions] = useState<AssistedSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { companyViewApi.clients(search.trim() || undefined).then(setRows).catch((e) => setError(msg(e))); }, 250);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { companyViewApi.sessions().then(setSessions).catch(() => {}); }, []);

  const start = async () => {
    if (!picked) return;
    setBusy(true); setError("");
    try { await companyViewApi.startAssist(picked.id, reason.trim()); router.push(`/customers/${picked.id}`); }
    catch (e) { setError(msg(e)); setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Choose the client</CardTitle>
          <p className="text-sm text-muted-foreground">You can fill in the profile and self-assessment, upload documents and request an assessment for them.
            The client must still sign the officer attestation, decline a document request and give its right of reply itself.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Search by company name (English or Chinese)" value={search} onChange={(e) => setSearch(e.target.value)} />
          {rows === null && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
          {rows?.length === 0 && <p className="text-sm text-muted-foreground">No clients match.</p>}
          {rows && rows.length > 0 && (
            <ul className="max-h-80 divide-y overflow-y-auto rounded-md border">
              {rows.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setPicked(c)}
                    className={`flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 ${picked?.id === c.id ? "bg-primary/5" : ""}`}>
                    <span>
                      <span className="font-medium">{c.name}</span>{c.chinese_name && <span className="ml-2 text-muted-foreground">{c.chinese_name}</span>}
                      <span className="block text-xs text-muted-foreground">Signed up {fmt(c.created_at)} · {c.engagements} engagement{c.engagements === 1 ? "" : "s"}</span>
                    </span>
                    {c.assisting ? <Badge>Your session is open</Badge> : picked?.id === c.id ? <Badge variant="outline">Selected</Badge> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {picked && (
        <Card className="border-amber-300">
          <CardHeader className="pb-2"><CardTitle className="text-base">Assist {picked.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {picked.assisting ? (
              <Button asChild><Link href={`/customers/${picked.id}`}>Continue your open session <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
            ) : (
              <>
                <label className="block text-sm font-medium" htmlFor="reason">Reason (recorded, and shown to the client)</label>
                <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000}
                  placeholder="e.g. Client asked by phone for help uploading business licences and completing the profile" />
                <Button onClick={start} disabled={busy || reason.trim().length < 10}>{busy ? "Starting…" : "Start assisted session and open"}</Button>
                <p className="text-xs text-muted-foreground">Ends after 4 hours or when you end it from the banner. Opening another client ends this one.</p>
              </>
            )}
          </CardContent>
        </Card>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent assisted sessions</CardTitle></CardHeader>
        <CardContent>
          {sessions.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="py-1 font-medium">Started</th><th className="py-1 font-medium">Staff</th>
                <th className="py-1 font-medium">Reason</th><th className="py-1 font-medium">Changes</th><th className="py-1 font-medium">Status</th></tr></thead>
              <tbody className="divide-y">
                {sessions.map((s) => (
                  <tr key={s.id}><td className="py-2 pr-3 whitespace-nowrap">{fmt(s.started_at)}</td><td className="py-2 pr-3">{s.staff_email}</td>
                    <td className="py-2 pr-3">{s.reason}</td><td className="py-2 pr-3">{s.actions}</td>
                    <td className="py-2">{s.ended_at ? `Ended ${fmt(s.ended_at)}` : new Date(s.expires_at) < new Date() ? "Expired" : "Open"}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
