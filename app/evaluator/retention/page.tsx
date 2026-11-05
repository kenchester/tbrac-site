"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authenticatedRequest } from "@/lib/api-client";

interface Overview {
  policy: { account_grace_days: number; engagement_retention_years: number };
  accounts: { customer_id: string; name: string; deleted_at: string; documents: number; sandbox: boolean }[];
  files: { customer_id: string; name: string; last_closed: string; documents: number }[];
}
const day = (d: string) => new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" });

export default function RetentionPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => {
    authenticatedRequest<Overview>("/api/v1/retention").then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
  }, []);
  useEffect(load, [load]);

  const purge = async (kind: "account" | "files", id: string, name: string) => {
    setBusy(id); setMsg(""); setError("");
    try {
      const r = await fetch("/api/evaluator/retention/purge", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, customer_id: id }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Deletion failed");
      setMsg(`${name}: ${j.files_deleted} file(s) and ${j.documents_deleted} document record(s) deleted${j.sign_in_account_deleted ? "; sign-in account deleted" : ""}.`);
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Deletion failed"); } finally { setBusy(""); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header minimal />
      <main className="container mx-auto max-w-4xl space-y-6 px-4 py-10">
        <Link href="/evaluator/engagements" className="text-sm text-primary hover:underline">← Comprehensive assessments</Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data retention</h1>
          <p className="text-muted-foreground">Companies whose data is due for deletion under the privacy policy. Deleting removes stored files from
            Blob and the records from the database. It cannot be undone; the audit log keeps a note of who deleted what, without the content.</p>
        </div>
        {data && (
          <Card>
            <CardContent className="grid gap-4 py-4 text-sm sm:grid-cols-2">
              <p><b>Deleted accounts</b>: purged {data.policy.account_grace_days} days after the company deletes its account, unless it has a comprehensive assessment.</p>
              <p><b>Comprehensive-assessment files</b>: documents and extracted text kept {data.policy.engagement_retention_years} years after the company&apos;s last
                engagement closed. Engagement records, evidence notes, the audit trail and the register entry are kept.</p>
            </CardContent>
          </Card>
        )}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!data && !error && <p className="text-muted-foreground">Loading…</p>}
        {data && (
          <>
            <Section title="Deleted accounts due for purge" empty="None due.">
              {data.accounts.map((a) => (
                <Row key={a.customer_id} name={a.name} detail={`Deleted ${day(a.deleted_at)} · ${a.documents} document(s)`} badge={a.sandbox ? "Dummy data" : undefined}
                  busy={busy === a.customer_id} onPurge={() => purge("account", a.customer_id, a.name)} />
              ))}
            </Section>
            <Section title="Assessment files past retention" empty="None due.">
              {data.files.map((f) => (
                <Row key={f.customer_id} name={f.name} detail={`Last engagement closed ${day(f.last_closed)} · ${f.documents} document(s)`}
                  busy={busy === f.customer_id} onPurge={() => purge("files", f.customer_id, f.name)} />
              ))}
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>{children.length ? <ul className="divide-y">{children}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>}</CardContent>
    </Card>
  );
}

function Row({ name, detail, badge, busy, onPurge }: { name: string; detail: string; badge?: string; busy: boolean; onPurge: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div><p className="font-medium">{name} {badge && <Badge variant="outline" className="ml-1">{badge}</Badge>}</p><p className="text-xs text-muted-foreground">{detail}</p></div>
      {confirm ? (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700" disabled={busy} onClick={onPurge}>{busy ? "Deleting…" : "Delete permanently"}</Button>
        </div>
      ) : <Button size="sm" variant="outline" onClick={() => setConfirm(true)}>Delete…</Button>}
    </li>
  );
}
