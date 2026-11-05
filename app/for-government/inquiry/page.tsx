"use client"

import { useState } from "react"
import { MarketingShell } from "@/components/marketing-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"

const C = {
  en: {
    title: "Ask about a government-directed assessment",
    lead: "Tell us about the decision in front of your body. There is no commitment, and the information you send stays with TBRAC.",
    org: "Organization", type: "Type of body", types: [["county", "County"], ["city", "City or town"], ["edc", "Economic development organization"], ["state_agency", "State agency"], ["port_authority", "Port or public authority"], ["other", "Other"]],
    name: "Your name", jobTitle: "Your title", email: "Work email", phone: "Phone (optional)",
    company: "Company concerned, if you can share it", decision: "The decision", decisions: [["incentive", "Incentive or abatement"], ["land", "Land sale"], ["lease", "Lease"], ["contract", "Public contract"], ["permit", "Permit or approval"], ["other", "Other"]],
    deadline: "When the decision is due (optional)", jurisdiction: "State and any statute you need addressed (optional)", notes: "Anything else (optional)",
    send: "Send inquiry", sending: "Sending…", done: "Thank you. TBRAC has your inquiry and will reply to you directly, usually within one to two business days.", error: "Please complete the required fields and try again.",
  },
  zh: {
    title: "咨询政府主导的评估",
    lead: "请告诉我们贵机构面临的决定。咨询不构成任何承诺，您提供的信息仅由 TBRAC 保存。",
    org: "机构", type: "机构类型", types: [["county", "县"], ["city", "市或镇"], ["edc", "经济发展机构"], ["state_agency", "州政府机构"], ["port_authority", "港口或公共管理机构"], ["other", "其他"]],
    name: "您的姓名", jobTitle: "您的职务", email: "工作邮箱", phone: "电话（可选）",
    company: "相关企业（如可提供）", decision: "待决事项", decisions: [["incentive", "激励或减免"], ["land", "土地出售"], ["lease", "租赁"], ["contract", "公共合同"], ["permit", "许可或批准"], ["other", "其他"]],
    deadline: "决定期限（可选）", jurisdiction: "所在州及需涉及的法律（可选）", notes: "其他信息（可选）",
    send: "发送咨询", sending: "正在发送…", done: "谢谢。TBRAC 已收到您的咨询，通常会在一至两个工作日内直接回复您。", error: "请填写必填项后重试。",
  },
}
const sel = "mt-1 h-9 w-full rounded-md border border-input bg-white px-2 text-sm"

export default function AgencyInquiryPage() {
  const { language } = useLanguage()
  const c = C[language] ?? C.en
  const [f, setF] = useState<Record<string, string>>({ org_type: "county", decision: "incentive" })
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle")
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("busy")
    const r = await fetch("/api/agency-inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) })
    setState(r.ok ? "done" : "error")
  }
  const field = (k: string, label: string, required = false, type = "text") => (
    <label className="block text-sm"><span className="text-slate-700">{label}</span><Input className="mt-1" type={type} required={required} value={f[k] ?? ""} onChange={set(k)} /></label>
  )
  return (
    <MarketingShell title={c.title} lead={c.lead}>
      {state === "done" ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">{c.done}</p> : (
        <form onSubmit={submit} className="max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("organization", c.org, true)}
            <label className="block text-sm"><span className="text-slate-700">{c.type}</span>
              <select className={sel} value={f.org_type} onChange={set("org_type")}>{c.types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            {field("contact_name", c.name, true)}
            {field("contact_title", c.jobTitle)}
            {field("email", c.email, true, "email")}
            {field("phone", c.phone)}
            {field("company", c.company)}
            <label className="block text-sm"><span className="text-slate-700">{c.decision}</span>
              <select className={sel} value={f.decision} onChange={set("decision")}>{c.decisions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            {field("deadline", c.deadline)}
            {field("jurisdiction", c.jurisdiction)}
          </div>
          <label className="block text-sm"><span className="text-slate-700">{c.notes}</span><Textarea className="mt-1" rows={4} value={f.notes ?? ""} onChange={set("notes")} /></label>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website ?? ""} onChange={set("website")} />
          {state === "error" && <p className="text-sm text-red-600">{c.error}</p>}
          <Button type="submit" disabled={state === "busy"}>{state === "busy" ? c.sending : c.send}</Button>
        </form>
      )}
    </MarketingShell>
  )
}
