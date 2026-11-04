"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { RequestAssessmentCard } from "@/components/request-assessment-card";
import { PortalHeader } from "@/components/portal-header";
import { useCustomer } from "@/hooks/use-customers";
import { useAssessment, useSubmitAssessment } from "@/hooks/use-assessments";
import { useApiToast } from "@/hooks/use-api-toast";
import { ASSESSMENT_MODULES, getModuleByKey } from "@/lib/assessment-data";
import type { AssessmentModuleSummary, RiskTier } from "@/lib/api-types";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Send,
  ChevronRight,
} from "lucide-react";
import { AssessmentChatbot } from "@/components/assessment-chatbot";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

interface PageProps {
  params: Promise<{ id: string; assessmentId: string }>;
}

const TIER_STYLE: Record<RiskTier, { className: string; key: string }> = {
  low: { className: "bg-green-50 text-green-700 border-green-200", key: "tierLow" },
  medium: { className: "bg-yellow-50 text-yellow-700 border-yellow-200", key: "tierMedium" },
  high: { className: "bg-orange-50 text-orange-700 border-orange-200", key: "tierHigh" },
  very_high: { className: "bg-red-50 text-red-700 border-red-200", key: "tierVeryHigh" },
};

function RiskTierBadge({ tier, t }: { tier: RiskTier | null; t: (key: string) => string }) {
  if (!tier) return <Badge variant="outline">Not scored</Badge>;
  const style = TIER_STYLE[tier];
  return (
    <Badge variant="outline" className={style?.className ?? ""}>
      {style ? t(style.key) : tier}
    </Badge>
  );
}

function ModuleStatusIcon({ status }: { status: string }) {
  if (status === "completed")
    return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />;
  if (status === "in_progress")
    return <Clock className="h-5 w-5 text-yellow-500 shrink-0" />;
  return <Circle className="h-5 w-5 text-muted-foreground shrink-0" />;
}

function moduleStatusLabel(status: string, t: (k: string) => string): string {
  if (status === "completed") return t("statusCompleted");
  if (status === "in_progress") return t("statusInProgress");
  return t("statusNotStarted");
}

function moduleStatusVariant(
  status: string,
): "default" | "secondary" | "outline" {
  if (status === "completed") return "default";
  if (status === "in_progress") return "secondary";
  return "outline";
}

function AssessmentDashboardContent({ params }: PageProps) {
  const { id: customerId, assessmentId } = use(params);
  const router = useRouter();
  const { data: customer } = useCustomer(customerId);
  const { data: assessment, loading, error, refetch } = useAssessment(assessmentId);
  const { submit, loading: submitting } = useSubmitAssessment();
  const { handleError, showSuccess } = useApiToast();

  const { t, language } = useLanguage();

  const handleSubmit = async () => {
    try {
      await submit(assessmentId);
      showSuccess("Assessment submitted");
      refetch();
    } catch (err) {
      handleError(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background">
        <PortalHeader />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-red-600">{error || "Assessment not found"}</p>
          <Button className="mt-4" onClick={() => router.push(`/customers/${customerId}`)}>
            Back to Customer
          </Button>
        </div>
      </div>
    );
  }

  const modulesMap = new Map<string, AssessmentModuleSummary>(
    assessment.modules.map((m) => [m.module_key, m]),
  );
  const completedCount = assessment.modules.filter(
    (m) => m.status === "completed",
  ).length;
  const allCompleted = completedCount === 10;
  const canSubmit = allCompleted && assessment.status !== "submitted";

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/customers/${customerId}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <BreadcrumbNav crumbs={[
                  { label: customer?.name ?? "Company", href: `/customers/${customerId}` },
                  { label: t("assessmentTitle") },
                ]} />
                <h1 className="text-3xl font-bold">{t("assessmentTitle")}</h1>
                {customer && (
                  <p className="text-muted-foreground mt-1">{customer.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {assessment.status === "submitted" ? (
                <Badge className="bg-green-600 text-white">{t("assessmentSubmitted")}</Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {t("assessmentInProgress")}
                </Badge>
              )}
              {canSubmit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={submitting}>
                      <Send className="mr-2 h-4 w-4" />
                      {submitting ? t("assessmentSubmitting") : t("assessmentSubmit")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("assessmentSubmitConfirm")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("assessmentSubmitDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("btnCancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmit}>
                        {t("assessmentSubmit")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Score Summary */}
          {(assessment.status === "submitted" || assessment.status === "completed") && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overallRiskScore")}</p>
                    <p className={`text-5xl font-bold mt-1 ${
                      assessment.total_score == null ? "" :
                      assessment.total_score <= 30 ? "text-green-600" :
                      assessment.total_score <= 50 ? "text-yellow-600" :
                      assessment.total_score <= 70 ? "text-orange-600" :
                      "text-red-600"
                    }`}>
                      {assessment.total_score ?? "—"}
                      <span className="text-2xl text-muted-foreground font-normal">
                        /100
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("higherScoreHigherRisk")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">{t("riskTier")}</p>
                    <RiskTierBadge tier={assessment.risk_tier} t={t} />
                  </div>
                </div>
                {assessment.red_flags && assessment.red_flags.length > 0 && (
                  <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-800">{t("redFlagsTitle")}</p>
                    <p className="mt-1 text-xs text-red-700">{t("redFlagsIntro")}</p>
                    <ul className="mt-2 space-y-1.5">
                      {assessment.red_flags.map((f) => {
                        const q = getModuleByKey(f.module_key)?.questions.find((x) => x.id === f.question_id);
                        return (
                          <li key={f.question_id} className="flex gap-2 text-sm text-red-900">
                            <Badge
                              variant="outline"
                              className={f.severity === "hard" ? "border-red-400 text-red-700" : "border-orange-400 text-orange-700"}
                            >
                              {t(f.severity === "hard" ? "redFlagHard" : "redFlagSoft")}
                            </Badge>
                            <span>{q ? (language === "zh" ? q.text_zh : q.text) : f.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {t("selfAssessmentNotice")}
                </p>
              </CardContent>
            </Card>
          )}

          {(assessment.status === "submitted" || assessment.status === "completed") && (
            <RequestAssessmentCard customerId={customerId} assessmentId={assessment.id} />
          )}

          {/* Progress */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{completedCount}</span>{" "}
              {t("assessmentProgress")}
            </p>
            <div className="h-2 w-48 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(completedCount / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Module Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ASSESSMENT_MODULES.map((mod) => {
              const moduleData = modulesMap.get(mod.key);
              const status = moduleData?.status ?? "not_started";
              const score = moduleData?.score;
              const isSubmitted = assessment.status === "submitted";

              return (
                <Card
                  key={mod.key}
                  className={`relative cursor-pointer transition-all hover:shadow-md ${
                    status === "completed"
                      ? "border-green-200 bg-green-50/30"
                      : status === "in_progress"
                        ? "border-yellow-200 bg-yellow-50/20"
                        : "hover:border-primary/30"
                  }`}
                  onClick={() => {
                    router.push(
                      `/customers/${customerId}/assessments/${assessmentId}/modules/${mod.key}`,
                    );
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ModuleStatusIcon status={status} />
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("assessmentModulePrefix")} {mod.number}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base leading-tight mt-1">
                      {language === "zh" ? mod.name_zh : mod.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {language === "zh" ? mod.description_zh : mod.description}
                    </p>
                    {score !== null && score !== undefined ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-600 text-white border-green-600"
                          >
                            {t("assessmentModuleCompleted")}
                          </Badge>
                          <span
                            className={`text-lg font-bold ${
                              score >= 70
                                ? "text-green-600"
                                : score >= 40
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {score}
                            <span className="text-xs font-normal text-muted-foreground">
                              /100
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              score >= 70
                                ? "bg-green-500"
                                : score >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <Badge
                        variant={moduleStatusVariant(status)}
                        className={`text-xs ${
                          status === "in_progress"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : ""
                        }`}
                      >
                        {moduleStatusLabel(status, t)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!allCompleted && assessment.status !== "submitted" && (
            <p className="text-sm text-center text-muted-foreground">
              {t("assessmentAllModulesMsg")}
            </p>
          )}
        </div>
      </div>
      <AssessmentChatbot
        assessmentId={assessmentId}
        companyName={customer?.name ?? ""}
      />
    </div>
  );
}

export default function AssessmentDashboardPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <AssessmentDashboardContent params={params} />
    </ProtectedRoute>
  );
}
