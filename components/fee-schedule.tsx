"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";

interface Fees { currency: string; fees: { type: string; amount: number }[]; reevaluation_window_months: number }

const T = {
  en: {
    design: ["Design assessment", "Whether your ownership, controls and commitments are designed to address the risks, as of a date."],
    operating: ["Operating assessment", "Adds testing that the controls actually worked over a period."],
    reevaluation: ["Re-evaluation on new evidence", "A new rating after you improve your structure, controls or paperwork, within 24 months of your last TBRAC report."],
    includes: "Each fee covers the whole engagement: document review, screening, scoring, second review, the committee, the certification and 12 months of monitoring. It is the same for every company, paid before the committee meets, and never depends on the result.",
  },
  zh: {
    design: ["设计评估", "评估截至某一日期，贵公司的所有权、内部控制和承诺在设计上是否足以应对相关风险。"],
    operating: ["运营评估", "在设计评估基础上，进一步测试相关控制在一段时期内是否实际有效运行。"],
    reevaluation: ["基于新证据的重新评估", "在改善结构、内部控制或文件资料后重新评级，适用于最近一份 TBRAC 报告出具后 24 个月内。"],
    includes: "每项费用涵盖完整评估：文件审查、筛查、评分、第二审核、委员会决定、认证以及 12 个月持续监测。所有企业费用相同，须在委员会开会前支付，且绝不取决于评估结果。",
  },
};

/** The published flat fees, read live from the API so the page always matches what checkout charges. */
export function FeeSchedule() {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [fees, setFees] = useState<Fees | null>(null);
  useEffect(() => { fetch("/api/v1/public/fees").then((r) => r.json()).then(setFees).catch(() => {}); }, []);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: (fees?.currency ?? "usd").toUpperCase(), maximumFractionDigits: 0 }).format(n);
  return (
    <div className="space-y-4">
      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {(fees?.fees ?? []).map((f) => {
          const [name, desc] = t[f.type as "design" | "operating" | "reevaluation"] ?? [f.type, ""];
          return (
            <div key={f.type} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-4">
              <div className="max-w-xl"><p className="font-semibold text-slate-900">{name}</p><p className="mt-0.5 text-sm text-slate-600">{desc}</p></div>
              <p className="text-xl font-semibold tabular-nums text-slate-900">{fmt(f.amount)}</p>
            </div>
          );
        })}
        {!fees && <p className="px-5 py-4 text-sm text-slate-500">…</p>}
      </div>
      <p className="text-sm leading-relaxed text-slate-600">{t.includes}</p>
    </div>
  );
}
