"use client";

import { docZh } from "@/lib/assessment-docs-zh";
import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { useAssessmentModule, useSaveModuleAnswers } from "@/hooks/use-assessments";
import { useCustomerDocuments } from "@/hooks/use-documents";
import { useApiToast } from "@/hooks/use-api-toast";
import { api, APIError } from "@/lib/api-client";
import { getModuleByKey } from "@/lib/assessment-data";
import type { Question } from "@/lib/assessment-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Upload,
  FileText,
  Trash2,
  Download,
  Loader2,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatFileSize, formatDate } from "@/lib/format-utils";
import { useLanguage } from "@/lib/language-context";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { useCustomer } from "@/hooks/use-customers";

interface PageProps {
  params: Promise<{
    id: string;
    assessmentId: string;
    moduleKey: string;
  }>;
}

function QuestionSlider({
  question,
  value,
  onChange,
  disabled,
  language,
}: {
  question: Question;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  language: string;
}) {
  const text = language === "zh" ? question.text_zh : question.text;
  const anchorLow = language === "zh" ? question.anchor_low_zh : question.anchor_low;
  const anchorHigh = language === "zh" ? question.anchor_high_zh : question.anchor_high;

  return (
    <div className="space-y-3 py-4 border-b last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0">
          {question.id.split("_")[1].toUpperCase()}
        </span>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-snug">{text}</p>
          {question.document_hint && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3 w-3" />
                    {language === "zh" ? "文件提示" : "Document hint"}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">{docZh(question.document_hint, language)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-lg font-bold w-8 text-right shrink-0">{value}</span>
      </div>
      <div className="space-y-1.5">
        <Slider
          min={0}
          max={10}
          step={1}
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="max-w-[45%] leading-tight">{anchorLow}</span>
          <span className="max-w-[45%] text-right leading-tight">{anchorHigh}</span>
        </div>
      </div>
    </div>
  );
}

function ModulePageContent({ params }: PageProps) {
  const { id: customerId, assessmentId, moduleKey } = use(params);
  const router = useRouter();
  const { t, language } = useLanguage();
  const { data: customer } = useCustomer(customerId);
  const { data: moduleData, loading, error, refetch } = useAssessmentModule(
    assessmentId,
    moduleKey,
  );
  const { data: allDocs, refetch: refetchDocs } = useCustomerDocuments(customerId, {
    page: 1,
    pageSize: 100,
  });
  const { save, loading: saving } = useSaveModuleAnswers();
  const { handleError, showSuccess } = useApiToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const moduleDef = getModuleByKey(moduleKey);

  // Local state for answers
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [analystNotes, setAnalystNotes] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Sync from loaded data
  useEffect(() => {
    if (moduleData) {
      const initial: Record<string, number> = {};
      moduleDef?.questions.forEach((q) => {
        initial[q.id] = moduleData.responses[q.id] ?? 5;
      });
      setResponses(initial);
      setAnalystNotes(moduleData.analyst_notes ?? "");
      setIsDirty(false);
    }
  }, [moduleData, moduleDef]);

  // Filter module-scoped documents
  const moduleDocs = allDocs?.items.filter(
    (d) => (d as any).assessment_module_id === moduleData?.id,
  ) ?? [];

  const isCompleted = moduleData?.status === "completed";
  const allAnswered =
    moduleDef != null &&
    moduleDef.questions.every((q) => responses[q.id] !== undefined);

  const handleSave = async (complete = false) => {
    if (!moduleDef) return;
    try {
      await save(assessmentId, moduleKey, {
        responses,
        complete,
        analyst_notes: analystNotes || undefined,
      });
      showSuccess(language === "zh" ? (complete ? "模块已完成" : "进度已保存") : (complete ? "Module completed" : "Progress saved"));
      setIsDirty(false);
      if (complete) {
        router.push(`/customers/${customerId}/assessments/${assessmentId}`);
        return;
      }
      refetch();
    } catch (err) {
      handleError(err);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !moduleData) return;
    setUploading(true);
    try {
      await api.moduleDocuments.upload(
        customerId,
        Array.from(files),
        moduleData.id,
      );
      showSuccess(
        `${files.length} file${files.length > 1 ? "s" : ""} uploaded`,
      );
      refetchDocs();
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const { download_url } = await api.documents.getDownloadUrl(docId);
      window.open(download_url, "_blank");
    } catch (err) {
      handleError(err);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await api.documents.delete(docId);
      refetchDocs();
    } catch (err) {
      handleError(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!moduleDef) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-red-600">Module not found: {moduleKey}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push(
                  `/customers/${customerId}/assessments/${assessmentId}`,
                )
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <BreadcrumbNav crumbs={[
                { label: customer?.name ?? "Company", href: `/customers/${customerId}` },
                { label: t("assessmentTitle"), href: `/customers/${customerId}/assessments/${assessmentId}` },
                { label: language === "zh" ? moduleDef.name_zh : moduleDef.name },
              ]} />
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{language === "zh" ? moduleDef.name_zh : moduleDef.name}</h1>
                {isCompleted && (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {t("assessmentModuleCompleted")}
                  </Badge>
                )}
                {moduleData?.score !== null && moduleData?.score !== undefined && (
                  <Badge variant="outline">
                    Score: {moduleData.score}/100
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {language === "zh" ? `模块 ${moduleDef.number}` : `Module ${moduleDef.number}`} · {language === "zh" ? moduleDef.description_zh : moduleDef.description}
              </p>
            </div>
          </div>

          {/* Two-panel layout */}
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left — Questionnaire */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {t("moduleRiskQuestionsTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("moduleRiskQuestionsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {moduleDef.questions.map((q) => (
                    <QuestionSlider
                      key={q.id}
                      question={q}
                      value={responses[q.id] ?? 5}
                      onChange={(v) => {
                        setResponses((prev) => ({ ...prev, [q.id]: v }));
                        setIsDirty(true);
                      }}
                      disabled={isCompleted}
                      language={language}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Analyst Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t("moduleAnalystNotesTitle")}</CardTitle>
                  <CardDescription>
                    {t("moduleAnalystNotesDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={analystNotes}
                    onChange={(e) => {
                      setAnalystNotes(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder={t("moduleAnalystNotesPlaceholder")}
                    rows={4}
                    disabled={isCompleted}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              {!isCompleted && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saving || !isDirty}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {saving ? t("moduleSaving") : t("moduleSaveProgress")}
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={saving || !allAnswered}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    {t("moduleCompleteModule")}
                  </Button>
                  {!allAnswered && (
                    <p className="text-xs text-muted-foreground">
                      {t("moduleAnswerAllMsg")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right — Document Vault */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t("moduleDocVaultTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("moduleDocVaultDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recommended doc types */}
                  {moduleDef.document_types.length > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("moduleRecommendedDocs")}
                      </p>
                      <ul className="space-y-1">
                        {moduleDef.document_types.map((dt) => (
                          <li
                            key={dt}
                            className="text-xs text-muted-foreground flex items-start gap-1.5"
                          >
                            <span className="mt-0.5">·</span>
                            {docZh(dt, language)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Upload area */}
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files);
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    />
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t("moduleUploading")}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {t("moduleClickOrDrag")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("moduleFileTypes")}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Document list */}
                  {moduleDocs.length > 0 ? (
                    <div className="space-y-2">
                      <Separator />
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        {t("moduleUploadedCount")} ({moduleDocs.length})
                      </Label>
                      {moduleDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-xs">
                              {doc.original_filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size_bytes)} ·{" "}
                              {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDownload(doc.id)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      {t("moduleNoDocsYet")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModulePage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <ModulePageContent params={params} />
    </ProtectedRoute>
  );
}
