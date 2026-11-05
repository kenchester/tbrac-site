"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { authenticatedRequest } from "@/lib/api-client";
import { useLanguage } from "@/lib/language-context";

interface Progress { engagement_id: string; kind: string; steps: string[]; current: number; todo: string[]; requests_waiting: number; reply_due_at: string | null }

const T = {
  en: {
    title: { design: "Your comprehensive assessment", operating: "Your comprehensive assessment", reevaluation: "Your re-evaluation" } as Record<string, string>,
    steps: { acceptance: "Acceptance", documents: "Documents", verification: "Verification", reply: "Your reply", committee: "Committee", issued: "Issued" } as Record<string, string>,
    now: {
      acceptance: "TBRAC is confirming the engagement: conflict checks, the engagement letter and the fee.",
      documents: "TBRAC is collecting your documents.",
      verification: "Analysts are verifying your documents, screening the ownership chain and scoring the evidence. You don't need to do anything unless TBRAC asks.",
      reply: "TBRAC has shared its draft factual findings for you to correct.",
      committee: "A second reviewer has checked the work and the committee is deciding. The outcome is not known until the rating is issued.",
    } as Record<string, string>,
    todoTitle: "Waiting for you",
    todo: { sign_letter: "Sign the engagement letter", pay_fee: "Pay the assessment fee", reply: "Reply to the draft findings" } as Record<string, string>,
    requests: (n: number) => `Answer ${n} document request${n === 1 ? "" : "s"}`, by: "by", locale: "en-US",
  },
  zh: {
    title: { design: "贵公司的全面评估", operating: "贵公司的全面评估", reevaluation: "贵公司的重新评估" } as Record<string, string>,
    steps: { acceptance: "受理", documents: "文件", verification: "核实", reply: "您的回复", committee: "委员会", issued: "出具" } as Record<string, string>,
    now: {
      acceptance: "TBRAC 正在确认委托事项：利益冲突审查、委托书和费用。",
      documents: "TBRAC 正在收集贵公司的文件。",
      verification: "分析师正在核实文件、筛查所有权链并对证据评分。除非 TBRAC 提出要求，您无需采取任何行动。",
      reply: "TBRAC 已提供事实性调查结果草稿，供您更正。",
      committee: "第二审核人已完成复核，委员会正在作出决定。评级出具前，结果尚不可知。",
    } as Record<string, string>,
    todoTitle: "等待您处理",
    todo: { sign_letter: "签署委托书", pay_fee: "支付评估费用", reply: "回复调查结果草稿" } as Record<string, string>,
    requests: (n: number) => `回复 ${n} 项文件请求`, by: "截止", locale: "zh-CN",
  },
};

/** Where each comprehensive assessment in progress stands, and what is waiting for the company. */
export function AssessmentProgress({ customerId }: { customerId: string }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [rows, setRows] = useState<Progress[]>([]);
  useEffect(() => { authenticatedRequest<Progress[]>(`/api/v1/customers/${customerId}/assessment-progress`).then(setRows).catch(() => setRows([])); }, [customerId]);
  if (!rows.length) return null;
  return (
    <section className="space-y-4">
      {rows.map((p) => {
        const step = p.steps[p.current];
        const todo = p.todo.map((k) => k === "answer_requests" ? t.requests(p.requests_waiting) : k === "reply" && p.reply_due_at
          ? `${t.todo.reply} (${t.by} ${new Date(p.reply_due_at).toLocaleDateString(t.locale, { dateStyle: "medium" })})` : t.todo[k]);
        return (
          <div key={p.engagement_id} className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">{t.title[p.kind] ?? t.title.design}</h2>
            <ol className="mt-5 grid grid-cols-6 gap-1" aria-label={t.title[p.kind]}>
              {p.steps.map((s, i) => (
                <li key={s} className="min-w-0" aria-current={i === p.current ? "step" : undefined}>
                  <div className={`h-1.5 rounded-full ${i < p.current ? "bg-[#0b1f3a]" : i === p.current ? "bg-sky-600" : "bg-slate-200"}`} />
                  <p className={`mt-2 flex items-center gap-1 truncate text-xs ${i === p.current ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                    {i < p.current && <Check className="hidden h-3 w-3 shrink-0 text-[#0b1f3a] sm:block" />}<span className={i === p.current ? "" : "hidden sm:inline"}>{t.steps[s]}</span>
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{t.now[step]}</p>
            {todo.length > 0 && (
              <div className="mt-3 text-sm"><p className="font-medium text-slate-900">{t.todoTitle}</p>
                <ul className="mt-1 list-disc pl-5 text-slate-700">{todo.map((x) => <li key={x}>{x}</li>)}</ul></div>
            )}
          </div>
        );
      })}
    </section>
  );
}
