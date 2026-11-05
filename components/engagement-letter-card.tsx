"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authenticatedRequest } from "@/lib/api-client";
import { useLanguage } from "@/lib/language-context";

interface Letter { id: string; status: string; body_en: string; body_zh: string; body_hash: string; sent_at: string; signer_name: string | null; signer_title: string | null; signed_at: string | null; ai_consent: boolean | null }

const T = {
  en: {
    title: "Engagement letter", due: "TBRAC has sent your engagement letter. Please read it and sign it online.", read: "Read and sign",
    name: "Your full name", jobTitle: "Your title", agree: "I have authority to sign for the company, and I accept this engagement letter.",
    ai: "Optional: the company consents to TBRAC's evaluators using AI reading aids (Groq) on its documents, as described in section 7. AI never decides the rating; you can leave this unticked.",
    sign: "Sign the letter", signing: "Signing…", signed: (n: string, t: string, d: string) => `Signed by ${n}, ${t}, on ${d}.`,
    governs: "The English text governs.", hash: "Document fingerprint", lang: "中文译本", locale: "en-US",
  },
  zh: {
    title: "委托书", due: "TBRAC 已向您发送委托书，请阅读并在线签署。", read: "阅读并签署",
    name: "您的全名", jobTitle: "您的职务", agree: "本人有权代表企业签署，并接受本委托书。",
    ai: "可选：企业同意 TBRAC 评估人员按第 7 条所述，对其文件使用 AI 阅读辅助工具（Groq）。AI 绝不决定评级；您可以不勾选。",
    sign: "签署委托书", signing: "正在签署…", signed: (n: string, t: string, d: string) => `已由 ${n}（${t}）于 ${d} 签署。`,
    governs: "以英文本为准。", hash: "文件数字指纹", lang: "English", locale: "zh-CN",
  },
};

/** The company's officer reads and e-signs the engagement letter (§12.1). */
export function EngagementLetterCard({ customerId }: { customerId: string }) {
  const { language } = useLanguage();
  const t = T[language] ?? T.en;
  const [letters, setLetters] = useState<Letter[]>([]);
  const [open, setOpen] = useState(false);
  const [zh, setZh] = useState(language === "zh");
  const [f, setF] = useState({ name: "", title: "", agree: false, ai: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = () => authenticatedRequest<Letter[]>(`/api/v1/customers/${customerId}/letters`).then(setLetters).catch(() => setLetters([]));
  useEffect(() => { load(); }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps
  const x = letters[0];
  if (!x) return null;
  const day = (d: string) => new Date(d).toLocaleDateString(t.locale, { dateStyle: "long" });
  if (x.status === "signed") return (
    <p className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-700" />{t.title}: {t.signed(x.signer_name ?? "", x.signer_title ?? "", day(x.signed_at!))}</p>
  );
  const sign = async () => {
    setBusy(true); setError("");
    try {
      await authenticatedRequest(`/api/v1/letters/${x.id}/sign`, { method: "POST", body: JSON.stringify({ name: f.name, title: f.title, agree: f.agree, ai_consent: f.ai, body_hash: x.body_hash }) });
      setOpen(false); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign"); } finally { setBusy(false); }
  };
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3"><FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-amber-900" />
          <div><p className="font-semibold text-amber-950">{t.title}</p><p className="text-sm text-amber-900">{t.due}</p></div></div>
        {!open && <Button onClick={() => setOpen(true)}>{t.read}</Button>}
      </div>
      {open && (
        <div className="space-y-4 border-t border-amber-200 bg-white px-5 py-5">
          <div className="flex justify-between text-xs text-slate-500"><span>{t.governs}</span>
            <button type="button" className="font-semibold text-sky-800 hover:underline" onClick={() => setZh(!zh)}>{zh ? "English" : "中文译本"}</button></div>
          <pre className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800">{zh ? x.body_zh : x.body_en}</pre>
          <p className="break-all text-xs text-slate-400">{t.hash}: {x.body_hash}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm"><span className="text-slate-600">{t.name}</span><Input className="mt-1" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="text-sm"><span className="text-slate-600">{t.jobTitle}</span><Input className="mt-1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" className="mt-1" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} />{t.agree}</label>
          <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" className="mt-1" checked={f.ai} onChange={(e) => setF({ ...f, ai: e.target.checked })} />{t.ai}</label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button disabled={busy || !f.agree || f.name.trim().length < 2 || f.title.trim().length < 2} onClick={sign}>{busy ? t.signing : t.sign}</Button>
        </div>
      )}
    </div>
  );
}
