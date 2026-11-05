"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authenticatedRequest } from "@/lib/api-client";

interface Inquiry { id: string; organization: string; org_type: string; contact_name: string; contact_title: string | null; email: string; phone: string | null;
  company: string | null; decision: string; deadline: string | null; jurisdiction: string | null; notes: string | null; status: string; created_at: string }

/** Public bodies asking about a government-directed assessment. Hidden when there are none. */
export function AgencyInquiriesPanel() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const load = useCallback(() => { authenticatedRequest<Inquiry[]>("/api/v1/agency-inquiries").then(setRows).catch(() => {}); }, []);
  useEffect(load, [load]);
  if (!rows.length) return null;
  const set = async (id: string, status: string) => { await authenticatedRequest(`/api/v1/agency-inquiries/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); load(); };
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Inquiries from public bodies ({rows.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="space-y-1 rounded-md border p-3 text-sm">
            <p className="font-medium">{r.organization} <span className="font-normal text-muted-foreground">· {r.org_type.replace("_", " ")} · {r.decision}{r.status === "contacted" ? " · contacted" : ""}</span></p>
            <p className="text-muted-foreground">{r.contact_name}{r.contact_title ? `, ${r.contact_title}` : ""} · <a className="text-primary hover:underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone ? ` · ${r.phone}` : ""}</p>
            {(r.company || r.deadline || r.jurisdiction) && <p>{[r.company && `Company: ${r.company}`, r.deadline && `Due: ${r.deadline}`, r.jurisdiction].filter(Boolean).join(" · ")}</p>}
            {r.notes && <p className="whitespace-pre-wrap text-muted-foreground">{r.notes}</p>}
            <div className="flex gap-2 pt-1">
              {r.status === "new" && <Button size="sm" variant="outline" onClick={() => set(r.id, "contacted")}>Mark contacted</Button>}
              <Button size="sm" variant="ghost" onClick={() => set(r.id, "closed")}>Close</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
