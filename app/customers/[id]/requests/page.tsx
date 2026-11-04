"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/language-context";
import { useApiToast } from "@/hooks/use-api-toast";
import { useCustomerDocuments } from "@/hooks/use-documents";
import { documentRequestsApi, needsResponse, type CompanyEngagement, type CompanyRequest } from "@/lib/document-requests";
import { REQUEST_STATUS_CLASS } from "@/lib/engagements";
import { ArrowLeft, Upload } from "lucide-react";

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

type Docs = ReturnType<typeof useCustomerDocuments>;
function RequestCard({ r, customerId, closed, statement, onDone, docs, refetchDocs }: {
  r: CompanyRequest; customerId: string; closed: boolean; statement: string; onDone: () => void;
  docs: Docs["data"]; refetchDocs: Docs["refetch"];
}) {
  const { t, language } = useLanguage();
  const { handleError, showSuccess } = useApiToast();
  const [mode, setMode] = useState<"" | "respond" | "decline">("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [signer, setSigner] = useState({ name: "", title: "", agree: false });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const docName = (id: string) => docs?.items.find((d) => d.id === id)?.original_filename ?? id.slice(0, 8);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const ok = Array.from(files).filter((f) => ALLOWED.includes(f.type) && f.size <= 50 * 1024 * 1024);
    setBusy(true);
    try {
      const res = await api.documents.upload(customerId, ok);
      setPicked(new Set([...picked, ...res.map((x) => x.document_id)]));
      refetchDocs();
    } catch (e) { handleError(e); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  const submit = async () => {
    if (!picked.size) { handleError(new Error(t("drNeedDocs"))); return; }
    setBusy(true);
    try {
      await documentRequestsApi.submit(r.id, { document_ids: [...picked], note: note || undefined,
        attestation: { signer_name: signer.name, signer_title: signer.title, agree: signer.agree } });
      showSuccess(t("drSubmitted")); setMode(""); onDone();
    } catch (e) { handleError(e); } finally { setBusy(false); }
  };
  const decline = async () => {
    setBusy(true);
    try { await documentRequestsApi.refuse(r.id, reason); showSuccess(t("drDeclined")); setMode(""); onDone(); }
    catch (e) { handleError(e); } finally { setBusy(false); }
  };
  const canAnswer = !closed && needsResponse(r);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{r.title}</p>
          {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
          {r.due_date && <p className="text-xs text-muted-foreground mt-1">{t("drDue")}: {new Date(r.due_date).toLocaleDateString()}</p>}
        </div>
        <Badge variant="outline" className={REQUEST_STATUS_CLASS[r.status]}>{t(`drStatus_${r.status}`)}</Badge>
      </div>
      {r.status === "returned" && r.reviewer_note && (
        <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900"><span className="font-medium">{t("drReviewerNote")}:</span> {r.reviewer_note}</p>
      )}
      {r.document_ids.length > 0 && !canAnswer && (
        <div className="text-sm">
          <p className="font-medium">{t("drYourDocs")}</p>
          <ul className="list-disc pl-5">{r.document_ids.map((d) => <li key={d}>{docName(d)}</li>)}</ul>
        </div>
      )}
      {r.company_note && !canAnswer && <p className="text-sm"><span className="font-medium">{t("drYourNote")}:</span> {r.company_note}</p>}
      {r.attestation && !canAnswer && (
        <p className="text-xs text-muted-foreground">{t("drAttestedBy")}: {r.attestation.signer_name}, {r.attestation.signer_title} · {new Date(r.attestation.attested_at).toLocaleString()}</p>
      )}

      {canAnswer && mode === "" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setMode("respond")}>{t("drRespond")}</Button>
          <Button size="sm" variant="outline" onClick={() => setMode("decline")}>{t("drDecline")}</Button>
        </div>
      )}

      {canAnswer && mode === "respond" && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />{t("drUploadNew")}
            </Button>
            <span className="ml-2 text-xs text-muted-foreground">PDF, JPEG, PNG, DOCX · 50MB</span>
          </div>
          {docs && docs.items.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("drOrPick")}</p>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                {docs.items.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={picked.has(d.id)} onChange={(e) => {
                      const n = new Set(picked); if (e.target.checked) n.add(d.id); else n.delete(d.id); setPicked(n);
                    }} />
                    {d.original_filename}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label>{t("drNote")}</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <p className="text-sm font-medium">{t("drAttestTitle")}</p>
            <p className="text-sm">{statement}</p>
            {language === "zh" && (
              <p className="text-sm text-muted-foreground">{t("drAttestZh")} <span className="text-xs">({t("drAttestEnglishGoverns")})</span></p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1"><Label>{t("drSignerName")}</Label><Input value={signer.name} onChange={(e) => setSigner({ ...signer, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>{t("drSignerTitle")}</Label><Input value={signer.title} onChange={(e) => setSigner({ ...signer, title: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={signer.agree} onChange={(e) => setSigner({ ...signer, agree: e.target.checked })} />
              {t("drAgree")}
            </label>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || !picked.size || !signer.agree || signer.name.trim().length < 2 || signer.title.trim().length < 2} onClick={submit}>
              {busy ? t("drSubmitting") : t("drSubmit")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("")}>{t("drCancel")}</Button>
          </div>
        </div>
      )}

      {canAnswer && mode === "decline" && (
        <div className="space-y-2 border-t pt-3">
          <Label>{t("drDeclineReason")}</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || reason.trim().length < 5} onClick={decline}>{t("drDeclineSubmit")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("")}>{t("drCancel")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [data, setData] = useState<{ engagements: CompanyEngagement[]; attestation_statement: string } | null>(null);
  const [error, setError] = useState("");
  const { data: docs, refetch: refetchDocs } = useCustomerDocuments(id, { page: 1, pageSize: 100 });
  const load = useCallback(() => {
    documentRequestsApi.list(id).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link href={`/customers/${id}`} className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />{t("drBack")}
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("drTitle")}</h1>
            <p className="mt-2 text-muted-foreground">{t("drSubtitle")}</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {data && data.engagements.length === 0 && <p className="text-muted-foreground">{t("drNone")}</p>}
          {data?.engagements.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle className="text-lg">{t("drAssessment")}{e.project_description ? ` — ${e.project_description}` : ""}</CardTitle>
                {e.closed && <p className="text-sm text-muted-foreground">{t("drClosed")}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                {[...e.requests].sort((a, b) => Number(needsResponse(b)) - Number(needsResponse(a))).map((r) => (
                  <RequestCard key={r.id} r={r} customerId={id} closed={e.closed} statement={data.attestation_statement} onDone={load}
                    docs={docs} refetchDocs={refetchDocs} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RequestsPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProtectedRoute><RequestsContent params={params} /></ProtectedRoute>;
}
