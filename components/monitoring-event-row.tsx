"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { engagementsApi, SEVERITY_CLASS, type MonitoringEvent } from "@/lib/engagements";

export function EventRow({ e, onAck, showCompany }: { e: MonitoringEvent; onAck: () => void; showCompany?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-2 text-sm">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={SEVERITY_CLASS[e.severity]}>{e.severity}</Badge>
          {showCompany && <Link className="font-medium text-primary hover:underline" href={`/evaluator/engagements/${e.engagement_id}`}>{e.customer_name}</Link>}
          <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
        </div>
        <p>{e.message}</p>
        {e.acknowledged_by && <p className="text-xs text-muted-foreground">Acknowledged by {e.acknowledged_by}</p>}
      </div>
      {!e.acknowledged_at && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await engagementsApi.acknowledge(e.id); onAck(); } finally { setBusy(false); }
        }}>Acknowledge</Button>
      )}
    </div>
  );
}
