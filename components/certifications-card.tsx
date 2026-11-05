"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestAssessmentCard } from "@/components/request-assessment-card";
import { certificateUrl, companyApi, verifyUrl, type Certification } from "@/lib/certifications";
import { useLanguage } from "@/lib/language-context";

const TIER = {
  en: { T1: "T1 · Low identified risk", T2: "T2 · Moderate", T3: "T3 · Elevated", T4: "T4 · High", UA: "Unable to assess" } as Record<string, string>,
  zh: { T1: "T1 · 已识别风险低", T2: "T2 · 中等", T3: "T3 · 较高", T4: "T4 · 高", UA: "无法评估" } as Record<string, string>,
};
const STATUS_ZH: Record<string, string> = { Current: "有效", "Under Review": "审查中", Withdrawn: "已撤回", Expired: "已过期", Superseded: "已被取代" };
const T = {
  en: {
    title: "Your TBRAC certification", report: "Report", valid: "Valid until", status: "Status", rating: "Rating",
    share: "Share link", shareNote: "Anyone with this link sees the live status, the public summary and the TBRAC signature. Confidential findings are never shown.",
    copy: "Copy link", copied: "Copied", download: "Download certificate (PDF)", open: "Open public page", email: "Email it",
    emailSubject: (n: string) => `TBRAC certification ${n}`, emailBody: (u: string) => `Our TBRAC certification and its live status: ${u}`,
    earlier: "Earlier reports", reeval: "Request a re-evaluation",
    reevalNote: "Improved your ownership structure, controls or paperwork? A re-evaluation rates you again on new evidence, replaces this report when issued and starts a new 12-month validity.",
    test: "Test report from dummy data", locale: "en-US",
  },
  zh: {
    title: "贵公司的 TBRAC 认证", report: "报告", valid: "有效期至", status: "状态", rating: "评级",
    share: "分享链接", shareNote: "任何获得此链接的人都可以查看实时状态、公开摘要和 TBRAC 签名，保密调查结果绝不会显示。",
    copy: "复制链接", copied: "已复制", download: "下载认证证书（PDF）", open: "打开公开页面", email: "通过邮件发送",
    emailSubject: (n: string) => `TBRAC 认证 ${n}`, emailBody: (u: string) => `我们的 TBRAC 认证及其实时状态：${u}`,
    earlier: "以往报告", reeval: "申请重新评估",
    reevalNote: "已改善所有权结构、内部控制或文件资料？重新评估将依据新证据重新评级，出具后取代本报告，并重新开始 12 个月有效期。",
    test: "测试报告（虚拟数据）", locale: "zh-CN",
  },
};

/** Issued reports for the company: share link, certificate PDF, and re-evaluation. */
export function CertificationsCard({ customerId }: { customerId: string }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const tiers = TIER[language] ?? TIER.en;
  const [rows, setRows] = useState<Certification[]>([]);
  const [copied, setCopied] = useState(false);
  const [reeval, setReeval] = useState(false);
  useEffect(() => { companyApi.certifications(customerId).then(setRows).catch(() => setRows([])); }, [customerId]);
  if (!rows.length) return null;
  const [c, ...older] = rows;
  const url = verifyUrl(c.report_number);
  const day = (d: string) => new Date(d).toLocaleDateString(t.locale, { dateStyle: "long" });
  const status = language === "zh" ? STATUS_ZH[c.status] ?? c.status : c.status;
  const good = c.status === "Current" && !c.test;
  const copy = async () => { await navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
            <p className="mt-1 font-mono text-sm text-slate-500">{c.report_number}</p>
            {c.test && <p className="mt-1 text-sm font-medium text-red-700">{t.test}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${good ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{status}</span>
        </div>
        <dl className="grid gap-4 px-6 py-5 sm:grid-cols-3">
          <div><dt className="text-xs text-slate-500">{t.rating}</dt><dd className="mt-0.5 font-semibold text-slate-900">{c.tier ? tiers[c.tier] ?? c.tier : "—"}</dd></div>
          <div><dt className="text-xs text-slate-500">{t.valid}</dt><dd className="mt-0.5 font-semibold text-slate-900">{day(c.valid_until)}</dd></div>
          <div><dt className="text-xs text-slate-500">{t.status}</dt><dd className="mt-0.5 text-slate-700">{c.status_note || status}</dd></div>
        </dl>
        <div className="space-y-3 border-t border-slate-100 px-6 py-5">
          <p className="text-sm font-medium text-slate-900">{t.share}</p>
          <div className="flex flex-wrap gap-2">
            <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label={t.share}
              className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 font-mono text-sm text-slate-700" />
            <Button variant="outline" size="sm" className="h-9" onClick={copy}>{copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}{copied ? t.copied : t.copy}</Button>
          </div>
          <p className="text-xs text-slate-500">{t.shareNote}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm"><a href={certificateUrl(c.report_number)} target="_blank" rel="noopener"><Download className="mr-1.5 h-4 w-4" />{t.download}</a></Button>
            <Button asChild size="sm" variant="outline"><Link href={`/verify/${c.report_number}`} target="_blank"><ExternalLink className="mr-1.5 h-4 w-4" />{t.open}</Link></Button>
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:?subject=${encodeURIComponent(t.emailSubject(c.report_number))}&body=${encodeURIComponent(t.emailBody(url))}`}><Mail className="mr-1.5 h-4 w-4" />{t.email}</a>
            </Button>
          </div>
        </div>
        {c.can_reevaluate && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="max-w-2xl text-sm text-slate-600">{t.reevalNote}</p>
            {!reeval && <Button size="sm" variant="outline" onClick={() => setReeval(true)}><RefreshCw className="mr-1.5 h-4 w-4" />{t.reeval}</Button>}
          </div>
        )}
        {older.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4 text-sm">
            <p className="text-xs text-slate-500">{t.earlier}</p>
            <ul className="mt-1 space-y-1">{older.map((o) => (
              <li key={o.report_number}><Link href={`/verify/${o.report_number}`} className="font-mono text-sky-800 hover:underline">{o.report_number}</Link>
                <span className="ml-2 text-slate-500">{language === "zh" ? STATUS_ZH[o.status] ?? o.status : o.status}</span></li>
            ))}</ul>
          </div>
        )}
      </div>
      {reeval && <RequestAssessmentCard customerId={customerId} reevaluationOf={c.report_number} startOpen />}
    </section>
  );
}
