"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Source_Serif_4 } from "next/font/google";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { PortalHeader } from "@/components/portal-header";
import { Copyright } from "@/components/copyright";
import { useCustomer } from "@/hooks/use-customers";
import { useCreateAssessment } from "@/hooks/use-assessments";
import { useApiToast } from "@/hooks/use-api-toast";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"] });

const C = {
  en: {
    back: "Back to overview", step: "Step 1 · Free",
    title: "Start the self-assessment",
    lead: "Ten short modules cover the same seven risk domains as the comprehensive assessment. Answer them in any order; your answers are saved as you go.",
    expectTitle: "What to expect",
    expect: [
      "10 modules, each with 10 questions scored on a 0–10 scale",
      "AI guidance in English and Chinese as you answer",
      "Optional supporting documents for each module",
      "An indicative score and the red flags to fix first when you submit",
    ],
    privacy: "Private to your company. Nothing is published, and your answers are not verified, so the result is for your own preparation, not a TBRAC certification.",
    company: "Company", cancel: "Cancel", create: "Begin the self-assessment", creating: "Creating…", created: "Self-assessment created",
  },
  zh: {
    back: "返回概览", step: "第一步 · 免费",
    title: "开始自我评估",
    lead: "10 个简短模块涵盖与全面评估相同的七个风险领域。可按任意顺序作答，回答会自动保存。",
    expectTitle: "评估内容",
    expect: [
      "共 10 个模块，每个模块 10 个问题，按 0–10 分评分",
      "作答时提供中英文 AI 指导",
      "可为每个模块上传支持文件（可选）",
      "提交后获得参考评分以及需要优先处理的风险信号",
    ],
    privacy: "仅贵公司可见，不会公开。您的回答未经核实，因此结果仅供贵公司自行准备之用，并非 TBRAC 认证。",
    company: "企业", cancel: "取消", create: "开始自我评估", creating: "正在创建…", created: "已创建自我评估",
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function NewAssessmentContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { language } = useLanguage();
  const c = C[language] ?? C.en;
  const { data: customer, loading: customerLoading } = useCustomer(resolvedParams.id);
  const { create, loading } = useCreateAssessment();
  const { handleError, showSuccess } = useApiToast();
  const home = `/customers/${resolvedParams.id}`;

  const handleCreate = async () => {
    if (!customer) return;
    try {
      const assessment = await create({ customer_id: customer.id });
      if (assessment) {
        showSuccess(c.created);
        router.push(`${home}/assessments/${assessment.id}`);
      }
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link href={home} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />{c.back}
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-7 py-7">
            <p className="text-xs font-medium text-slate-500">{c.step}</p>
            <h1 className={`${serif.className} mt-1 text-3xl font-semibold tracking-tight text-slate-900`}>{c.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{c.lead}</p>
            <div className="mt-4 text-sm text-slate-500">
              {customerLoading ? <Skeleton className="h-4 w-64" /> : customer && (
                <>{c.company}: <span className="font-medium text-slate-900">{customer.name}</span>
                  {customer.chinese_name && <span className="ml-1">（{customer.chinese_name}）</span>}</>
              )}
            </div>
          </div>

          <div className="px-7 py-6">
            <h2 className="text-sm font-semibold text-slate-900">{c.expectTitle}</h2>
            <ul className="mt-3 space-y-2.5">
              {c.expect.map((x) => (
                <li key={x} className="flex gap-3 text-[15px] text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{x}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />{c.privacy}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-7 py-5">
            <Button type="button" variant="outline" onClick={() => router.push(home)} disabled={loading}>{c.cancel}</Button>
            <Button onClick={handleCreate} disabled={loading || customerLoading || !customer}>
              {loading ? c.creating : c.create}<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      <Copyright />
    </div>
  );
}

export default function NewAssessmentPage({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <NewAssessmentContent params={params} />
    </ProtectedRoute>
  );
}
