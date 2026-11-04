"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { assessmentRequestsApi, type AssessmentRequest, type AssessmentRequestIn } from "@/lib/assessment-requests";
import { useLanguage } from "@/lib/language-context";
import { CheckCircle2, ShieldCheck } from "lucide-react";

/** Funnel from the free self-assessment to a paid comprehensive assessment. */
export function RequestAssessmentCard({ customerId, assessmentId }: { customerId: string; assessmentId?: string }) {
  const { t, language } = useLanguage();
  const { handleError, showSuccess } = useApiToast();
  const [latest, setLatest] = useState<AssessmentRequest | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ contact_name: "", contact_title: "", contact_phone: "", project_description: "",
    relying_party: "", timeline: "", engagement_type: "unsure" as AssessmentRequestIn["engagement_type"] });

  useEffect(() => {
    assessmentRequestsApi.mine(customerId).then((rows) => setLatest(rows[0] ?? null)).catch(() => setLatest(null));
  }, [customerId]);

  if (latest === undefined) return null;
  const inProgress = latest && latest.status !== "declined";
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    try {
      const r = await assessmentRequestsApi.create(customerId, { ...form, assessment_id: assessmentId, language });
      setLatest(r); setOpen(false); showSuccess(t("arSent"));
    } catch (e) { handleError(e); } finally { setBusy(false); }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <CardTitle>{t("arTitle")}</CardTitle>
            {!inProgress && <CardDescription className="mt-1">{t("arPitch")}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {inProgress ? (
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {t(`arStatus_${latest.status}`)}
            <span className="text-xs text-muted-foreground">· {t("arRequestedOn")} {new Date(latest.created_at).toLocaleDateString()}</span>
          </p>
        ) : !open ? (
          <>
            {latest?.status === "declined" && <p className="text-sm text-muted-foreground">{t("arStatus_declined")}</p>}
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {t("arPoints").split("|").map((p) => <li key={p} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{p}</li>)}
            </ul>
            <Button onClick={() => setOpen(true)}>{t("arStart")}</Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1"><Label>{t("arContactName")}</Label><Input value={form.contact_name} onChange={set("contact_name")} /></div>
              <div className="space-y-1"><Label>{t("arContactTitle")}</Label><Input value={form.contact_title} onChange={set("contact_title")} /></div>
              <div className="space-y-1"><Label>{t("arPhone")}</Label><Input value={form.contact_phone} onChange={set("contact_phone")} /></div>
            </div>
            <div className="space-y-1"><Label>{t("arProject")}</Label><Textarea value={form.project_description} onChange={set("project_description")} /></div>
            <div className="space-y-1"><Label>{t("arRelying")}</Label><Textarea value={form.relying_party} onChange={set("relying_party")} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label>{t("arTimeline")}</Label><Input value={form.timeline} onChange={set("timeline")} /></div>
              <div className="space-y-1">
                <Label>{t("arType")}</Label>
                <select className="h-9 w-full rounded-md border bg-transparent px-2 text-sm" value={form.engagement_type} onChange={set("engagement_type")}>
                  <option value="design">{t("arTypeDesign")}</option>
                  <option value="operating">{t("arTypeOperating")}</option>
                  <option value="unsure">{t("arTypeUnsure")}</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("arNoCommit")}</p>
            <div className="flex gap-2">
              <Button disabled={busy || form.contact_name.trim().length < 2 || form.project_description.trim().length < 10} onClick={submit}>
                {busy ? t("arSending") : t("arSubmit")}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t("arCancel")}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
