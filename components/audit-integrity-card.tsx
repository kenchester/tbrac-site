"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authenticatedRequest } from "@/lib/api-client";

interface Integrity {
  intact: boolean; entries: number; first_broken_seq: number | null; head_seq: number | null; head_hash: string | null;
  checkpoints: number; checkpoint_problems: { checkpoint: string; seq: number; problem: string }[]; checked_at: string;
}

/** Recomputes the audit trail's hash chain on demand (evaluator portal). */
export function AuditIntegrityCard() {
  const [r, setR] = useState<Integrity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const check = async () => {
    setBusy(true); setError("");
    try { setR(await authenticatedRequest<Integrity>("/api/v1/audit/integrity", { method: "POST" })); }
    catch (e) { setError(e instanceof Error ? e.message : "Check failed"); } finally { setBusy(false); }
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Audit trail integrity</CardTitle>
          <Button size="sm" variant="outline" disabled={busy} onClick={check}>{busy ? "Checking…" : "Check now"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">Every audit entry is chained to the one before it (SHA-256) and the database refuses edits and deletions.
          The check recomputes the whole chain and confirms the signed checkpoints recorded daily.</p>
      </CardHeader>
      <CardContent className="text-sm">
        {error && <p className="text-red-600">{error}</p>}
        {r && (r.intact ? (
          <p className="flex items-start gap-2 text-emerald-700"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Intact: {r.entries.toLocaleString()} entries, {r.checkpoints} checkpoint(s) confirmed. Head #{r.head_seq}
              <span className="ml-1 font-mono text-xs text-muted-foreground">{r.head_hash?.slice(0, 16)}…</span></span></p>
        ) : (
          <div className="flex items-start gap-2 text-red-700"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div><p className="font-semibold">The audit trail has been altered.</p>
              {r.first_broken_seq != null && <p>First broken entry: #{r.first_broken_seq}.</p>}
              {r.checkpoint_problems.map((p) => <p key={p.checkpoint}>Checkpoint {new Date(p.checkpoint).toLocaleString()} (entry #{p.seq}): {p.problem}.</p>)}
              <p>Stop and investigate before issuing or relying on any rating.</p></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
