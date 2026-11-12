"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiToast } from "@/hooks/use-api-toast";
import { assessmentRequestsApi, type AssessmentRequest, type AssessmentRequestIn } from "@/lib/assessment-requests";
import { earlyAccessApi } from "@/lib/certifications";
import { EarlyAccessBox } from "@/components/early-access-box";
import { useLanguage } from "@/lib/language-context";
import { CheckCircle2, ShieldCheck } from "lucide-react";

/** Funnel from the free self-assessment to a paid comprehensive assessment. */
const RE = {
  en: { title: "Request a re-evaluation", pitch: "TBRAC rates you again on the new evidence. The flat re-evaluation fee applies; the new report replaces the current one when issued.",
        project: "What has changed since the last assessment (ownership, controls, suppliers, documents)?" },
  zh: { title: "申请重新评估", pitch: "TBRAC 将依据新证据重新评级。适用固定的重新评估费用；新报告出具后将取代当前报告。",
        project: "自上次评估以来有哪些变化（所有权、内部控制、供应商、文件）？" },
};

const SOON = {
  en: { badge: "Coming soon",
        text: "Comprehensive assessments open to all companies soon. Meanwhile, the free self-assessment shows where you stand.",
        hint: "Taking part in early testing? Enter the code TBRAC gave you to request a comprehensive assessment now. The fee is waived.",
        granted: "Early access confirmed: the fee for this assessment is waived." },
  zh: { badge: "即将推出",
        text: "全面评估即将向所有企业开放。在此之前，您可以通过免费自我评估了解自身情况。",
        hint: "如您参与抢先测试，请输入 TBRAC 提供的体验码，即可立即申请全面评估，费用全免。",
        granted: "已确认抢先体验资格：本次评估费用全免。" },
};

export function RequestAssessmentCard({ customerId, assessmentId, reevaluationOf, startOpen = false, comingSoon = false }:
  { customerId: string; assessmentId?: string; reevaluationOf?: string; startOpen?: boolean; comingSoon?: boolean }) {
  const { t, language } = useLanguage();
  const { handleError, showSuccess } = useApiToast();
  const [latest, setLatest] = useState<AssessmentRequest | null | undefined>(undefined);
  const [open, setOpen] = useState(startOpen);
  const re = reevaluationOf ? RE[language as "en" | "zh"] ?? RE.en : null;
  const soon = SOON[language as "en" | "zh"] ?? SOON.en;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ contact_name: "", contact_title: "", contact_phone: "", project_description: "",
    relying_party: "", timeline: "", engagement_type: "unsure" as AssessmentRequestIn["engagement_type"] });

  useEffect(() => {
    assessmentRequestsApi.mine(customerId).then((rows) => setLatest(
      (reevaluationOf ? rows.filter((r) => r.request_type === "reevaluation" && r.prior_report_number === reevaluationOf) : rows)[0] ?? null,
    )).catch(() => setLatest(null));
  }, [customerId, reevaluationOf]);

  if (latest === undefined) return null;
  const inProgress = latest && latest.status !== "declined";
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    try {
      const r = await assessmentRequestsApi.create(customerId, { ...form, assessment_id: assessmentId, language,
        ...(code ? { access_code: code } : {}),
        ...(reevaluationOf ? { request_type: "reevaluation" as const, prior_report_number: reevaluationOf } : {}) });
      setLatest(r); setOpen(false); showSuccess(t("arSent"));
    } catch (e) { handleError(e); } finally { setBusy(false); }
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <CardTitle>{re ? re.title : t("arTitle")}</CardTitle>
            {!inProgress && <CardDescription className="mt-1">{re ? re.pitch : t("arPitch")}</CardDescription>}
            {!inProgress && comingSoon && !code && (
              <span className="mt-3 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">{soon.badge}</span>
            )}
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
        ) : comingSoon && !code ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{soon.text}</p>
            <EarlyAccessBox hint={soon.hint} check={(c) => earlyAccessApi.check(customerId, c)} onAccepted={(c) => { setCode(c); setOpen(true); }} />
          </div>
        ) : !open ? (
          <>
            {latest?.status === "declined" && <p className="text-sm text-muted-foreground">{t("arStatus_declined")}</p>}
            <ul className="grid gap-1 text-sm sm:grid-cols-2">
              {t("arPoints").split("|").map((p) => <li key={p} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{p}</li>)}
            </ul>
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={() => setOpen(true)}>{t("arStart")}</Button>
              <a href="/for-companies#fees" target="_blank" className="text-sm font-semibold text-sky-800 hover:underline">{language === "zh" ? "查看费用" : "See the fees"}</a>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1"><Label>{t("arContactName")}</Label><Input value={form.contact_name} onChange={set("contact_name")} /></div>
              <div className="space-y-1"><Label>{t("arContactTitle")}</Label><Input value={form.contact_title} onChange={set("contact_title")} /></div>
              <div className="space-y-1"><Label>{t("arPhone")}</Label><Input value={form.contact_phone} onChange={set("contact_phone")} /></div>
            </div>
            <div className="space-y-1"><Label>{re ? re.project : t("arProject")}</Label><Textarea value={form.project_description} onChange={set("project_description")} /></div>
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
            {code && <p className="flex items-center gap-2 text-sm font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4" />{soon.granted}</p>}
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
