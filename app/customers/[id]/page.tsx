"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { serif } from "@/lib/fonts"
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { AssistedSessionsCard } from "@/components/assisted-sessions-card";
import { Copyright } from "@/components/copyright";
import { PaymentsCard } from "@/components/payments-card";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { AssessmentProgress } from "@/components/assessment-progress";
import { EngagementLetterCard } from "@/components/engagement-letter-card";
import { CertificationsCard } from "@/components/certifications-card";
import { earlyAccessApi } from "@/lib/certifications";
import {
  useCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-customers";
import { useCustomerDocuments } from "@/hooks/use-documents";
import { useCustomerAssessments } from "@/hooks/use-assessments";
import { useApiToast } from "@/hooks/use-api-toast";
import {
  IndustrySector,
  OwnershipType,
  type CustomerUpdate,
} from "@/lib/api-types";
import {
  formatIndustrySector,
  formatOwnershipType,
  formatDocumentType,
  formatProcessingStatus,
  formatFileSize,
  formatDate,
} from "@/lib/format-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Building2,
  Globe,
  MapPin,
  Save,
  ClipboardList,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { documentRequestsApi, draftFindingsApi, needsResponse } from "@/lib/document-requests";
import { RequestAssessmentCard } from "@/components/request-assessment-card";


const D = {
  en: {
    account: "Company account", editProfile: "Edit profile", edit: "Edit", actionTitle: "Action needed",
    pathTitle: "Your path to TBRAC certification",
    step1: "Step 1 · Free", step1Name: "Self-assessment",
    step1Not: "Ten short modules across the seven risk domains. Private to your company, with AI guidance in English and Chinese as you answer.",
    step1Prog: (n: number) => `In progress: ${n} of 10 modules completed. Your answers are saved as you go.`,
    step1Done: "Submitted. Your indicative score and the red flags to fix first are ready.",
    start: "Start the self-assessment", cont: "Continue", view: "View results",
    step2: "Step 2 · Flat fee", step2Name: "Comprehensive assessment",
    step2Locked: "Available once you submit the self-assessment. It leads to an independent private certification of your rating that US counties, state agencies and partners can verify.",
    learn: "How the comprehensive assessment works",
    profileTitle: "Company profile", complete: "Complete profile", notProvided: "Not provided",
    missing: (n: number) => `${n} detail${n === 1 ? "" : "s"} missing. A complete profile helps evaluators scope your assessment.`,
    selfTitle: "Self-assessments", newOne: "New",
    status: { in_progress: "In progress", completed: "Completed", submitted: "Submitted" },
    deleteAccount: "Delete this company account",
    deleteText: (n: string) => `This permanently deletes ${n} and all of its data. This cannot be undone.`,
  },
  zh: {
    account: "企业账户", editProfile: "编辑资料", edit: "编辑", actionTitle: "待办事项",
    pathTitle: "获得 TBRAC 认证的路径",
    step1: "第一步 · 免费", step1Name: "自我评估",
    step1Not: "共 10 个简短模块，涵盖七个风险领域。仅贵公司可见，作答时提供中英文 AI 指导。",
    step1Prog: (n: number) => `进行中：已完成 10 个模块中的 ${n} 个。您的回答会自动保存。`,
    step1Done: "已提交。您的参考评分和需要优先处理的风险信号已经生成。",
    start: "开始自我评估", cont: "继续", view: "查看结果",
    step2: "第二步 · 固定费用", step2Name: "全面评估",
    step2Locked: "提交自我评估后即可申请。全面评估将形成对贵公司评级的独立私营机构认证，供美国县政府、州机构和合作伙伴核验。",
    learn: "了解全面评估的流程",
    profileTitle: "企业资料", complete: "完善资料", notProvided: "未填写",
    missing: (n: number) => `尚有 ${n} 项资料未填写。完整的资料有助于评估人员确定评估范围。`,
    selfTitle: "自我评估记录", newOne: "新建",
    status: { in_progress: "进行中", completed: "已完成", submitted: "已提交" },
    deleteAccount: "删除此企业账户",
    deleteText: (n: string) => `这将永久删除 ${n} 及其全部数据，且无法撤销。`,
  },
};

function ActionRow({ title, text, cta, onClick }: { tone: "amber"; title: string; text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4">
      <div><p className="font-semibold text-amber-950">{title}</p><p className="text-sm text-amber-900">{text}</p></div>
      <Button size="sm" onClick={onClick}>{cta}</Button>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function CustomerDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: customer, loading, error, refetch } = useCustomer(
    resolvedParams.id,
  );
  const { data: documents } = useCustomerDocuments(resolvedParams.id, {
    page: 1,
    pageSize: 5,
  });
  const { data: assessments } = useCustomerAssessments(resolvedParams.id, {
    page: 1,
    pageSize: 5,
  });
  const { update, loading: updating } = useUpdateCustomer();
  const { deleteCustomer, loading: deleting } = useDeleteCustomer();
  const { handleError, showSuccess } = useApiToast();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState<{ total: number; open: number } | null>(null);
  useEffect(() => {
    documentRequestsApi.list(resolvedParams.id).then((d) => {
      const all = d.engagements.filter((e) => !e.closed).flatMap((e) => e.requests);
      setRequests({ total: all.length, open: all.filter(needsResponse).length });
    }).catch(() => setRequests(null));
  }, [resolvedParams.id]);
  // Until launch, step 2 shows "coming soon" with an early-access code box, without waiting for the self-assessment.
  const [comingSoon, setComingSoon] = useState(false);
  useEffect(() => { earlyAccessApi.status().then((s) => setComingSoon(!s.open)); }, []);
  const [drafts, setDrafts] = useState(0);
  useEffect(() => {
    draftFindingsApi.list(resolvedParams.id).then((d) => setDrafts(d.filter((x) => x.open && !x.received_at).length)).catch(() => {});
  }, [resolvedParams.id]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerUpdate>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (customer && editDialogOpen) {
      setFormData({
        name: customer.name,
        chinese_name: customer.chinese_name,
        industry_sector: customer.industry_sector,
        ownership_type: customer.ownership_type,
        state_ownership_percentage: customer.state_ownership_percentage,
        headquarters_country: customer.headquarters_country,
        headquarters_city: customer.headquarters_city,
        us_presence: customer.us_presence,
        us_subsidiary_name: customer.us_subsidiary_name,
        website: customer.website,
        notes: customer.notes,
      });
      setValidationErrors({});
    }
  }, [customer, editDialogOpen]);

  const validateEdit = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      errors.name = "Company name is required";
    }

    if (
      formData.headquarters_country !== undefined &&
      !formData.headquarters_country.trim()
    ) {
      errors.headquarters_country = "Headquarters country is required";
    }

    if (
      formData.state_ownership_percentage !== undefined &&
      formData.state_ownership_percentage !== null
    ) {
      const percentage = Number(formData.state_ownership_percentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors.state_ownership_percentage = "Must be between 0 and 100";
      }
    }


    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateEdit()) return;

    try {
      const cleanedData: CustomerUpdate = { ...formData };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key as keyof CustomerUpdate] === "") {
          delete cleanedData[key as keyof CustomerUpdate];
        }
      });

      await update(resolvedParams.id, cleanedData);
      showSuccess(t("customerUpdatedSuccess"));
      setEditDialogOpen(false);
      refetch();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(resolvedParams.id);
      showSuccess(t("customerDeletedSuccess"));
      router.push("/customers");
    } catch (err) {
      handleError(err);
    }
  };

  const updateField = (field: keyof CustomerUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const showStateOwnership =
    formData.ownership_type === OwnershipType.STATE_OWNED ||
    formData.ownership_type === OwnershipType.MIXED;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-8 w-[200px]" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[300px]" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-red-600">
                {t("customerNotFound")}
              </h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/customers")}
              >
                {t("customerBackToList")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const d = D[language] ?? D.en;
  const latest = assessments?.items[0];
  const submitted = assessments?.items.find((a) => a.status === "submitted" || a.status === "completed");
  const base = `/customers/${resolvedParams.id}`;
  const profile: [string, string | null | undefined][] = [
    [t("customerIndustry"), customer.industry_sector ? formatIndustrySector(customer.industry_sector) : null],
    [t("customerOwnership"), customer.ownership_type ? formatOwnershipType(customer.ownership_type) : null],
    [t("customerStateOwnership"), customer.ownership_type ? `${customer.state_ownership_percentage ?? 0}%` : null],
    [t("customerHQ"), customer.headquarters_country ? [customer.headquarters_country, customer.headquarters_city].filter(Boolean).join(", ") : null],
    [t("customerUSPresence"), customer.us_presence],
    [t("customerUSSubsidiary"), customer.us_subsidiary_name],
    [t("customerWebsite"), customer.website],
  ];
  const missing = profile.filter(([, v]) => !v).length;
  const statusLabel = (s: string) => d.status[s as keyof typeof d.status] ?? s;

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader />

      {/* Company heading */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-8">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{d.account}</p>
            <h1 className={`${serif.className} mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl`}>{customer.name}</h1>
            {customer.chinese_name && <p className="mt-1 text-lg text-slate-600">{customer.chinese_name}</p>}
          </div>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />{d.editProfile}
          </Button>
        </div>
      </section>

      <main id="main" className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        {/* Action needed */}
        {(drafts > 0 || (requests && requests.open > 0)) && (
          <section aria-label={d.actionTitle} className="space-y-3">
            {drafts > 0 && (
              <ActionRow tone="amber" title={t("rrDashCard")} text={t("rrDashDesc")} cta={t("rrView")} onClick={() => router.push(`${base}/findings`)} />
            )}
            {requests && requests.open > 0 && (
              <ActionRow tone="amber" title={t("drDashCard")} text={`${requests.open} ${t("drDashOpen")}`} cta={t("drView")} onClick={() => router.push(`${base}/requests`)} />
            )}
          </section>
        )}

        <VerifyEmailBanner />
        <AssessmentProgress customerId={resolvedParams.id} />
        <EngagementLetterCard customerId={resolvedParams.id} />
        <PaymentsCard customerId={resolvedParams.id} />
        <CertificationsCard customerId={resolvedParams.id} />

        {/* Path */}
        <section id="self-assessment" className="scroll-mt-24">
          <h2 className={`${serif.className} text-2xl font-semibold tracking-tight text-slate-900`}>{d.pathTitle}</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-xs font-medium text-slate-500">{d.step1}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{d.step1Name}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">
                {!latest ? d.step1Not : submitted ? d.step1Done : d.step1Prog(latest.modules_completed)}
              </p>
              {latest && !submitted && (
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={10} aria-valuenow={latest.modules_completed}>
                  <div className="h-full rounded-full bg-[#0b1f3a]" style={{ width: `${Math.min(100, latest.modules_completed * 10)}%` }} />
                </div>
              )}
              <div className="mt-5">
                {!latest ? (
                  <Button onClick={() => router.push(`${base}/assessments/new`)}>{d.start} <ArrowRight className="ml-2 h-4 w-4" /></Button>
                ) : (
                  <Button onClick={() => router.push(`${base}/assessments/${(submitted ?? latest).id}`)}>
                    {submitted ? d.view : d.cont} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {submitted || comingSoon ? (
              <RequestAssessmentCard customerId={resolvedParams.id} assessmentId={submitted?.id} comingSoon={comingSoon} />
            ) : (
              <div className="flex flex-col rounded-lg border border-dashed border-slate-300 bg-white/60 p-6">
                <p className="text-xs font-medium text-slate-500">{d.step2}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{d.step2Name}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate-600">{d.step2Locked}</p>
                <Link href="/for-companies" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline">
                  {d.learn} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Profile */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">{d.profileTitle}</h2>
              <button type="button" onClick={() => setEditDialogOpen(true)} className="text-sm font-semibold text-sky-800 hover:underline">
                {missing ? d.complete : d.edit}
              </button>
            </div>
            {missing > 0 && (
              <p className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600">{d.missing(missing)}</p>
            )}
            <dl className="divide-y divide-slate-100">
              {profile.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-6 py-3 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className={v ? "text-slate-900" : "italic text-slate-400"}>
                    {v && k === t("customerWebsite")
                      ? <a href={v.match(/^https?:\/\//) ? v : `https://${v}`} target="_blank" rel="noopener noreferrer" className="text-sky-800 hover:underline">{v}</a>
                      : v || d.notProvided}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="space-y-8">
            {/* Self-assessments */}
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-900">{d.selfTitle}</h2>
                {latest && (
                  <button type="button" onClick={() => router.push(`${base}/assessments/new`)} className="inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline">
                    <Plus className="h-3.5 w-3.5" />{d.newOne}
                  </button>
                )}
              </div>
              {assessments && assessments.items.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {assessments.items.map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => router.push(`${base}/assessments/${a.id}`)}
                        className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left text-sm hover:bg-slate-50">
                        <span>
                          <span className="font-medium text-slate-900">{formatDate(a.created_at)}</span>
                          <span className="ml-2 text-slate-500">{a.modules_completed}/10 {t("customerAssessmentModulesOf")}</span>
                        </span>
                        <Badge variant="outline" className={a.status === "in_progress" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}>
                          {statusLabel(a.status)}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-6 py-6 text-sm text-slate-500">{t("customerNoAssessments")}</p>
              )}
            </section>

            {/* Documents */}
            <section className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-900">{t("customerRecentDocs")}</h2>
                <Link href={`${base}/documents`} className="text-sm font-semibold text-sky-800 hover:underline">
                  {documents && documents.items.length > 0 ? t("customerViewAllDocs") : t("customerUploadDocs")}
                </Link>
              </div>
              {documents && documents.items.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {documents.items.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate font-medium text-slate-900">{doc.original_filename}</span>
                      </span>
                      <span className="shrink-0 text-slate-500">{formatDate(doc.uploaded_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-6 py-6 text-sm text-slate-500">{t("customerNoDocsYet")}</p>
              )}
            </section>
          </div>
        </div>

        <AssistedSessionsCard customerId={resolvedParams.id} />

        {/* Account */}
        <div className="flex justify-end border-t border-slate-200 pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-700">
                <Trash2 className="h-3.5 w-3.5" />{d.deleteAccount}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("customerDeleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{d.deleteText(customer.name)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("customerDeleteCancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                  {deleting ? t("customerDeleting") : t("customerDelete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
      <Copyright />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("customerEditTitle")}</DialogTitle>
            <DialogDescription>
              {t("customerEditDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("customerCompanyName")}</Label>
                <Input
                  id="edit-name"
                  value={formData.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-industry_sector">{t("customerIndustry")}</Label>
                <Select
                  value={formData.industry_sector}
                  onValueChange={(val) =>
                    updateField("industry_sector", val as IndustrySector)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(IndustrySector).map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {formatIndustrySector(sector)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ownership_type">{t("customerOwnership")}</Label>
                <Select
                  value={formData.ownership_type}
                  onValueChange={(val) =>
                    updateField("ownership_type", val as OwnershipType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OwnershipType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatOwnershipType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showStateOwnership && (
              <div className="space-y-2">
                <Label htmlFor="edit-state_ownership_percentage">
                  {t("customerStateOwnershipPct")}
                </Label>
                <Input
                  id="edit-state_ownership_percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.state_ownership_percentage ?? ""}
                  onChange={(e) =>
                    updateField(
                      "state_ownership_percentage",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
                {validationErrors.state_ownership_percentage && (
                  <p className="text-sm text-red-600">
                    {validationErrors.state_ownership_percentage}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-headquarters_country">
                  {t("customerHQCountry")}
                </Label>
                <Input
                  id="edit-headquarters_country"
                  value={formData.headquarters_country || ""}
                  onChange={(e) =>
                    updateField("headquarters_country", e.target.value)
                  }
                />
                {validationErrors.headquarters_country && (
                  <p className="text-sm text-red-600">
                    {validationErrors.headquarters_country}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-headquarters_city">
                  {t("customerHQCity")}
                </Label>
                <Input
                  id="edit-headquarters_city"
                  value={formData.headquarters_city || ""}
                  onChange={(e) =>
                    updateField("headquarters_city", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-us_presence">{t("customerUSPresence")}</Label>
              <Textarea
                id="edit-us_presence"
                value={formData.us_presence || ""}
                onChange={(e) => updateField("us_presence", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-us_subsidiary_name">
                {t("customerUSSubsidiaryName")}
              </Label>
              <Input
                id="edit-us_subsidiary_name"
                value={formData.us_subsidiary_name || ""}
                onChange={(e) =>
                  updateField("us_subsidiary_name", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-website">{t("customerWebsite")}</Label>
              <Input
                id="edit-website"
                type="url"
                value={formData.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
              />
              {validationErrors.website && (
                <p className="text-sm text-red-600">
                  {validationErrors.website}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t("customerNotes")}</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              {t("customerDeleteCancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              <Save className="mr-2 h-4 w-4" />
              {updating ? t("customerEditSaving") : t("customerEditSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomerDetailPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <CustomerDetailContent params={params} />
    </ProtectedRoute>
  );
}
