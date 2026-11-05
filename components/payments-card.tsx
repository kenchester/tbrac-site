"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { companyApi, money, type Payment } from "@/lib/certifications";
import { useLanguage } from "@/lib/language-context";

const T = {
  en: { due: "Assessment fee due", paid: "Fee paid", pay: "Pay securely", paying: "Opening checkout…",
        note: "One flat fee, the same for every company. It is paid before the committee meets and never depends on the result.",
        off: "Online payment is not switched on yet. TBRAC will send you an invoice; questions to evaluations@tbrac.org.",
        on: (d: string) => `Paid ${d}`, locale: "en-US", ok: "Payment received. Thank you.", canceled: "Checkout was canceled; nothing was charged." },
  zh: { due: "待支付评估费用", paid: "费用已支付", pay: "安全支付", paying: "正在打开支付页面…",
        note: "固定费用，所有企业相同。须在委员会开会前支付，且绝不取决于评估结果。",
        off: "在线支付尚未开通。TBRAC 将向您发送发票；如有疑问，请联系 evaluations@tbrac.org。",
        on: (d: string) => `已于 ${d} 支付`, locale: "zh-CN", ok: "已收到付款，谢谢。", canceled: "已取消支付，未产生任何扣款。" },
};

/** Fees TBRAC has requested from this company, with checkout. */
export function PaymentsCard({ customerId }: { customerId: string }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [rows, setRows] = useState<Payment[]>([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    companyApi.payments(customerId).then(setRows).catch(() => setRows([]));
    const q = new URLSearchParams(window.location.search).get("payment");
    if (q === "success") setMsg(t.ok); else if (q === "canceled") setMsg(t.canceled);
  }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows.length && !msg) return null;
  const pay = async (p: Payment) => {
    setBusy(p.id); setMsg("");
    const r = await companyApi.checkout(p.id, customerId);
    if (r.url) { window.location.href = r.url; return; }
    setMsg(r.error === "not_enabled" ? t.off : r.error ?? "Checkout failed"); setBusy("");
  };
  const fmt = (d: string) => new Date(d).toLocaleDateString(t.locale, { dateStyle: "medium" });
  return (
    <section className="space-y-3">
      {msg && <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{msg}</p>}
      {rows.map((p) => p.status === "requested" ? (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4">
          <div>
            <p className="font-semibold text-amber-950">{t.due}: {money(p.amount_cents, p.currency)}</p>
            <p className="text-sm text-amber-900">{p.description}. {t.note}</p>
          </div>
          <Button disabled={busy === p.id} onClick={() => pay(p)}><CreditCard className="mr-2 h-4 w-4" />{busy === p.id ? t.paying : t.pay}</Button>
        </div>
      ) : (
        <p key={p.id} className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />{t.paid}: {p.description}, {money(p.amount_cents, p.currency)} · {p.paid_at && t.on(fmt(p.paid_at))}
        </p>
      ))}
    </section>
  );
}
