"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { draftFindingsApi, type DraftFindings } from "@/lib/document-requests";
import { useLanguage } from "@/lib/language-context";
import { ArrowLeft } from "lucide-react";

function Draft({ d, onDone }: { d: DraftFindings; onDone: () => void }) {
  const { t } = useLanguage();
  const { handleError, showSuccess } = useApiToast();
  const [text, setText] = useState(d.response ?? "");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await draftFindingsApi.respond(d.engagement_id, text); showSuccess(t("rrSubmitted")); onDone(); }
    catch (e) { handleError(e); } finally { setBusy(false); }
  };
  const f = d.findings;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("rrDue")} {new Date(d.due_at).toLocaleDateString()}</CardTitle>
        {d.received_at && <p className="text-sm text-green-700">{t("rrSubmitted")}: {new Date(d.received_at).toLocaleString()}</p>}
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <section className="space-y-2">
          <h3 className="font-semibold">{t("rrEntities")}</h3>
          <ul className="space-y-1">
            {f.entities.map((e, i) => (
              <li key={i}>
                <span className="font-medium">{e.name}</span>{e.name_zh ? ` (${e.name_zh})` : ""} · {e.role.replace("_", " ")}
                {e.held_by ? ` · ${t("rrHeldBy")} ${e.held_by}` : ""}{e.ownership_pct != null ? ` ${e.ownership_pct}%` : ""}
                {e.jurisdiction ? ` · ${e.jurisdiction}` : ""}{e.registry_id ? ` · ${e.registry_id}` : ""}{e.state_linked ? ` · ${t("rrStateLinked")}` : ""}
              </li>
            ))}
          </ul>
        </section>
        {f.findings.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-semibold">{t("rrFindings")}</h3>
            <dl className="space-y-2">{f.findings.map((x, i) => <div key={i}><dt className="font-medium">{x.topic}</dt><dd className="text-muted-foreground">{x.finding}</dd></div>)}</dl>
          </section>
        )}
        {f.sources.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-semibold">{t("rrSources")}</h3>
            <ul className="list-disc pl-5 text-muted-foreground">{f.sources.map((x, i) => <li key={i}>{x.description}{x.date ? ` (${x.date.slice(0, 10)})` : ""}</li>)}</ul>
          </section>
        )}
        {d.open ? (
          <div className="space-y-2">
            <Label>{t("rrResponse")}</Label>
            <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
            <Button disabled={busy || text.trim().length < 5} onClick={submit}>{t("rrSubmit")}</Button>
          </div>
        ) : <p className="text-muted-foreground">{t("rrClosed")}</p>}
      </CardContent>
    </Card>
  );
}

function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [rows, setRows] = useState<DraftFindings[] | null>(null);
  const load = useCallback(() => { draftFindingsApi.list(id).then(setRows).catch(() => setRows([])); }, [id]);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link href={`/customers/${id}`} className="inline-flex items-center text-sm text-primary hover:underline"><ArrowLeft className="mr-1 h-4 w-4" />{t("rrBack")}</Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("rrTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("rrIntro")}</p>
          </div>
          {rows?.length === 0 && <p className="text-muted-foreground">{t("rrNone")}</p>}
          {rows?.map((d) => <Draft key={d.engagement_id} d={d} onDone={load} />)}
        </div>
      </div>
    </div>
  );
}

export default function FindingsPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProtectedRoute><Content params={params} /></ProtectedRoute>;
}
