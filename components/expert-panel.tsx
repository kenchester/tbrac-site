"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authenticatedRequest } from "@/lib/api-client";

interface PanelistRow { id: string; name: string; email: string; role: string; invited_at: string; saved_at: string | null; submitted_at: string | null; cr: number | null; comments: string | null; conflicts: string | null }
interface Round { id: string; target_version: string; round: number; title: string; feedback: string | null; status: string; closes_at: string | null;
  record_hash: string | null; signed: boolean; panelists: PanelistRow[] }
const msgOf = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** Facilitator view of the expert panel (Methodology §10): rounds, invitations, progress, close, draft version. */
export function ExpertPanel({ onDrafted }: { onDrafted: () => void }) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [nr, setNr] = useState({ target_version: "1.0", round: 1, title: "Domain weights, round 1", feedback: "", closes_at: "" });
  const [error, setError] = useState("");
  const load = useCallback(() => { authenticatedRequest<Round[]>("/api/v1/panel/rounds").then(setRounds).catch((e) => setError(msgOf(e))); }, []);
  useEffect(load, [load]);
  const create = async () => {
    setError("");
    try {
      await authenticatedRequest("/api/v1/panel/rounds", { method: "POST", body: JSON.stringify({ ...nr, feedback: nr.feedback || null,
        closes_at: nr.closes_at ? new Date(nr.closes_at).toISOString() : null }) });
      load();
    } catch (e) { setError(msgOf(e)); }
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Expert panel</CardTitle>
        <p className="text-xs text-muted-foreground">Invite 8–15 panelists to a round. Each gets a private link to make the 21 comparisons online, sees their consistency ratio live,
          and confirms independence. Closing a round records a signed SHA-256 of all submissions; the round then becomes a draft version here.</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {error && <p className="text-red-600">{error}</p>}
        {rounds.map((r) => <RoundBox key={r.id} r={r} reload={load} onDrafted={onDrafted} />)}
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <p className="font-medium">New round</p>
          <div className="grid gap-2 sm:grid-cols-[100px_80px_1fr_170px]">
            <Input placeholder="Version" value={nr.target_version} onChange={(e) => setNr({ ...nr, target_version: e.target.value })} />
            <Input type="number" min={1} max={5} value={nr.round} onChange={(e) => setNr({ ...nr, round: Number(e.target.value) || 1 })} />
            <Input value={nr.title} onChange={(e) => setNr({ ...nr, title: e.target.value })} />
            <Input type="date" value={nr.closes_at} onChange={(e) => setNr({ ...nr, closes_at: e.target.value })} />
          </div>
          <Textarea rows={2} placeholder="Feedback shown to panelists (for round 2+: the previous round's combined weights and anonymised comments)" value={nr.feedback}
            onChange={(e) => setNr({ ...nr, feedback: e.target.value })} />
          <Button size="sm" onClick={create} disabled={nr.title.trim().length < 3}>Open round</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RoundBox({ r, reload, onDrafted }: { r: Round; reload: () => void; onDrafted: () => void }) {
  const [p, setP] = useState({ name: "", email: "", role: "" });
  const [draft, setDraft] = useState({ version: r.target_version, changelog: "", sensitivity: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const run = async (f: () => Promise<string | void>) => {
    setBusy(true); setError(""); setMsg("");
    try { const m = await f(); if (m) setMsg(m); reload(); } catch (e) { setError(msgOf(e)); } finally { setBusy(false); }
  };
  const invite = (body: object) => run(async () => {
    const res = await fetch("/api/evaluator/panel/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ round_id: r.id, ...body }) });
    const j = await res.json();
    if (!res.ok) throw new Error(j.detail || j.error || "Could not invite");
    setP({ name: "", email: "", role: p.role });
    return j.emailed ? `Invitation emailed to ${j.email}.` : `Created; email failed. Send this link yourself: ${j.link}`;
  });
  const submitted = r.panelists.filter((x) => x.submitted_at).length;
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{r.title} <span className="font-normal text-muted-foreground">· v{r.target_version} round {r.round}</span></p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{r.status}</Badge>
          <span className="text-muted-foreground">{submitted}/{r.panelists.length} submitted</span>
          {r.status === "open" && <Button size="sm" variant="outline" disabled={busy || submitted === 0} onClick={() => run(async () => {
            await authenticatedRequest(`/api/v1/panel/rounds/${r.id}/close`, { method: "POST" }); return "Round closed and recorded.";
          })}>Close round</Button>}
        </div>
      </div>
      {r.panelists.length > 0 && (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1 font-medium">Panelist</th><th className="py-1 font-medium">Role</th>
            <th className="py-1 font-medium">Status</th><th className="py-1 font-medium">CR</th><th /></tr></thead>
          <tbody className="divide-y">{r.panelists.map((x) => (
            <tr key={x.id} className="align-top">
              <td className="py-1.5 pr-2">{x.name}<span className="block text-xs text-muted-foreground">{x.email}</span>
                {x.conflicts && <span className="block text-xs text-amber-700">Disclosed: {x.conflicts}</span>}</td>
              <td className="py-1.5 pr-2">{x.role}</td>
              <td className="py-1.5 pr-2">{x.submitted_at ? <span className="text-green-700">Submitted</span> : x.saved_at ? "Saved, not submitted" : "Invited"}</td>
              <td className="py-1.5 pr-2 tabular-nums">{x.cr != null ? x.cr.toFixed(3) : "—"}</td>
              <td className="py-1.5 text-right">{r.status === "open" && <Button size="sm" variant="ghost" disabled={busy} onClick={() => invite({ panelist_id: x.id })}>Resend link</Button>}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
      {r.status === "open" && (
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input placeholder="Name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          <Input type="email" placeholder="Email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
          <Input placeholder="Role (e.g. Former CFIUS official)" value={p.role} onChange={(e) => setP({ ...p, role: e.target.value })} />
          <Button size="sm" className="h-9" disabled={busy || p.name.length < 2 || !p.email.includes("@") || p.role.length < 2} onClick={() => invite(p)}>Invite</Button>
        </div>
      )}
      {r.status === "closed" && (
        <div className="space-y-2">
          <p className="break-all text-xs text-muted-foreground">Record SHA-256 {r.record_hash}{r.signed ? " · signed by TBRAC" : ""}</p>
          <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
            <Input value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
            <Input placeholder="Changelog (what changed and why)" value={draft.changelog} onChange={(e) => setDraft({ ...draft, changelog: e.target.value })} />
          </div>
          <Textarea rows={2} placeholder="Sensitivity analysis (§10.4), required before publishing" value={draft.sensitivity} onChange={(e) => setDraft({ ...draft, sensitivity: e.target.value })} />
          <Button size="sm" disabled={busy || draft.changelog.trim().length < 10} onClick={() => run(async () => {
            await authenticatedRequest(`/api/v1/panel/rounds/${r.id}/draft`, { method: "POST", body: JSON.stringify({ ...draft, sensitivity: draft.sensitivity || null }) });
            onDrafted(); return `Draft version ${draft.version} created from this round.`;
          })}>Create draft version from this round</Button>
        </div>
      )}
      {msg && <p className="text-green-700">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
