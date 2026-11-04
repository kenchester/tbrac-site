"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assessmentRequestsApi, type AssessmentRequest } from "@/lib/assessment-requests";
import { engagementsApi } from "@/lib/engagements";

/** Evaluator view of companies asking for an independent assessment. */
export function AssessmentRequestsPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<AssessmentRequest[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => { assessmentRequestsApi.list().then(setRows).catch((e) => setError(e instanceof Error ? e.message : "Error")); }, []);
  useEffect(load, [load]);

  const act = async (r: AssessmentRequest, f: () => Promise<unknown>) => {
    setBusy(r.id); setError("");
    try { await f(); load(); } catch (e) { setError(e instanceof Error ? e.message : "Error"); } finally { setBusy(""); }
  };
  const open = (r: AssessmentRequest) => act(r, async () => {
    const e = await engagementsApi.create({
      customer_id: r.customer_id, request_id: r.id, project_description: r.project_description,
      relying_parties: r.relying_party ? [r.relying_party] : [],
      engagement_type: r.engagement_type === "operating" ? "operating" : "design",
    });
    router.push(`/evaluator/engagements/${e.id}`);
  });

  if (rows && rows.length === 0 && !error) return null;
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Requests for an independent assessment {rows && `(${rows.length})`}</CardTitle>
        <p className="text-xs text-muted-foreground">From companies that completed the self-assessment. Opening an engagement links it to the request.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows?.map((r) => (
          <div key={r.id} className="rounded-md border p-3 space-y-2 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.customer_name}</p>
                <p className="text-muted-foreground">
                  {r.contact_name}{r.contact_title ? `, ${r.contact_title}` : ""} · <a className="text-primary hover:underline" href={`mailto:${r.requester_email}`}>{r.requester_email}</a>
                  {r.contact_phone ? ` · ${r.contact_phone}` : ""}{r.language === "zh" ? " · prefers Chinese" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={r.status === "new" ? "bg-blue-100 text-blue-800" : ""}>{r.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <p><span className="font-medium">Project:</span> {r.project_description}</p>
            {r.relying_party && <p><span className="font-medium">Relying party:</span> {r.relying_party}</p>}
            <p className="text-muted-foreground">Timeline: {r.timeline ?? "—"} · Type: {r.engagement_type}</p>
            {r.evaluator_note && <p className="text-xs text-muted-foreground">Note: {r.evaluator_note} — {r.handled_by}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={busy === r.id} onClick={() => open(r)}>Open engagement</Button>
              <Input className="h-8 max-w-xs" placeholder="Note (optional)" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
              {r.status === "new" && (
                <Button size="sm" variant="outline" disabled={busy === r.id}
                  onClick={() => act(r, () => assessmentRequestsApi.update(r.id, { status: "contacted", evaluator_note: notes[r.id] }))}>Mark contacted</Button>
              )}
              <Button size="sm" variant="ghost" disabled={busy === r.id}
                onClick={() => act(r, () => assessmentRequestsApi.update(r.id, { status: "declined", evaluator_note: notes[r.id] }))}>Decline</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
